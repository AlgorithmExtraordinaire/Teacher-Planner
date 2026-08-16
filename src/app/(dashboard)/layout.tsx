import Link from "next/link";
import { requireUser, isSuperadmin, isStaffAdmin } from "@/lib/dal";
import { logout } from "@/app/login/actions";
import { NavLink } from "@/app/(dashboard)/nav-link";
import { Ticker, type TickerItem } from "@/components/ticker";
import { createClient } from "@/lib/supabase/server";

/**
 * `staffOnly` hides an entry from teachers. Like the platform section below,
 * this is decluttering rather than access control — the pages themselves
 * already hide every control a teacher cannot operate, and RLS is the real
 * boundary. A teacher who types the URL still reads the page, which is
 * intended: nothing there is secret, it is simply not theirs to act on.
 */
type NavItem = { href: string; label: string; staffOnly?: boolean };
type NavSection = { label: string; items: NavItem[]; staffOnly?: boolean };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "§01 — Planning",
    items: [
      { href: "/dashboard", label: "Dashboard Overview" },
      { href: "/lesson-plans/new", label: "Lesson Plan Generator" },
      { href: "/attendance", label: "Attendance Register" },
      { href: "/curriculum-position", label: "Curriculum Position" },
      // Teacher-safe: its reads run under the caller's session, and its writes
      // are proposals a staff admin must approve. It also answers "how do I do
      // X here", which is why it belongs with the tools rather than behind an
      // admin gate.
      { href: "/agent", label: "Assistant" },
    ],
  },
  {
    // Review and automation surfaces. The Assistant itself now lives in §01
    // with the teacher's other tools; what stays here is what only a staff
    // admin can act on — approving proposals and running workflows.
    label: "§02 — Intelligence",
    staffOnly: true,
    items: [
      { href: "/agent/proposals", label: "Proposals" },
      { href: "/workflows", label: "Workflows" },
    ],
  },
  {
    label: "§03 — Resources",
    items: [
      { href: "/resources", label: "Curriculum Catalogue" },
      { href: "/resources/folders", label: "My Folders" },
    ],
  },
  {
    label: "§04 — Records",
    items: [
      { href: "/roster", label: "Roster" },
      { href: "/calendar", label: "Academic Calendar" },
      { href: "/standards", label: "Curriculum Standards" },
      { href: "/lesson-plans", label: "Lesson Plans" },
      { href: "/assessments", label: "Assessments" },
      { href: "/admin/staff", label: "Staff Accounts", staffOnly: true },
      { href: "/tables", label: "All Tables", staffOnly: true },
    ],
  },
];

// Superadmin only. Hiding it is a courtesy, not the control — RLS is what
// stops anyone else reading settings, schools, or the audit log.
const PLATFORM_SECTION: NavSection = {
  label: "§05 — Platform",
  items: [{ href: "/admin/settings", label: "Settings & Audit" }],
};

/**
 * Figures for the ticker strip.
 *
 * Read live, with `head: true` so each is a COUNT and no rows cross the
 * wire. Every query runs under the caller's RLS policies, so a teacher's
 * strip reflects what a teacher may see rather than school-wide totals.
 *
 * A null count means the query failed or the table is empty. It is rendered
 * as "—", not as 0: those are different claims, and quietly reporting zero
 * learners because a policy denied the read would be a lie in a prominent
 * position.
 */
async function readTickerFigures(): Promise<TickerItem[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [learners, classes, unstaffed, plans, pending, standards, upcoming] =
    await Promise.all([
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .is("teacher_id", null),
      supabase.from("lesson_plans").select("*", { count: "exact", head: true }),
      supabase
        .from("agent_actions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("curriculum_standards")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("academic_calendar")
        .select("*", { count: "exact", head: true })
        .eq("day_type", "school_day")
        .gte("date", today),
    ]);

  const fig = (n: number | null) => (n === null ? "—" : n.toLocaleString());

  return [
    { symbol: "LEARNERS", value: fig(learners.count) },
    {
      symbol: "CLASSES",
      value: fig(classes.count),
      delta: unstaffed.count ? `${unstaffed.count} unstaffed` : "all staffed",
      direction: unstaffed.count ? "down" : "up",
    },
    { symbol: "LESSON-PLANS", value: fig(plans.count) },
    {
      symbol: "PROPOSALS",
      value: fig(pending.count),
      delta: pending.count ? "awaiting review" : "clear",
      direction: pending.count ? "down" : "up",
    },
    { symbol: "STANDARDS", value: fig(standards.count) },
    {
      symbol: "SCHOOL-DAYS-LEFT",
      value: fig(upcoming.count),
      delta: "2026 calendar",
    },
  ];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const staff = isStaffAdmin(user);
  const sections = (
    isSuperadmin(user) ? [...NAV_SECTIONS, PLATFORM_SECTION] : NAV_SECTIONS
  )
    .filter((section) => staff || !section.staffOnly)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => staff || !item.staffOnly),
    }))
    // A section whose every item was filtered away would render as a bare
    // heading over nothing.
    .filter((section) => section.items.length > 0);

  const ticker = await readTickerFigures();

  const brand = (
    <Link className="side__brand" href="/dashboard">
      <span className="mark" aria-hidden="true" />
      <span>
        <span className="side__brand-name">
          Swakopmund Christian Academy
        </span>
        <span className="side__brand-sub">
          {isSuperadmin(user) ? "Academic Officer" : "Teacher Portal"}
        </span>
      </span>
    </Link>
  );

  const navTree = sections.map((section) => (
    <div key={section.label}>
      <p className="side__section-label">{section.label}</p>
      <ul className="flex list-none flex-col gap-0.5">
        {section.items.map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} label={item.label} />
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    // App shell: the sidebar is fixed and the workspace scrolls. Constrained
    // here rather than on <body> so the login page can still scroll on a
    // short viewport.
    <div className="shell-frame">
      <aside className="side">
        {brand}
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-6">
          {navTree}
        </nav>
      </aside>

      <div className="workspace">
        {/* Below 900px the sidebar is hidden, so the same route list is
            emitted as a <details> disclosure. No JavaScript and no second
            copy of the nav definition. */}
        <details className="side-mobile">
          <summary>Menu</summary>
          <nav aria-label="Primary (compact)" className="side-mobile__panel">
            {brand}
            {navTree}
          </nav>
        </details>

        <header className="workspace__header">
          <div>
            <h1 className="workspace__title">
              {isSuperadmin(user)
                ? "Academic Officer Dashboard"
                : "Teacher Planner"}
            </h1>
            <p className="workspace__meta">
              {user.full_name} · {user.role.replace(/_/g, " ")}
              {user.grade_band ? ` · ${user.grade_band}` : ""}
            </p>
          </div>

          <form action={logout}>
            <button type="submit" className="btn-outline">
              Sign out
            </button>
          </form>
        </header>

        <Ticker items={ticker} />

        <div className="workspace__body">{children}</div>
      </div>
    </div>
  );
}
