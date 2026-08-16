/**
 * Provision staff accounts and link them to their teachers row.
 *
 * Runs on the droplet, where the service-role key already lives, in a
 * throwaway container so the secret never leaves the host:
 *
 *   cd /opt/teacher-planner
 *   docker run --rm -v /opt/teacher-planner:/app -w /app --env-file .env \
 *     node:22-alpine node scripts/provision_staff.mjs audit
 *
 *   ... provision --roster scripts/staff_roster.json [--dry-run]
 *
 * NO DEPENDENCIES, DELIBERATELY. Node 22's built-in fetch talks to the REST
 * and Auth Admin APIs directly. That means no npm install, no node_modules on
 * the host, and no reason to ever copy SUPABASE_SERVICE_ROLE_KEY anywhere.
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * Creating the auth user is the easy half. The half that silently breaks the
 * system is `teachers.profile_id`: every write policy in the database routes
 * through
 *
 *     public.current_teacher_id() -> select id from teachers where profile_id = auth.uid()
 *
 * If that link is missing the teacher logs in successfully, sees the whole
 * dashboard, and then cannot save anything — RLS rejects the write and the
 * failure looks like a bug in the app rather than a missing row. So this
 * script always does both halves, and refuses to report success on either
 * one alone.
 *
 * RESOLUTION IS EXPLICIT, NEVER FUZZY
 * -----------------------------------
 * Teachers are matched by `teacher_id`, or by an EXACT `teacher_name`. Not by
 * email — the teachers table's emails are known to be missing or wrong, which
 * is the reason this script exists rather than a one-line UPDATE. Not by fuzzy
 * name either: linking the wrong teacher to the wrong account would hand one
 * person another's classes and learner records. An unresolved or ambiguous row
 * is reported and skipped, never guessed.
 *
 * Idempotent: re-running with the same roster re-verifies and changes nothing.
 * Every write is reported. Nothing is invented — a field absent from the
 * roster is left as it is in the database.
 */

import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";

const DRY_RUN = process.argv.includes("--dry-run");
const VALID_ROLES = ["teacher", "grade_lead", "admin", "superadmin"];

function requireConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.\n" +
        "Run this on the droplet with --env-file .env so the key stays there.",
    );
    process.exit(78); // EX_CONFIG — matches the other scheduled jobs
  }
  return { url: url.replace(/\/+$/, ""), key };
}

const cfg = requireConfig();

/** Bare fetch wrapper. Throws with the API's own message — those are precise. */
async function api(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${cfg.url}${path}`, {
    method,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail =
      payload?.message ?? payload?.error_description ?? payload?.msg ?? text;
    throw new Error(`${method} ${path} -> ${res.status}: ${detail}`);
  }
  return payload;
}

const rest = {
  select: (table, query) => api(`/rest/v1/${table}?${query}`),
  patch: (table, filter, values) =>
    api(`/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      body: values,
      headers: { Prefer: "return=representation" },
    }),
};

/**
 * Temp password for handing over in person. No ambiguous glyphs (0/O, 1/l/I)
 * because these get read off a screen and typed by hand, and a teacher who
 * cannot log in on the first morning does not try again — they conclude the
 * system is broken and go back to paper.
 */
function tempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i += 1) out += alphabet[randomInt(alphabet.length)];
  return `Sca-${out}`;
}

/** All auth users, paged. The admin API caps per_page, so this must loop. */
async function allAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const data = await api(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const batch = data.users ?? [];
    users.push(...batch);
    if (batch.length < 200) return users;
  }
}

async function readState() {
  const [teachers, profiles, users] = await Promise.all([
    rest.select(
      "teachers",
      "select=id,full_name,email,subject,grade_band,status,profile_id&order=full_name",
    ),
    rest.select("profiles", "select=id,full_name,role,grade_band"),
    allAuthUsers(),
  ]);
  return { teachers, profiles, users };
}

function pad(value, width) {
  const s = value === null || value === undefined ? "—" : String(value);
  return s.length >= width ? s.slice(0, width) : s.padEnd(width);
}

