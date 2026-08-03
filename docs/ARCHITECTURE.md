# Teacher-Planner — Architecture

Planning and academic-operations dashboard for **Swakopmund Christian Academy**.
Serves teachers, grade-band leads, and CPAO/academic operations across Pre-K–12.

Live: <https://planner.elearning-swakopca.edu.na>

---

## 1. System overview

```
Browser
  │  HTTPS
  ▼
nginx (host, systemd)                    ← shared with sca-api, separate server block
  │  proxy_pass 127.0.0.1:8200
  ▼
teacher-planner-app  (Docker container, network: teacher-planner_default)
  │  Next.js 16 standalone server, port 3000 internally
  │
  ├── Server Components / Server Actions ──► Supabase Postgres (RLS enforced)
  └── proxy.ts (session refresh + redirect) ──► Supabase Auth
```

Everything server-rendered. There is no separate API tier: Server Components read
from Postgres directly and Server Actions write to it, both through the Supabase
client carrying the caller's JWT so **RLS is always in force**.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) | `output: "standalone"` for slim images |
| UI | React 19, Tailwind CSS v4 | Local primitives in `src/components/ui.tsx` |
| Language | TypeScript (strict) | DB types generated from live schema |
| Auth | Supabase Auth (email + password) | Cookie sessions via `@supabase/ssr` |
| Database | Supabase Postgres 17 (**Pro**) | 32 tables, RLS on every one |
| Container | Docker, multi-stage, `node:22-alpine` | Non-root `nextjs` user |
| Proxy / TLS | host nginx + Let's Encrypt (certbot) | Auto-renewal via `certbot.timer` |
| Host | DigitalOcean droplet, Ubuntu 24.04 | 2 vCPU / 3.8 GB, shared with `sca-api` |

> **Next.js 16 note:** `middleware.ts` is now `proxy.ts` and exports a `proxy`
> function. Framework APIs here differ from older App Router docs — check
> `node_modules/next/dist/docs/` before changing routing or caching behaviour.

## 3. Request lifecycle & auth

1. **`src/proxy.ts`** runs on every non-asset request. It delegates to
   `src/lib/supabase/proxy.ts`, which refreshes the Supabase session cookie and
   performs an *optimistic* redirect: unauthenticated → `/login?next=…`,
   authenticated on `/login` → `/`.
2. **`src/lib/dal.ts`** is the data-access layer and the real gate.
   `requireUser()` / `requireRole()` resolve the caller's profile (memoised per
   render with React `cache`) and redirect if unauthorised.
3. **Postgres RLS** is the enforcement boundary that actually matters. Even if
   a UI check were bypassed, policies constrain every read and write.

Three layers, deliberately: the proxy is for UX (fast redirects), the DAL is for
component ergonomics, RLS is for security. Never rely on the first two alone.

### Roles

| Role | Meaning |
|---|---|
| `teacher` | Owns their own lesson plans, reflections, interventions, and their classes' assessments |
| `grade_lead` | Grade-band oversight; write access across shared curriculum + roster data |
| `admin` | CPAO / academic operations; full write access |

`grade_lead` and `admin` are grouped as "staff admin" by
`public.is_staff_admin()` for policy purposes.

### RLS shape

- **Reads:** any authenticated staff member can read school data
  (`using (true)` for the `authenticated` role).
- **Writes:** restricted to `is_staff_admin()`, or to the owning teacher for
  lesson plans, reflections, interventions, and their own classes' assessments.
- Helper functions (`current_role`, `current_teacher_id`, `is_staff_admin`) are
  `SECURITY DEFINER`, granted to `authenticated` only — `anon` is revoked, so
  they cannot be probed via `/rest/v1/rpc/...` without a session.

## 4. Data model

32 tables in `public`. Migrations live in `supabase/migrations/`, applied
`0001` → `0008` in order.

> **Current project:** `Teacher_Planner`, ref `tlwzddwradxdthwzqxqr`, region
> `us-east-2`, in the Pro org `admin@elearning-swakopca.edu.na's Org`. This
> replaced the earlier free-tier project (`nmuvtgefbswmufpineyp`) on 3 Aug 2026.
>
> **Provision a fresh project** by applying `0001`–`0008` in order, then
> `supabase/seed/sca_kb_reference_data.sql`. `ALL_IN_ONE_new_project.sql` is a
> generated concatenation of those migrations — regenerate it rather than
> hand-editing, or it drifts. It previously predated `0005`/`0006` and silently
> provisioned 24 tables instead of 32.

**Identity**
`profiles` (1:1 with `auth.users`, holds role) · `teachers` (staff directory,
optionally linked to a profile) · `students`

**Roster**
`classes` · `class_enrollment`

**Curriculum**
`curriculum_standards` (CCSS/NGSS/NCSS/CASEL) · `curriculum_modules`
(Eureka / EL Ed / Spectrum / MobyMax) · `academic_calendar`

**Planning**
`lesson_plans` — carries `tier ∈ {annual, term, monthly, weekly, daily}`, the
five-tier planning hierarchy, plus the full lesson body (objective, warm-up,
direct instruction, guided/independent practice, assessment strategy,
differentiation, homework, reflection)

**Assessment**
`assessments` · `assessment_results` (Standards-Based Grading, levels 1–4)

**Monitoring**
`pacing_monitor` · `interventions` · `reflection_pd_log` · `system_alerts`

