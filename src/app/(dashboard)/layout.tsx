import { requireUser, isSuperadmin } from "@/lib/dal";
import { logout } from "@/app/login/actions";
import { NavLink } from "@/app/(dashboard)/nav-link";

const NAV_SECTIONS = [
  {
    label: "Dashboards",
    items: [
      { href: "/", label: "Command Center" },
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
    <div className="flex min-h-screen bg-white">
      <aside className="hidden w-64 shrink-0 flex-col bg-navy px-3 py-6 md:flex">
        <div className="mb-8 px-3">
          <p className="text-sm font-semibold tracking-tight text-white">
            Teacher Planner
          </p>
          <p className="mt-0.5 text-xs text-navy-muted">
            Swakopmund Christian Academy
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-6">
          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-0.5">
              <p className="px-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
                {section.label}
              </p>
              {section.items.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-6 border-t border-navy-border px-4 pt-4">
          <p className="text-xs text-navy-muted">
            {user.role === "superadmin" ? "Platform owner" : "Signed in"}
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3.5">
          <div>
            <p className="text-sm font-semibold text-ink">{user.full_name}</p>
            <p className="text-xs capitalize text-body">
              {user.role.replace("_", " ")}
              {user.grade_band ? ` · ${user.grade_band}` : ""}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-sm border border-line px-3 py-1.5 text-sm font-medium text-body transition-colors hover:border-crimson hover:text-crimson"
            >
              Sign out
            </button>
          </form>
        </header>

        <main className="flex-1 bg-white px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
