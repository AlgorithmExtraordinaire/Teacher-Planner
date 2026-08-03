# Teacher Planner — System Diagnostic & Assessment

**Assessed:** 1 August 2026 · **At commit:** `b305586` · **Target:** planner.elearning-swakopca.edu.na

Findings come from running checks, not from inspection: three engineering gates,
ten HTTP probes against the live and local servers, direct row counts and rule
simulations against the production database, and Supabase's own security and
performance advisors.

---

## Verdict — 2.2 / 4.0 (Developing)

**The software is well built. The system is not yet operational.** Those are
different findings and conflating them is the main risk to planning.

Every engineering gate passes and RLS is enforced on all 32 tables. But the
tables that would make it *useful* are largely empty: no assessments, no pacing
records, no real standards, and no synchronization has ever run. Six of seven
monitoring rules cannot fire because they have no source data.

Graded 1–4 on the school's own Standards-Based Grading scale.

| Subsystem | Score | Note |
|---|:--:|---|
| Application & build | 4 | typecheck, lint, build all exit 0; 19 routes; live 200 |
| Security model | 3 | RLS everywhere; 4 advisor warnings outstanding |
| Data foundation | 3 | real KB roster loaded; seed rows still present |
| Agentic layer | 3 | tools + approval queue; model never authors SQL |
| Automation & scheduling | 2 | scheduler built and guarded, never executed |
| Performance & scale | 2 | 65 advisor findings; RLS won't scale as written |
| Assessment & alignment | 1 | 0 assessments, 0 results, 2 sample standards |
| Synchronization | 1 | does not exist; design targets abandoned Moodle |
| Resilience & operations | 1 | no backups, health check, CI, tests, or swap |

A 2 does not mean poor work — every subsystem at 2 or below is short of **data**,
not short of engineering.

---

## Strengths

- **The security architecture is the best part of the system.** Three layers in
  the right order: proxy for UX, DAL for components, RLS as the real boundary.
- **The AI cannot write to school records unsupervised.** The model never authors
  SQL; rules are hand-written parameterised queries and all writes queue for
  human approval.
- **Engineering hygiene is current.** TS strict with types generated from the
  live schema, standalone Docker as non-root, TLS auto-renewal, clean isolation
  from the co-hosted app.
- **The data in the system is real and traceable.** Every row traces to a named
  Notion page; gaps are NULL rather than plausible guesses; enrolment is a
  derivation rule, not 327 opaque rows.
- **The documentation admits its own debt**, which made this assessment faster.

## Weaknesses

| Severity | Finding |
|---|---|
| Critical | **Cannot report on learning.** 0 assessments, 0 results. SBG, coverage and pacing all return nothing. |
| Critical | **No backup, and the database pauses itself.** Free tier suspends after ~7 days idle; a holiday will break it. Student data with no recovery path. |
| Critical | **One login for the entire staff.** Role separation is fully implemented in policy and unused in practice. |
| High | **No synchronization exists.** Zero sync runs ever; the written design targets Moodle, now abandoned. 4 files indexed against a full curriculum Drive. |
| High | **Six of seven rules are inert** — they query empty tables and will report "all clear" indefinitely. |
| High | **Academic alignment is nominal.** No CCSS/NGSS/NCSS codes loaded, and `lesson_plans.standards` is a `text[]` that cannot be joined. |
| High | **RLS will not scale.** 29 duplicate permissive policies; 5 policies re-evaluate `auth` per row. |
| Medium | **Every deploy is manual and ungated** — no CI, no tests, no container health check. |
| Medium | **No audit trail or soft delete.** Student records are hard-deleted with no history. |

---

## Evidence

**Engineering gates**

