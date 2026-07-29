import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { logout } from "@/app/login/actions";

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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="mb-8 px-2">
          <p className="text-sm font-semibold text-slate-900">
            Teacher Planner
          </p>
          <p className="text-xs text-slate-500">Swakopmund Christian Academy</p>
        </div>
        <nav className="flex flex-1 flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.label}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user.full_name}
            </p>
            <p className="text-xs capitalize text-slate-500">
              {user.role.replace("_", " ")}
              {user.grade_band ? ` · ${user.grade_band}` : ""}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Sign out
            </button>
          </form>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
