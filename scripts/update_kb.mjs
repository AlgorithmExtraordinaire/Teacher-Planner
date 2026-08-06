/**
 * Append the Teacher Planner system manual to the Notion Knowledge Base.
 *
 *   node scripts/update_kb.mjs [--force] [--dry-run]
 *
 * Non-destructive by policy (see CLAUDE.md): this only ever APPENDS. It has
 * no code path that edits or deletes an existing block.
 *
 * Requires a Notion internal integration token and the target page shared
 * with that integration — see deploy/NOTION_INTEGRATION.md. The MCP connector
 * used interactively is a different credential and will not work here.
 */

import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { pathToFileURL } from "node:url";

dotenv.config();

const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");

// Module scope stays free of side effects so the block builder can be
// imported and asserted against without credentials and without writing
// anything. A writer aimed at the source of truth should be testable.
function requireConfig() {
  const { NOTION_API_KEY, NOTION_PAGE_ID } = process.env;
  if (!NOTION_API_KEY || !NOTION_PAGE_ID) {
    console.error(
      "Error: NOTION_API_KEY and NOTION_PAGE_ID are required.\n" +
        "See deploy/NOTION_INTEGRATION.md."
    );
    process.exit(78); // EX_CONFIG — matches the other scheduled jobs
  }
  return { client: new Client({ auth: NOTION_API_KEY }), pageId: NOTION_PAGE_ID };
}

// Stable marker used to detect a previous run. Appending unconditionally
// would stack a duplicate manual onto the page every single time the script
// ran, which for a job meant to run repeatedly is the difference between
// documentation and landfill.
const MARKER = "Teacher & Departmental Planner — System Manual";

// --------------------------------------------------------------- rich text
// annotations is a SIBLING of `text`, not a key inside it. Nested inside
// `text` the API accepts the block and silently drops the formatting, so the
// bug shows up as un-bolded output rather than an error.
const t = (content, annotations) => ({
  type: "text",
  text: { content },
  ...(annotations ? { annotations } : {}),
});
const bold = (content) => t(content, { bold: true });

const h1 = (content) => ({ object: "block", type: "heading_1", heading_1: { rich_text: [t(content)] } });
const h2 = (content) => ({ object: "block", type: "heading_2", heading_2: { rich_text: [t(content)] } });
const h3 = (content) => ({ object: "block", type: "heading_3", heading_3: { rich_text: [t(content)] } });
const p = (...rich) => ({ object: "block", type: "paragraph", paragraph: { rich_text: rich } });
const li = (...rich) => ({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: rich } });
const step = (content) => ({ object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: [t(content)] } });
const divider = () => ({ object: "block", type: "divider", divider: {} });
const callout = (content, emoji = "📘") => ({
  object: "block",
  type: "callout",
  callout: { rich_text: [t(content)], icon: { emoji } },
});
const field = (label, value) => li(bold(`${label}: `), t(value));

/**
 * Read every existing block, following pagination.
 *
 * children.list returns at most 100 per page. Reading only the first page
 * would both understate the block count and — more importantly — miss a
 * previous run's marker on a long page, defeating the duplicate guard.
 */
