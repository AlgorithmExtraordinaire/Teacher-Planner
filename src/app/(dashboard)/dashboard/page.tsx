import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { KpiCard, EmptyState, Panel, SectionLabel } from "@/components/ui";
import { Badge } from "@/components/cell";

/**
 * Dashboard Overview.
 *
 * Follows the template's hero-dashboard layout: a metric row, the primary
 * panel (lesson preparation, as a three-stage kanban), then a dense table of
 * recent authorisations.
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
    <div className="flex flex-col gap-8">
      {/* Metric row. The figures that need a decision take the accent or the
          danger tone; the rest stay neutral, so a coloured figure always
          means something. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Active learners"
          value={studentCount ?? "—"}
          note="On the roster today"
        />
        <KpiCard
          label="Classes without a teacher"
          value={unstaffedClasses ?? "—"}
          tone={unstaffedClasses ? "danger" : "neutral"}
          note={
            unstaffedClasses ? "Needs a staffing decision" : "All classes staffed"
          }
          trend={unstaffedClasses ? "down" : "up"}
        />
        <KpiCard
          label="Proposals awaiting review"
          value={pendingProposals ?? "—"}
          tone={pendingProposals ? "accent" : "neutral"}
          note={
            pendingProposals ? "Assistant suggestions pending" : "Queue clear"
          }
          trend={pendingProposals ? "down" : "up"}
        />
      </div>

      {/* Lesson preparation — the page's primary panel. */}
      <Panel
        title={
          <>
            Lesson preparation, <span className="it">this term</span>
          </>
        }
        meta={`${plans?.length ?? 0} most recent plans`}
        actions={
          <Link href="/lesson-plans/new" className="btn-primary btn-sm">
            Generate a plan →
          </Link>
        }
        raised
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {columns.map((col) => {
            const items = byStatus(col.key);
            return (
              <div key={col.key}>
                <h3 className={`kanban-head ${col.modifier}`}>
                  {col.title}
                  <span className="font-normal">{items.length}</span>
                </h3>

                {items.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">None.</p>
                ) : (
                  items.slice(0, 6).map((p) => (
                    <div key={p.id} className="kanban-item">
                      <p className="font-medium text-main">{p.title}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
                        {p.classes?.name ?? "Unassigned class"}
                        {p.lesson_date ? ` · ${p.lesson_date}` : ""}
                      </p>
                    </div>
                  ))
                )}

                {items.length > 6 && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
                    +{items.length - 6} more
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Recent authorisations */}
      <section>
        <SectionLabel>Recent authorisations &amp; approvals</SectionLabel>
        {approvals && approvals.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table min-w-max">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Description</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((a) => (
                  <tr key={a.id}>
                    <td className="cell-num text-muted">
                      #{a.id.slice(0, 8)}
                    </td>
                    <td>{a.rationale ?? <span className="text-muted">—</span>}</td>
                    <td className="capitalize">
                      {a.action_type.replace(/_/g, " ")}
                    </td>
                    <td>
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
