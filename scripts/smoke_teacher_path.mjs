/**
 * Prove that a real teacher can actually plan — end to end, against RLS.
 *
 *   cd /opt/teacher-planner
 *   docker run --rm -v /root/smoke_teacher_path.mjs:/app/s.mjs -w /app \
 *     --env-file .env node:22-alpine node s.mjs --email teacher@… --password '…'
 *
 *   Add --reset-password to set a fresh temp password first and print it.
 *   Only do that for an account whose password is unknown or unused.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every other check in this project runs as the service role, which bypasses
 * Row Level Security and therefore proves nothing about what a teacher can do.
 * The failure this catches is specific and silent: if `teachers.profile_id` is
 * not linked to the signed-in user, `current_teacher_id()` returns null, every
 * write policy rejects the insert, and the teacher sees a save that does not
 * save. The dashboard looks perfect right up until the moment it matters.
 *
 * So this signs in as a genuine user, over the anon key, exactly as the
 * browser does, and attempts the real work: resolve the teacher identity,
 * write a lesson plan, tag a standard, then delete both. It leaves nothing
 * behind — a smoke test that litters the school's records is worse than none.
 *
 * Exit 0 only if every step passed.
 */

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] : null;
};
const RESET = args.includes("--reset-password");
const EMAIL = (arg("--email") ?? "").toLowerCase();
let PASSWORD = arg("--password");

const URL_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !ANON) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and _ANON_KEY are required.");
  process.exit(78);
}
if (!EMAIL) {
  console.error("Usage: node smoke_teacher_path.mjs --email <addr> [--password <pw> | --reset-password]");
  process.exit(64);
}

let failed = 0;
const step = (ok, label, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed += 1;
  return ok;
};

async function call(path, { method = "GET", token, body, headers = {} } = {}) {
  const res = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: {
      apikey: token === SERVICE ? SERVICE : ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { ok: res.ok, status: res.status, payload };
}

function tempPassword() {
  const a = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i += 1) s += a[Math.floor(Math.random() * a.length)];
  return `Sca-${s}`;
}

async function main() {
  console.log(`\nTEACHER PATH SMOKE TEST — ${EMAIL}\n`);

  if (RESET) {
    if (!SERVICE) {
      console.error("--reset-password needs SUPABASE_SERVICE_ROLE_KEY.");
      process.exit(78);
    }
    const list = await call(
      `/auth/v1/admin/users?page=1&per_page=200`,
      { token: SERVICE },
    );
    const user = (list.payload?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === EMAIL,
    );
    if (!user) {
      console.error(`No auth account for ${EMAIL}.`);
      process.exit(1);
    }
    if (user.last_sign_in_at) {
      // Refuse to silently clobber a password someone is actually using.
      console.error(
        `Refusing to reset: ${EMAIL} has signed in before (${user.last_sign_in_at}).\n` +
          "Pass --password with the real password instead.",
      );
      process.exit(1);
    }
    PASSWORD = tempPassword();
    const put = await call(`/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      token: SERVICE,
      body: { password: PASSWORD },
    });
    step(put.ok, "temp password set", put.ok ? "" : JSON.stringify(put.payload));
    if (!put.ok) process.exit(1);
  }

  if (!PASSWORD) {
    console.error("Need --password or --reset-password.");
    process.exit(64);
  }

  // 1. Sign in exactly as the browser does: anon key, password grant.
  const signIn = await call("/auth/v1/token?grant_type=password", {
    method: "POST",
    token: ANON,
    body: { email: EMAIL, password: PASSWORD },
  });
  if (!step(signIn.ok, "sign in", signIn.ok ? "" : JSON.stringify(signIn.payload))) {
    process.exit(1);
  }
  const jwt = signIn.payload.access_token;

  // 2. The identity link. This is the one that silently breaks everything.
  const who = await call("/rest/v1/rpc/current_teacher_id", {
    method: "POST",
    token: jwt,
    body: {},
  });
  const teacherId = typeof who.payload === "string" ? who.payload : null;
  step(
    Boolean(teacherId),
    "current_teacher_id() resolves",
    teacherId ?? "NULL — teachers.profile_id is not linked; no write will succeed",
  );
  if (!teacherId) process.exit(1);

  // 3. Their own classes, read under their own policies.
  const classes = await call(
    `/rest/v1/classes?select=id,name,subject,grade_level&teacher_id=eq.${teacherId}&order=name`,
    { token: jwt },
  );
  const cls = (classes.payload ?? [])[0];
  step(Boolean(cls), "reads own classes", cls ? `${classes.payload.length} classes, using "${cls.name}"` : "none found");
  if (!cls) process.exit(1);

  // 4. The actual work: write a lesson plan.
  const today = new Date().toISOString().slice(0, 10);
  const created = await call("/rest/v1/lesson_plans", {
    method: "POST",
    token: jwt,
    body: {
      class_id: cls.id,
      teacher_id: teacherId,
      title: "SMOKE TEST — safe to delete",
      tier: "daily",
      lesson_date: today,
      objective: "Automated check that a teacher can save a plan.",
    },
    headers: { Prefer: "return=representation" },
  });
  const plan = created.ok ? created.payload[0] : null;
  step(
    Boolean(plan),
    "writes a lesson plan",
    plan ? plan.id : `${created.status} ${JSON.stringify(created.payload)}`,
  );

  // 5. Tag a standard — the join table added in 0016, which the form now uses.
  let linked = false;
  if (plan) {
    const std = await call(
      `/rest/v1/curriculum_standards?select=id,code&grade_level=eq.${cls.grade_level}&limit=1`,
      { token: jwt },
    );
    const standard = (std.payload ?? [])[0];
    if (standard) {
      const link = await call("/rest/v1/lesson_plan_standards", {
        method: "POST",
        token: jwt,
        body: { lesson_plan_id: plan.id, standard_id: standard.id },
      });
      linked = link.ok;
      step(link.ok, "tags a standard", link.ok ? standard.code : JSON.stringify(link.payload));
    } else {
      step(false, "tags a standard", `no standards found for grade ${cls.grade_level}`);
    }
  }

  // 6. Clean up. The join row goes with the plan via ON DELETE CASCADE.
  if (plan) {
    const del = await call(`/rest/v1/lesson_plans?id=eq.${plan.id}`, {
      method: "DELETE",
      token: jwt,
    });
    step(del.ok, "deletes its own test plan", del.ok ? "" : JSON.stringify(del.payload));

    const check = await call(`/rest/v1/lesson_plans?id=eq.${plan.id}&select=id`, {
      token: jwt,
    });
    step(
      Array.isArray(check.payload) && check.payload.length === 0,
      "nothing left behind",
      Array.isArray(check.payload) && check.payload.length ? "ROW STILL PRESENT" : "",
    );
  }

  console.log(
    `\n${failed === 0 ? "ALL CHECKS PASSED" : `${failed} CHECK(S) FAILED`}` +
      (RESET ? `\n\n  Temp password for ${EMAIL}:  ${PASSWORD}\n  Hand it over directly; have them change it after first sign-in.` : "") +
      (linked ? "" : "\n  (standard tagging did not complete — see above)") +
      "\n",
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`\nFailed: ${e.message}\n`);
  process.exit(1);
});