**Integrations**
`mobymax_log` · `mobymax_assignments` · `duolingo_tracker` ·
`language_platform_migration` (2027 Duolingo replacement evaluation)

A trigger on `auth.users` (`handle_new_user`) auto-creates a `profiles` row,
defaulting to the `teacher` role.

### Known modelling debt

| Issue | Impact |
|---|---|
| `lesson_plans.standards` is a `text[]` | Cannot join or report on standards coverage; blocks a real pacing/coverage monitor |
| `term` is a free-text string (`'Term 3 2026'`) in 4 tables | No single source of truth for the academic year; typos silently fragment data |
| `grade_band` is free text (`'Elementary (1-5)'`) | Same — should be a lookup or enum |
| `lesson_plans.updated_at` has no trigger | Column exists but never updates |
| `profiles` vs `teachers` overlap | Two identity tables; acceptable only if `teachers` must hold staff *without* logins |
| No soft-delete or audit trail | Student records are hard-deleted; no history for a school system |

## 4a. Scheduled workflow runner

Workflows are evaluated by `src/lib/workflows/run.ts`, shared by two callers:

| Caller | Client | Auth |
|---|---|---|
| "Run now" button (`runWorkflow` action) | caller's session | RLS, as the signed-in user |
| `POST /api/cron/workflows` | service role | `Authorization: Bearer $CRON_SECRET` |

The app holds **no in-process timer**. A Next.js server has nowhere durable to
keep one across restarts, and a wedged `setInterval` fails silently — the exact
failure mode this system is meant to catch. An external scheduler is
observable and retryable instead:

```
n8n Schedule Trigger (or systemd timer)
      │  POST + bearer secret, nightly
      ▼
/api/cron/workflows   ← exempt from the login redirect in lib/supabase/proxy.ts
      │  selects is_enabled workflows where cadence has elapsed
      ▼
executeWorkflow() per workflow, sequentially
      │
      ├─► workflow_runs   (running → success | error)
      ├─► system_alerts   (one row per match)
      └─► workflows.last_run_at   (stamped on success only)
```

`?force=true` ignores cadence, for testing.

**Design notes**

- `last_run_at` is stamped **only on success**, so a failed run retries on the
  next tick rather than waiting out a full cadence.
- An unrecognised `cadence` never auto-runs — a schedule we cannot interpret
  should wait for a human, not guess.
- The response is HTTP **500 if any workflow failed**, so the scheduler can
  alert on status code without parsing the body.
- A failed `system_alerts` insert now fails the run. Previously it was
  swallowed and reported as success — finding problems and telling nobody is
  not a successful run.

**Required env** (see `.env.example`): `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
The service-role key bypasses RLS, so `lib/supabase/service.ts` is importable
only from this route; everything reachable by a browser session keeps using
`lib/supabase/server.ts`.

### Calendar coverage guard

`missing_lesson_plans` now throws if `academic_calendar` does not reach the end
of its look-ahead window. Without that check an exhausted calendar returns zero
school days → zero gaps → "everything is planned": a false all-clear, the worst
possible failure for a monitoring rule. It fails loudly instead.

## 5. Deployment

**Source of truth:** GitHub `AlgorithmExtraordinaire/Teacher-Planner`, branch `main`.

**Current deploy (manual):**
```bash
ssh root@147.182.222.188
cd /opt/teacher-planner && git pull && docker compose up -d --build
```

Build args inject `NEXT_PUBLIC_SUPABASE_*` at image-build time (they are baked
into the client bundle — this is correct for publishable keys, which are safe to
expose; RLS is what protects the data). Runtime config comes from
`/opt/teacher-planner/.env` (mode `600`, never committed).

### Isolation from `sca-api`

The droplet also runs an unrelated project. Isolation is by construction:

| | sca-api | teacher-planner |
|---|---|---|
| Compose project | `sca-api` | `teacher-planner` |
| Docker network | `sca-api_default` | `teacher-planner_default` |
| Host port | `127.0.0.1:8100` | `127.0.0.1:8200` |
| nginx site | `sites-available/app` | `sites-available/planner` |
| Domain / cert | `app.elearning-…` | `planner.elearning-…` |

No shared containers, networks, volumes, ports, or config files. Neither
project's files are edited when deploying the other.

## 6. Operational risks

These are live gaps, ordered by severity. Detail and remediation in
[ROADMAP.md](./ROADMAP.md).

1. **Supabase free tier pauses after ~7 days of inactivity.** This is exactly
   how the earlier project ended up `INACTIVE`. Over a school holiday the
   database *will* pause and the site will break until manually restored.
2. **No backups.** Free tier retention is minimal and there is no PITR. This is
   student academic data.
3. **No swap on a 3.8 GB box** that builds Docker images in place, alongside a
   second running app. Builds run close to the memory ceiling.
4. **No container health check** — `teacher-planner-app` reports `Up`, not
   `Up (healthy)`, so a wedged process would not be visible or auto-restarted.
5. **No CI/CD, no tests** — every deploy is a manual SSH build with no gate.
6. **Reads are school-wide for any authenticated user** — intervention notes and
   assessment results are visible to every staff account. Defensible for a small
   school, but it should be a deliberate decision, not a default.
7. **No user provisioning flow** — accounts are created by hand-written SQL.
