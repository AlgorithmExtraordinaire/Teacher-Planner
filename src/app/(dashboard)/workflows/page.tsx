import { createClient } from "@/lib/supabase/server";
import { requireUser, isStaffAdmin } from "@/lib/dal";
import { PageHeader, Card, EmptyState, StatTile } from "@/components/ui";
import { Badge, formatCell } from "@/components/cell";
import { WorkflowForm } from "@/app/(dashboard)/workflows/workflow-form";
import { runWorkflow, toggleWorkflow } from "@/app/(dashboard)/workflows/actions";
import { getRule } from "@/lib/workflows/definitions";

export default async function WorkflowsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const canManage = isStaffAdmin(user);

  const [{ data: workflows }, { data: runs }] = await Promise.all([
    supabase.from("workflows").select("*").order("name"),
    supabase
      .from("workflow_runs")
      .select("*, workflows(name)")
      .order("started_at", { ascending: false })
      .limit(15),
  ]);

  const list = workflows ?? [];
  const enabled = list.filter((w) => w.is_enabled).length;
  const totalAlerts = (runs ?? []).reduce(
    (sum, r) => sum + (r.alerts_created ?? 0),
    0,
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Workflows"
          description="Automated rules that watch the school's data and raise alerts."
        />
        {canManage && <WorkflowForm />}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Workflows" value={list.length} />
        <StatTile label="Enabled" value={enabled} />
        <StatTile label="Alerts (recent runs)" value={totalAlerts} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Configured workflows
      </h2>

      {list.length === 0 ? (
        <EmptyState
          message={
            canManage
              ? "No workflows yet. Create one to start automating."
              : "No workflows configured yet."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((w) => {
            const rule = getRule(w.rule_type);
            return (
              <Card key={w.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {w.name}
                      </p>
                      <Badge value={w.cadence} />
                      <Badge value={w.severity} />
                      {!w.is_enabled && <Badge value="inactive" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {rule?.label ?? w.rule_type}
                      {w.description ? ` · ${w.description}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last run:{" "}
                      {w.last_run_at
                        ? new Date(w.last_run_at).toLocaleString()
                        : "never"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <form action={runWorkflow}>
                      <input type="hidden" name="id" value={w.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        Run now
                      </button>
                    </form>
                    {canManage && (
                      <form action={toggleWorkflow}>
                        <input type="hidden" name="id" value={w.id} />
                        <input
                          type="hidden"
                          name="enable"
                          value={String(!w.is_enabled)}
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {w.is_enabled ? "Disable" : "Enable"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-sm font-semibold text-slate-900">
        Recent runs
      </h2>
      {(runs ?? []).length === 0 ? (
        <EmptyState message="No runs yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {["Workflow", "Started", "Status", "Matches", "Alerts", "Summary"].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-600"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(runs ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">
                    {r.workflows?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {new Date(r.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge value={r.status} />
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-700">
                    {r.matches_found}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-700">
                    {r.alerts_created}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {formatCell(r.error_message ?? r.summary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
