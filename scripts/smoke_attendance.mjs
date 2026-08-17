/**
 * Prove the daily register works — as a real teacher, against RLS.
 *
 *   cd /opt/teacher-planner
 *   docker run --rm -v /opt/teacher-planner:/app -w /app --env-file .env \
 *     node:22-alpine node scripts/smoke_attendance.mjs teacher@…
 *
 * Companion to smoke_teacher_path.mjs. Same reasoning: every other check in
 * this project runs as the service role, which bypasses Row Level Security and
 * therefore proves nothing about what a teacher can actually do.
 *
 * The session is minted from the service key inside the container, so no
 * password is passed on the command line and none is printed.
 *
 * Checks the things that would be silently wrong rather than loudly broken:
 *   - a teacher can mark their own class
 *   - correcting a mark UPDATES it rather than stacking a contradiction
 *   - the updated_at trigger actually fires
 *   - a date the school does not recognise is REFUSED (calendar foreign key)
 *   - another teacher's class is REFUSED (RLS write policy)
 *
 * Leaves nothing behind. Exit 0 only if every check passed.
 */

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.argv[2] ?? "").toLowerCase();

if (!url || !anon || !service) {
  console.error("Error: SUPABASE URL, ANON KEY and SERVICE_ROLE_KEY are required.");
  process.exit(78); // EX_CONFIG
}
if (!email) {
  console.error("Usage: node scripts/smoke_attendance.mjs <teacher email>");
  process.exit(64); // EX_USAGE
}

let failed = 0;
const step = (ok, label, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed += 1;
  return ok;
};