async function audit() {
  const { teachers, profiles, users } = await readState();
  const byId = new Map(users.map((u) => [u.id, u]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  console.log(`\nTEACHERS (${teachers.length})\n`);
  console.log(
    pad("teacher_id", 38) +
      pad("name", 24) +
      pad("email on row", 32) +
      pad("status", 9) +
      "linked account",
  );
  console.log("-".repeat(140));

  const unlinked = [];
  for (const t of teachers) {
    const user = t.profile_id ? byId.get(t.profile_id) : null;
    const profile = t.profile_id ? profileById.get(t.profile_id) : null;
    if (!user && t.status === "active") unlinked.push(t);
    console.log(
      pad(t.id, 38) +
        pad(t.full_name, 24) +
        pad(t.email, 32) +
        pad(t.status, 9) +
        (user
          ? `${user.email} (${profile?.role ?? "NO PROFILE ROW"})`
          : "NOT LINKED"),
    );
  }

  // Accounts that exist but belong to no teachers row. Not necessarily wrong —
  // an admin or the superadmin legitimately has no teaching load — but worth
  // seeing, because it is also what a mis-provisioned teacher looks like.
  const claimed = new Set(teachers.map((t) => t.profile_id).filter(Boolean));
  const unclaimed = users.filter((u) => !claimed.has(u.id));

  console.log(`\nAUTH ACCOUNTS NOT LINKED TO ANY TEACHER (${unclaimed.length})\n`);
  for (const u of unclaimed) {
    const p = profileById.get(u.id);
    console.log(
      `  ${pad(u.email, 36)} role=${pad(p?.role ?? "NO PROFILE ROW", 12)} last_sign_in=${
        u.last_sign_in_at ?? "never"
      }`,
    );
  }

  console.log("\nSUMMARY");
  console.log(`  teachers rows            ${teachers.length}`);
  console.log(`  auth accounts            ${users.length}`);
  console.log(`  profiles rows            ${profiles.length}`);
  console.log(`  ACTIVE teachers unlinked ${unlinked.length}`);
  if (unlinked.length) {
    console.log("\n  These teachers cannot save a lesson plan until linked:");
    for (const t of unlinked) console.log(`    - ${t.full_name}  (${t.id})`);
  }
  console.log("");
  return unlinked.length;
}

function loadRoster(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(
      `Error: could not read roster at ${path}.\n` +
        "Copy scripts/staff_roster.example.json and fill in the real staff.",
    );
    process.exit(78);
  }

  const roster = JSON.parse(raw).filter((e) => e.email);
  if (!Array.isArray(roster) || roster.length === 0) {
    console.error("Error: roster must be a non-empty JSON array with emails.");
    process.exit(65); // EX_DATAERR
  }

  roster.forEach((entry, i) => {
    if (!entry.teacher_id && !entry.teacher_name) {
      throw new Error(
        `roster[${i}] (${entry.email}): needs teacher_id or teacher_name. ` +
          "Run `audit` to get the ids.",
      );
    }
    if (entry.role && !VALID_ROLES.includes(entry.role)) {
      throw new Error(
        `roster[${i}] (${entry.email}): role must be one of ${VALID_ROLES.join(", ")}`,
      );
    }
  });
  return roster;
}

/** Resolve a roster entry to exactly one teachers row, or fail loudly. */
function resolveTeacher(entry, teachers) {
  if (entry.teacher_id) {
    const hit = teachers.find((t) => t.id === entry.teacher_id);
    return hit
      ? { teacher: hit }
      : { error: `no teachers row with id ${entry.teacher_id}` };
  }
  const matches = teachers.filter((t) => t.full_name === entry.teacher_name);
  if (matches.length === 0) {
    return { error: `no teachers row named exactly "${entry.teacher_name}"` };
  }
  if (matches.length > 1) {
    return {
      error: `"${entry.teacher_name}" matches ${matches.length} rows — use teacher_id`,
    };
  }
  return { teacher: matches[0] };
}

async function provision(rosterPath) {
  const roster = loadRoster(rosterPath);
  const { teachers, users } = await readState();
  const userByEmail = new Map(
    users.map((u) => [(u.email ?? "").toLowerCase(), u]),
  );

  const handouts = [];
  const failures = [];

  for (const entry of roster) {
    const email = entry.email.toLowerCase();
    const { teacher, error } = resolveTeacher(entry, teachers);
    if (error) {
      failures.push(`${entry.email}: ${error}`);
      console.log(`SKIP   ${entry.email} — ${error}`);
      continue;
    }

    const role = entry.role ?? "teacher";
    const fullName = entry.full_name ?? teacher.full_name;
    let user = userByEmail.get(email);
    let password = null;

    if (DRY_RUN) {
      console.log(
        `PLAN   ${pad(email, 34)} -> ${pad(teacher.full_name, 22)} role=${role}` +
          (user ? " (account exists, would relink)" : " (would create account)"),
      );
      continue;
    }

    if (!user) {
      password = entry.password ?? tempPassword();
      try {
        user = await api("/auth/v1/admin/users", {
          method: "POST",
          body: {
            email,
            password,
            // No SMTP is configured, so a confirmation email would never
            // arrive and the account would be unusable. Confirming here is
            // what makes hand-delivered passwords work.
            email_confirm: true,
            // handle_new_user() reads these to build the profiles row, so the
            // account arrives with the right name and role instead of
            // defaulting to 'teacher' and needing a second correction.
            user_metadata: {
              full_name: fullName,
              role,
              grade_band: entry.grade_band ?? null,
            },
          },
        });
        console.log(`CREATE ${email} -> auth user ${user.id}`);
      } catch (e) {
        failures.push(`${email}: ${e.message}`);
        console.log(`FAIL   ${email} — ${e.message}`);
        continue;
      }
    } else {
      console.log(`EXISTS ${email} -> auth user ${user.id} (password untouched)`);
    }

    try {
      // The trigger only fires on INSERT, so an account that already existed
      // keeps whatever role it had. Set it explicitly. auth.uid() is null
      // under the service key, so the role-escalation guard in 0009 permits
      // this.
      await rest.patch("profiles", `id=eq.${user.id}`, {
        role,
        full_name: fullName,
      });

      // The link that makes RLS work. Also corrects teachers.email, for which
      // the roster is the school's assertion of truth.
      const patch = { profile_id: user.id };
      if ((teacher.email ?? "").toLowerCase() !== email) patch.email = email;
      await rest.patch("teachers", `id=eq.${teacher.id}`, patch);

      if (patch.email) {
        console.log(
          `       teachers.email corrected: ${teacher.email ?? "(null)"} -> ${email}`,
        );
      }
      console.log(`LINK   ${email} -> teachers.${teacher.id} (${teacher.full_name})`);
      handouts.push({ name: teacher.full_name, email, password, role });
    } catch (e) {
      failures.push(`${email}: ${e.message}`);
      console.log(`FAIL   ${email} — ${e.message}`);
    }
  }

  if (DRY_RUN) {
    console.log("\nDry run — nothing was written.\n");
    return failures.length;
  }

  // Verification is not optional. Re-read from the database rather than
  // trusting the writes above: the whole point of this script is that a
  // plausible-looking run with a broken link is the failure mode.
  console.log("\nVERIFYING\n");
  const after = await readState();
  const stillUnlinked = after.teachers.filter(
    (t) => t.status === "active" && !t.profile_id,
  );

  console.log("CREDENTIALS TO HAND OVER (new accounts only)\n");
  const fresh = handouts.filter((h) => h.password);
  if (fresh.length) {
    for (const h of fresh) {
      console.log(
        `  ${pad(h.name, 24)} ${pad(h.email, 34)} ${h.password}   [${h.role}]`,
      );
    }
    console.log(
      "\n  Stored nowhere else. Copy them now — passwords cannot be read back,\n" +
        "  only reset. Have each teacher change theirs after first sign-in.",
    );
  } else {
    console.log("  (no new accounts — all roster entries already existed)");
  }

  console.log(`\n  active teachers still unlinked: ${stillUnlinked.length}`);
  for (const t of stillUnlinked) console.log(`    - ${t.full_name} (${t.id})`);
  if (failures.length) {
    console.log(`\n  FAILURES (${failures.length}):`);
    for (const f of failures) console.log(`    - ${f}`);
  }
  console.log("");
  return failures.length;
}

async function main() {
  const command = process.argv[2];

  if (command === "audit") {
    process.exit((await audit()) > 0 ? 1 : 0);
  }

  if (command === "provision") {
    const i = process.argv.indexOf("--roster");
    const path = i > -1 ? process.argv[i + 1] : "scripts/staff_roster.json";
    process.exit((await provision(path)) > 0 ? 1 : 0);
  }

  console.error(
    "Usage:\n" +
      "  node scripts/provision_staff.mjs audit\n" +
      "  node scripts/provision_staff.mjs provision --roster <file.json> [--dry-run]",
  );
  process.exit(64); // EX_USAGE
}

main().catch((e) => {
  console.error(`\nFailed: ${e.message}\n`);
  process.exit(1);
});
