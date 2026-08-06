@AGENTS.md

# Teacher & Departmental Planner — System Guidelines

## Core principles & primary knowledge source

- **Production domain:** https://planner.elearning-swakopca.edu.na/
- **Primary source of truth:** the Notion Knowledge Base. Code, database
  schema, and UI decisions align to the specifications held there.
- Where the KB and the running system disagree, **say so rather than
  silently picking one**. Recorded discrepancies (e.g. `academic.calendar_variance`
  in `system_settings`) are more useful than a quietly reconciled number.

## Non-destructive Knowledge Base policy

**STRICT DIRECTIVE: never overwrite, delete, or replace existing blocks in the
Notion Knowledge Base.**

Permitted: **add**, **expand**, **rectify**, **fulfil** missing specifications.

Rectifying a wrong fact means appending the correction and stating what it
supersedes — not deleting the original. The KB is a record of what the school
believed as well as what is true, and the history is worth keeping.

Practically: append after a `divider`, never `replace_content` on a page you
did not create in the same session.

## Never document what you have not verified

Documentation asserted from assumption is worse than no documentation,
because it is trusted. Before writing a fact into the KB or into this repo,
read it from the running system.

This is not hypothetical. The agent layer was widely believed — including in
this project's own task list — to run Claude Opus 5. It actually runs
`gemini-3.1-flash-lite` via `@google/genai`. Checking took one grep.

## Verified system facts

Re-verify before relying on any of these; they are a starting point, not an
authority.

| | |
|---|---|
| Framework | Next.js 16.2.12, App Router, Turbopack, `proxy.ts` (not `middleware.ts`) |
| Runtime | React 19.2.4, TypeScript strict, Tailwind CSS v4 (`@theme` tokens) |
| Database | Supabase Postgres 17, RLS enabled on every table |
| Agent model | `gemini-3.1-flash-lite` via `@google/genai` |
| Host | DigitalOcean droplet, Docker Compose, container on `127.0.0.1:8200`, nginx + Let's Encrypt |
| Roles | `teacher`, `grade_lead`, `admin`, `superadmin` |

Server environment variables, **names only — never commit or echo values**:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CRON_SECRET`.

## Documentation scope

When generating documentation for Notion, organise output into four sections:

1. **System & technical configuration** — stack, models, service bindings,
   environment variable *names*.
2. **Setup & environment mapping** — repository layout, local development,
   deployment bindings.
3. **Core development & functional workflows** — planner features,
   departmental logic, authentication, state.
4. **QA & production deployment pipeline** — build, routing, SSL, domain
   binding, scheduled jobs.

## Working rules

- **Migrations are append-only.** Never edit an applied migration; add the next
  numbered file. A migration that fixes an earlier one should say so and why.
- **Verify against the live system, not the diff.** A migration file in the
  repo is not proof it was applied; a passing typecheck is not proof a page
  renders.
- **Adding a table to the schema is not shipping it.** `src/lib/tables/registry.ts`
  and the generated `src/lib/supabase/types.ts` both need updating, or the rows
  exist and are invisible.
- **Never invent data to fill a gap.** Missing learners stay missing; unmapped
  grades stay null. Record the gap.
- **UTF-8 on Windows:** use `[System.IO.File]::ReadAllText/WriteAllText` with
  `UTF8Encoding($false)`. PowerShell's `Get-Content`/`Set-Content` corrupt
  em-dashes, arrows and `×`.
- Scripts and unit files run on Ubuntu but are committed from Windows.
  `.gitattributes` forces LF; executable bits belong in the git index.
