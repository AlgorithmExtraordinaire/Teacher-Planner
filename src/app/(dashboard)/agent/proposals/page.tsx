import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, isStaffAdmin } from "@/lib/dal";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Badge } from "@/components/cell";
import { reviewAction } from "@/app/(dashboard)/agent/actions";

export default async function ProposalsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const canReview = isStaffAdmin(user);

  const { data: proposals } = await supabase
    .from("agent_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const pending = (proposals ?? []).filter((p) => p.status === "pending");
  const settled = (proposals ?? []).filter((p) => p.status !== "pending");

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/agent"
          className="text-xs font-medium text-body hover:text-ink"
        >
          ← Assistant
        </Link>
      </div>

      <PageHeader
        title="Agent Proposals"
        description="The assistant cannot change school data directly. Every change it suggests lands here for a human to approve."
      />

      {!canReview && (
        <Card className="mb-6 border-line bg-[#f7f9fc] text-sm text-body">
          You can see proposals, but only admins and grade leads can approve
          them.
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold text-ink">
        Awaiting review
      </h2>
      {pending.length === 0 ? (
        <EmptyState message="Nothing awaiting review." />
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge value={p.action_type} />
                    <span className="text-xs text-body">
                      {new Date(p.created_at).toLocaleString()}
                    </span>
                  </div>
                  {p.rationale && (
                    <p className="mt-2 text-sm text-body">{p.rationale}</p>
                  )}
                  <pre className="mt-2 overflow-x-auto rounded-md bg-[#f7f9fc] p-3 text-xs text-body">
                    {JSON.stringify(p.payload, null, 2)}
                  </pre>
                </div>

                {canReview && (
                  <div className="flex shrink-0 gap-2">
                    <form action={reviewAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={reviewAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <button
                        type="submit"
                        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-body hover:bg-[#f1f4f8]"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-sm font-semibold text-ink">
        History
      </h2>
      {settled.length === 0 ? (
        <EmptyState message="No reviewed proposals yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {settled.map((p) => (
            <Card key={p.id} className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge value={p.status} />
                <Badge value={p.action_type} />
                <span className="flex-1 truncate text-sm text-body">
                  {p.error_message ?? p.rationale ?? ""}
                </span>
                <span className="text-xs text-body">
                  {p.reviewed_at
                    ? new Date(p.reviewed_at).toLocaleDateString()
                    : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
