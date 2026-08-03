import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { KpiCard, EmptyState } from "@/components/ui";
import { Badge } from "@/components/cell";

/**
 * Dashboard Overview.
 *
 * Layout follows the Lean Academy grid: KPI row, a kanban of lesson-plan
 * status, then a dense table of recent approvals.
 *
 * Every figure is read from the database. Nothing here is illustrative — an
 * empty column means the school genuinely has no records of that kind, and
 * that is the useful signal.
 */
export default async function DashboardOverviewPage() {
  await requireUser();
  const supabase = await createClient();

  const [
    { count: studentCount },
    { count: unstaffedClasses },
    { count: pendingProposals },
    { data: plans },
    { data: approvals },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .is("teacher_id", null),
    supabase
      .from("agent_actions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("lesson_plans")
      .select("id, title, status, lesson_date, classes(name)")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("agent_actions")
      .select("id, action_type, status, rationale, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const byStatus = (status: string) =>
    (plans ?? []).filter((p) => p.status === status);

  const columns = [
    { key: "draft", title: "Draft", modifier: "kanban-head--todo" },
    { key: "submitted", title: "Submitted", modifier: "kanban-head--progress" },
    { key: "approved", title: "Approved", modifier: "kanban-head--review" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <KpiCard
          label="Active learners"
          value={studentCount ?? 0}
          tone="navy"
        />
        <KpiCard
          label="Classes without a teacher"
          value={unstaffedClasses ?? 0}
          tone={unstaffedClasses ? "crimson" : "navy"}
          note={unstaffedClasses ? "Needs a staffing decision" : "All staffed"}
        />
        <KpiCard
          label="Proposals awaiting approval"
          value={pendingProposals ?? 0}
          tone={pendingProposals ? "gold" : "navy"}
          note={
            pendingProposals
              ? "Assistant suggestions pending review"
              : "Nothing queued"
          }
        />
      </div>

      {/* Lesson preparation kanban */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-main">
          Lesson preparation
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const items = byStatus(col.key);
            return (
              <div key={col.key} className="card">
                <h4 className={`kanban-head ${col.modifier}`}>
                  {col.title}
                  <span className="ml-2 font-normal text-muted">
                    {items.length}
                  </span>
                </h4>

                {items.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">None.</p>
                ) : (
                  items.slice(0, 6).map((p) => (
                    <div key={p.id} className="kanban-item">
                      <p className="font-medium text-main">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {p.classes?.name ?? "Unassigned class"}
                        {p.lesson_date ? ` · ${p.lesson_date}` : ""}
                      </p>
                    </div>
                  ))
                )}

                {items.length > 6 && (
                  <p className="mt-3 text-xs text-muted">
                    +{items.length - 6} more
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent approvals */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-main">
          Recent authorisations &amp; approvals
        </h2>
        {approvals && approvals.length > 0 ? (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr>
                  {["Item", "Description", "Category", "Status"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-line px-4 py-2 font-semibold text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvals.map((a) => (
                  <tr key={a.id} className="hover:bg-surface">
                    <td className="border-b border-line px-4 py-2 font-mono text-xs text-muted">
                      #{a.id.slice(0, 8)}
                    </td>
                    <td className="border-b border-line px-4 py-2 text-main">
                      {a.rationale ?? "—"}
                    </td>
                    <td className="border-b border-line px-4 py-2 capitalize text-main">
                      {a.action_type.replace(/_/g, " ")}
                    </td>
                    <td className="border-b border-line px-4 py-2">
                      <Badge value={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No proposals yet. Entries appear here when the Assistant proposes a change and someone reviews it." />
        )}
      </section>
    </div>
  );
}