async function readAllBlocks(notion, pageId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

const blockText = (block) => {
  const body = block[block.type];
  if (!body || !Array.isArray(body.rich_text)) return "";
  return body.rich_text.map((r) => r.plain_text ?? "").join("");
};

/**
 * The manual itself. Every value here was read from the running system —
 * the droplet .env for variable names, src/ for the model, package.json for
 * versions. Nothing is asserted from memory.
 */
export function buildDocumentationBlocks() {
  const timestamp = new Date().toISOString().split("T")[0];

  return [
    divider(),
    h1(`${MARKER} (${timestamp})`),
    callout(
      "Deployment specification for https://planner.elearning-swakopca.edu.na/ — " +
        "appended by scripts/update_kb.mjs. Existing KB entries are never modified."
    ),

    // ---------------------------------------------------------------- 1
    h2("1. System & technical configuration"),
    field("Production URL", "https://planner.elearning-swakopca.edu.na/"),
    field("Framework", "Next.js 16.2.12 — App Router, Turbopack, proxy.ts (not middleware.ts)"),
    field("Runtime", "React 19.2.4, TypeScript strict, Tailwind CSS v4"),
    field("Database", "Supabase Postgres 17, row-level security enabled on every table"),
    field("Agent model", "gemini-3.1-flash-lite via @google/genai"),
    field("Hosting", "DigitalOcean droplet, Docker Compose, container on 127.0.0.1:8200"),
    field("TLS & routing", "nginx reverse proxy, Let's Encrypt via certbot"),
    field("Roles", "teacher, grade_lead, admin, superadmin"),
    p(
      bold("Server environment variables (names only — values are never documented): "),
      t("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, CRON_SECRET")
    ),

    // ---------------------------------------------------------------- 2
    h2("2. Setup & environment mapping"),
    field("src/app", "routes — (dashboard) group, public landing at /, /api/cron and /api/agent"),
    field("src/lib", "dal.ts (roles), supabase/, workflows/, tables/registry.ts"),
    field("supabase/migrations", "append-only, numbered; never edit an applied migration"),
    field("scripts", "operational jobs — CCSS loader, Drive sync, results loader, this script"),
    field("deploy/systemd", "unit and timer files installed to /etc/systemd/system"),
    p(
      t("Scripts and unit files are committed from Windows and executed on Ubuntu. "),
      bold(".gitattributes"),
      t(" forces LF line endings and executable bits are stored in the git index — without both, a deploy leaves a script that fails at its shebang.")
    ),

    // ---------------------------------------------------------------- 3
    h2("3. Core development & functional workflows"),
    h3("Authentication and authorisation"),
    step("Supabase Auth issues the session; proxy.ts redirects unauthenticated dashboard requests to /login and leaves / and /api/cron public."),
    step("Role checks run server-side via dal.ts. RLS enforces the same rules at the database, so a bypassed UI check still fails."),
    h3("Planning and standards"),
    step("Lesson plans link to standards through the lesson_plan_standards join table."),
    step("Standard codes are resolved against the library BEFORE a plan is saved — an unrecognised code fails the save and names itself, rather than being stored as an unverifiable string."),
    h3("Assessment and reporting"),
    step("assessments, assessment_results, attendance_summary and report_comments hold the mid-year record, keyed per learner and term."),
    step("Learners are matched on roll number, never on name — source workbooks are surname-first while the roster is given-name-first."),
    step("sbg_level stays null until the school publishes a percentage-to-SBG mapping. Thresholds are not inferred."),
    h3("Automation"),
    step("Workflows are cadence-gated and executed by POST /api/cron/workflows, authenticated with a timing-safe bearer check against CRON_SECRET."),
    step("New tables must be added to src/lib/tables/registry.ts and src/lib/supabase/types.ts, or their rows exist but are invisible in the app."),

    // ---------------------------------------------------------------- 4
    h2("4. QA & production deployment pipeline"),
    h3("Pre-deployment checks"),
    step("npx tsc --noEmit — types are generated from the live schema, so this catches schema drift."),
    step("npm run lint"),
    h3("Deployment"),
    step("Push to main, then on the droplet: git reset --hard origin/main && docker compose up -d --build."),
    step("Verify: landing returns 200, dashboard routes return 307 to /login, and the co-hosted sca-api service is unaffected."),
    h3("Scheduled jobs (systemd timers)"),
    field("teacher-planner-scheduler", "hourly poll; the endpoint's own cadence filter decides what is due"),
    field("teacher-planner-drive-sync", "02:00 Africa/Windhoek — the zone is pinned because the droplet runs UTC"),
    p(
      t("Both wrappers exit "),
      bold("78 (EX_CONFIG)"),
      t(" when configuration is missing, so \"never installed\" stays distinguishable from \"broke\".")
    ),

    // ---------------------------------------------------------------- 5
    h2("5. Continuous alignment"),
    p(
      t("CLAUDE.md in the repository root carries these rules for Claude Code sessions. Its central directive: "),
      bold("never document what you have not verified"),
      t(". This manual's contents were read from the running system, not recalled — the agent model in particular was long believed to be Claude Opus 5 and is not.")
    ),
  ];
}

/** Notion accepts at most 100 children per append call. */
async function appendInChunks(notion, pageId, blocks) {
  let appended = 0;
  for (let i = 0; i < blocks.length; i += 100) {
    const res = await notion.blocks.children.append({
      block_id: pageId,
      children: blocks.slice(i, i + 100),
    });
    appended += res.results.length;
  }
  return appended;
}

async function main() {
  const { client: notion, pageId } = requireConfig();
  console.log("Inspecting existing Knowledge Base content…");
  const existing = await readAllBlocks(notion, pageId);
  console.log(`  ${existing.length} existing block(s) — all will be preserved.`);

  const already = existing.some((b) => blockText(b).includes(MARKER));
  if (already && !FORCE) {
    console.log(
      "This manual is already on the page. Nothing appended.\n" +
        "  Re-run with --force to append a new dated revision."
    );
    return;
  }

  const blocks = buildDocumentationBlocks();

  if (DRY_RUN) {
    console.log(`Dry run — would append ${blocks.length} block(s). Nothing written.`);
    return;
  }

  console.log(`Appending ${blocks.length} block(s)…`);
  const appended = await appendInChunks(notion, pageId, blocks);
  console.log(`Done. Appended ${appended} block(s); existing entries untouched.`);
}

// A scheduled job that logs an error and exits 0 reports success while doing
// nothing. Fail loudly instead.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("Failed to update the Knowledge Base:", error?.message ?? error);
    if (error?.code === "unauthorized" || error?.status === 401) {
      console.error("  The token is invalid, or the page is not shared with the integration.");
    }
    process.exit(1);
  });
}