| Check | Result |
|---|---|
| `tsc --noEmit` | PASS (exit 0) |
| `eslint` | PASS (exit 0) — one real error found and fixed |
| `next build` | PASS (exit 0), 19 routes |
| Live site | 200, nginx/1.24.0 |
| Cron: no / wrong bearer | 401 (not a redirect — proxy exemption correct) |
| Cron: valid bearer, no service key | 503, precise message |
| Cron: `GET` | 405 |
| Protected routes, signed out | 307 → `/login` |
| Scheduler end-to-end run | **UNTESTED** — blocked on service-role key |

**Data inventory** (non-zero): class_enrollment 327 · students 58 · classes 45
(6 unstaffed) · resource_collections 32 · curriculum_modules 18 ·
academic_calendar 14 (ends 10 Aug) · teachers 6 · resources 4 ·
curriculum_standards 2 (both samples) · profiles 1

**Zero rows, blocking features:** assessments · assessment_results ·
pacing_monitor · interventions · resource_sync_runs

**Advisor findings:** 29 multiple permissive policies (WARN) · 16 unused indexes ·
15 unindexed foreign keys · 5 RLS init-plan re-evaluations (WARN) ·
3 SECURITY DEFINER functions callable by signed-in users (WARN) ·
leaked-password protection disabled (WARN)

---

## Action plan

### Phase 1 — Make it operational (this week)

1. **Deploy scheduler secrets.** `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` in
   `/opt/teacher-planner/.env`, rebuild, prove one end-to-end run. *Blocks 1.2, 2.4.*
2. **Schedule the runner.** n8n Schedule Trigger → `POST /api/cron/workflows`
   nightly, secret in n8n's credential store. Endpoint returns 500 if any
   workflow failed, so alerting needs no body parsing.
3. **Run the seed-data purge** — `supabase/one-off/2026-08-01_purge_seed_data.sql`.
4. **Extend the academic calendar.** Ends 10 Aug. Needs real term dates and
   Namibian public holidays — school data, not something to generate.
   **Hard deadline 8 Aug**, when the new coverage guard starts failing runs.
5. **Provision real staff accounts**, one per teacher, linked to `teachers` rows.
6. **Enable leaked-password protection.** One toggle.

### Phase 2 — Make it true (weeks 2–5)

1. **Load a real standards set** — CCSS, NGSS, NCSS for Grades 1–8.
2. **Normalise standards to a join table.** Replace `lesson_plans.standards`
   `text[]` with `lesson_plan_standards`. Highest-value schema change: coverage
   reporting is impossible while it remains an array.
3. **Bring assessment data in.** 1,446 results already exist in the Synexis
   export. This activates SBG, pacing and three dormant rules at once.
4. **Build Google Drive synchronization** to replace the obsolete Moodle design.
   Decide the orphan policy — soft-delete or `last_seen_at` sweep — *before* the
   first run; retrofitting after teachers file resources is materially harder.
5. **Staff the six unstaffed classes** (ELA / Social Studies at Gr 4, 5, 8).

### Phase 3 — Make it durable (weeks 4–10)

1. **Back up the database and leave the free tier.** Non-negotiable before the
   next holiday.
2. **Consolidate RLS policies**; wrap `auth` calls as `(select auth.uid())`.
3. **Index the 15 unindexed foreign keys**; review unused indexes against real
   query patterns rather than dropping blind.
4. **Add a container health check and swap** on the 3.8 GB droplet.
5. **Gate deployment with CI** — typecheck, lint, build. Add first tests around
   the workflow rules, where a silent wrong answer costs most.
6. **Add soft delete and an audit trail** for student records.
7. **Tighten remaining access** — revoke `EXECUTE` on the SECURITY DEFINER
   helpers where not needed; make school-wide read access deliberate.

---

## Limits of this assessment

The scheduler's execution path beyond the auth guard is **unverified** — the
service-role key is deliberately not retrievable through tooling. The production
Gemini key was not confirmed, so the assistant is assessed on its code rather
than a live conversation. No load testing was performed; scalability findings are
structural, drawn from policy and index analysis rather than measured throughput.
