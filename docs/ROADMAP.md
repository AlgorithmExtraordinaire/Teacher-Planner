# Teacher-Planner — Engineering Roadmap

Companion to [ARCHITECTURE.md](./ARCHITECTURE.md). Ordered by what unblocks or
protects the most, not by what is most interesting to build.

---

## Phase 0 — Harden what is already live

The MVP is in production. These are the gaps that make it fragile.

| # | Item | Why it matters |
|---|---|---|
| 0.1 | **Supabase free tier pauses after ~7 days idle** | The single largest availability risk. A school holiday will pause the database and take the site down until someone manually restores it — this is exactly what happened to the earlier project. Fix: upgrade to Pro, or run a scheduled keep-alive query. |
| 0.2 | **No database backups** | Student academic data with no PITR and minimal free-tier retention. |
| 0.3 | **No swap on a 3.8 GB droplet** | Docker builds run in-place alongside `sca-api`. Add a 2 GB swapfile before the image grows. |
| 0.4 | **No container health check** | `teacher-planner-app` reports `Up`, not `Up (healthy)`. A wedged process is invisible and never auto-restarts. |
| 0.5 | **Manual deploys** | Every release is a hand-run `git pull && docker compose up -d --build` over SSH, with no gate. |
| 0.6 | **No user provisioning** | Accounts are created by hand-written SQL. Needs a real staff-invite flow before rollout. |

TLS is **done** — `planner.elearning-swakopca.edu.na` is on Let's Encrypt with
`certbot.timer` active.

## Phase 1 — The agentic platform (in progress)

Turning the CRUD dashboard into the live, automated system the school actually
asked for. Schema is applied; application code is being built.

| Layer | Status | Notes |
|---|---|---|
| Schema (`workflows`, `workflow_runs`, `agent_conversations`, `agent_messages`, `agent_actions`) | ✅ Applied | Migration `0004_agent_and_workflows.sql`, RLS enabled |
| **Tables** — all 19 tables browsable | ⏳ To build | Data-driven registry + `/tables/[table]` |
| **Workflows** — built-in rule evaluators + runner | ⏳ To build | Rules are built-in and parameterised; an LLM selects a rule, it never writes SQL that runs unattended |
| **Agent** — Claude Opus 5 with tool use over school data | ⏳ To build | Read tools run under the caller's session so RLS applies; writes are proposals |
| **Approval queue** — human-in-the-loop for agent writes | ⏳ To build | `agent_actions`; nothing mutates school data without a human approving it |
| **Dashboards** — enriched Overview + AI Lesson Plan Generator | ⏳ To build | |

### Design commitments

- **The agent proposes; a human disposes.** Every write the agent wants to make
  lands in `agent_actions` as `pending`. This is deliberate — the data is
  children's academic and intervention records.
- **Reads inherit the caller's permissions.** Agent queries run through the
  user's Supabase session, so Row Level Security applies unchanged. The agent
  cannot see more than the person talking to it.
- **Automation is parameterised, not generated.** Workflow rule types are
  hard-coded evaluators. An LLM chooses a rule and its parameters; it never
  emits SQL that executes on a schedule.

Requires an `ANTHROPIC_API_KEY` in the droplet's `.env` before the agent
features function.

## Phase 2 — Data model corrections

Carry-over debt from the MVP schema, worth fixing before the tables fill up:

- `lesson_plans.standards` is a `text[]` — should be a join table, otherwise
  standards-coverage reporting and a real pacing monitor are not possible.
- `term` and `grade_band` are free-text strings repeated across several tables —
  should be lookups, so a typo cannot silently fragment a year's data.
- `lesson_plans.updated_at` has no trigger; the column never updates.
- No soft-delete or audit trail on student records.

## Phase 3 — Quality and operations

- Tests (none currently exist)
- CI/CD replacing manual SSH deploys
- Error monitoring and log aggregation
- A staging environment

## Open decisions

1. **Supabase tier** — free tier's idle-pause is incompatible with a system
   teachers depend on during term. Pro, or a keep-alive?
2. **Read scope** — every authenticated staff member can currently read all
   school data, including intervention notes and assessment results. Defensible
   for a small school, but it should be a deliberate choice.
3. **Agent autonomy** — currently propose-then-approve for all writes. Some
   low-risk actions (raising an alert, drafting a lesson plan) could be
   direct-write if the school prefers speed.
