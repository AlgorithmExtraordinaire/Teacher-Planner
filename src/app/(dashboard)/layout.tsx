import { requireUser, isSuperadmin } from "@/lib/dal";
import { logout } from "@/app/login/actions";
import { NavLink } from "@/app/(dashboard)/nav-link";
import { ThemeSwitcher } from "@/components/theme-switcher";

const NAV_SECTIONS = [
  {
    label: "Dashboards",
    items: [
      { href: "/dashboard", label: "Dashboard Overview" },
      { href: "/lesson-plans/new", label: "Lesson Plan Generator" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/agent", label: "Assistant" },
      { href: "/agent/proposals", label: "Proposals" },
      { href: "/workflows", label: "Workflows" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/resources", label: "Curriculum Catalogue" },
      { href: "/resources/folders", label: "My Folders" },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/roster", label: "Roster" },
      { href: "/calendar", label: "Academic Calendar" },
      { href: "/standards", label: "Curriculum Standards" },
      { href: "/lesson-plans", label: "Lesson Plans" },
      { href: "/assessments", label: "Assessments" },
      { href: "/tables", label: "All Tables" },
    ],
  },
];

// Superadmin only. Hiding it is a courtesy, not the control — RLS is what
// stops anyone else reading settings, schools, or the audit log.
const PLATFORM_SECTION = {
  label: "Platform",
  items: [{ href: "/admin/settings", label: "Settings & Audit" }],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const sections = isSuperadmin(user)
    ? [...NAV_SECTIONS, PLATFORM_SECTION]
    : NAV_SECTIONS;

  return (
    // App shell: sidebar fixed, workspace scrolls. Constrained here rather
    // than on <body> so the login page can still scroll on a short viewport.
    <div className="flex h-screen overflow-hidden">
      <aside
        className="hidden w-[260px] shrink-0 flex-col gap-8 overflow-y-auto px-6 py-8 md:flex"
        style={{
          backgroundColor: "var(--bg-sidebar)",
          color: "var(--sidebar-fg)",
          borderRight: "var(--border-width) solid var(--border-color)",
        }}
      >
        <div>
          <h2 className="text-base font-semibold leading-tight">
            Swakopmund Christian Academy
          </h2>
          <small
            className="text-xs"
            style={{ color: "var(--sidebar-active)" }}
          >
            Academic Officer Portal
          </small>
        </div>

        <nav className="flex flex-1 flex-col gap-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--sidebar-muted)" }}
              >
                {section.label}
              </p>
              <ul className="flex list-none flex-col gap-3">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main
        className="flex flex-1 flex-col overflow-y-auto"
        style={{ backgroundColor: "var(--bg-app)" }}
      >
        <header
          className="flex flex-wrap items-center justify-between gap-4 px-8 py-4"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div>
            <h1 className="text-xl font-semibold">
              {user.role === "superadmin"
                ? "Academic Officer Dashboard"
                : "Teacher Planner"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {user.full_name} ·{" "}
              <span className="capitalize">
                {user.role.replace("_", " ")}
              </span>
              {user.grade_band ? ` · ${user.grade_band}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <form action={logout}>
              <button type="submit" className="btn-primary">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