async function call(path, { method = "GET", token, body, headers = {} } = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: token === service ? service : anon,
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

const UPSERT = {
  method: "POST",
  headers: {
    Prefer: "resolution=merge-duplicates,return=representation",
  },
};

async function main() {
  console.log(`\nATTENDANCE REGISTER SMOKE TEST — ${email}\n`);

  // --- session, minted server-side and consumed immediately -----------------
  const gen = await call("/auth/v1/admin/generate_link", {
    method: "POST",
    token: service,
    body: { type: "magiclink", email },
  });
  const otp = gen.payload?.email_otp ?? gen.payload?.properties?.email_otp;
  if (!otp) {
    step(false, "mint session", JSON.stringify(gen.payload).slice(0, 160));
    process.exit(1);
  }
  const verified = await call("/auth/v1/verify", {
    method: "POST",
    token: anon,
    body: { type: "magiclink", email, token: otp },
  });
  const jwt = verified.payload?.access_token;
  if (!step(Boolean(jwt), "sign in")) process.exit(1);

  // --- identity -------------------------------------------------------------
  const who = await call("/rest/v1/rpc/current_teacher_id", {
    method: "POST",
    token: jwt,
    body: {},
  });
  const teacherId = typeof who.payload === "string" ? who.payload : null;
  if (!step(Boolean(teacherId), "current_teacher_id() resolves", teacherId ?? "NULL")) {
    process.exit(1);
  }

  // --- what to mark ---------------------------------------------------------
  const classes = await call(
    `/rest/v1/classes?select=id,name&teacher_id=eq.${teacherId}&order=name`,
    { token: jwt },
  );
  const cls = (classes.payload ?? [])[0];
  if (!step(Boolean(cls), "reads own classes", cls?.name)) process.exit(1);

  const today = new Date().toISOString().slice(0, 10);
  const days = await call(
    `/rest/v1/academic_calendar?select=date&day_type=eq.school_day&term=eq.${encodeURIComponent("Term 3 2026")}&date=gte.${today}&order=date&limit=1`,
    { token: jwt },
  );
  const date = (days.payload ?? [])[0]?.date;
  if (!step(Boolean(date), "finds a Term 3 school day", date)) process.exit(1);

  const enrolment = await call(
    `/rest/v1/class_enrollment?select=students(id,full_name)&class_id=eq.${cls.id}&limit=3`,
    { token: jwt },
  );
  const learners = (enrolment.payload ?? [])
    .map((r) => (Array.isArray(r.students) ? r.students[0] : r.students))
    .filter(Boolean);
  if (!step(learners.length >= 2, "reads enrolled learners", `${learners.length} found`)) {
    process.exit(1);
  }

  // --- mark the register ----------------------------------------------------
  const rows = [
    { class_id: cls.id, student_id: learners[0].id, date, status: "present" },
    { class_id: cls.id, student_id: learners[1].id, date, status: "absent" },
  ];
  const written = await call("/rest/v1/attendance?on_conflict=class_id,student_id,date", {
    ...UPSERT,
    token: jwt,
    body: rows,
  });
  step(
    written.ok && written.payload?.length === 2,
    "marks the register",
    written.ok ? `${written.payload.length} rows` : `${written.status} ${JSON.stringify(written.payload)}`,
  );

  const firstUpdatedAt = written.payload?.[1]?.updated_at;

  // --- correct a mark: must update, not duplicate ---------------------------
  const corrected = await call("/rest/v1/attendance?on_conflict=class_id,student_id,date", {
    ...UPSERT,
    token: jwt,
    body: [{ class_id: cls.id, student_id: learners[1].id, date, status: "excused" }],
  });
  step(corrected.ok, "corrects a mark", corrected.ok ? "absent -> excused" : JSON.stringify(corrected.payload));

  const after = await call(
    `/rest/v1/attendance?select=student_id,status,updated_at&class_id=eq.${cls.id}&date=eq.${date}`,
    { token: jwt },
  );
  const marks = after.payload ?? [];
  step(marks.length === 2, "no duplicate rows after correction", `${marks.length} rows for ${learners.length >= 2 ? "2 learners" : "?"}`);
  const changed = marks.find((m) => m.student_id === learners[1].id);
  step(changed?.status === "excused", "correction took effect", changed?.status);
  step(
    Boolean(firstUpdatedAt) && changed?.updated_at !== firstUpdatedAt,
    "updated_at trigger fired",
    changed?.updated_at === firstUpdatedAt ? "unchanged" : "stamped",
  );

  // --- a day the school does not recognise must be refused -----------------
  const badDate = await call("/rest/v1/attendance", {
    method: "POST",
    token: jwt,
    body: [{ class_id: cls.id, student_id: learners[0].id, date: "2031-07-04", status: "present" }],
  });
  step(
    !badDate.ok,
    "refuses a date not in the calendar",
    badDate.ok ? "ACCEPTED — the calendar foreign key is not holding" : `${badDate.status}`,
  );

  // --- another teacher's class must be refused ------------------------------
  const foreign = await call(
    `/rest/v1/classes?select=id,name,teacher_id&teacher_id=neq.${teacherId}&teacher_id=not.is.null&limit=1`,
    { token: jwt },
  );
  const otherClass = (foreign.payload ?? [])[0];
  if (otherClass) {
    const attempt = await call("/rest/v1/attendance", {
      method: "POST",
      token: jwt,
      body: [{ class_id: otherClass.id, student_id: learners[0].id, date, status: "present" }],
    });
    step(
      !attempt.ok,
      "refuses another teacher's class",
      attempt.ok
        ? `ACCEPTED for "${otherClass.name}" — RLS is not holding`
        : `${attempt.status} on "${otherClass.name}"`,
    );
  } else {
    console.log("  SKIP  refuses another teacher's class — no other staffed class found");
  }

  // --- clean up -------------------------------------------------------------
  const del = await call(
    `/rest/v1/attendance?class_id=eq.${cls.id}&date=eq.${date}`,
    { method: "DELETE", token: jwt },
  );
  const leftover = await call(
    `/rest/v1/attendance?select=id&class_id=eq.${cls.id}&date=eq.${date}`,
    { token: jwt },
  );
  step(
    del.ok && (leftover.payload ?? []).length === 0,
    "removes its own test marks",
    (leftover.payload ?? []).length ? "ROWS STILL PRESENT" : "",
  );

  console.log(
    `\n${failed === 0 ? "ALL CHECKS PASSED" : `${failed} CHECK(S) FAILED`}\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`\nFailed: ${e.message}\n`);
  process.exit(1);
});
