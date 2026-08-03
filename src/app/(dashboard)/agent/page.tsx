import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { SPECIALISTS } from "@/lib/agent/personas";
import { startConversation } from "@/app/(dashboard)/agent/actions";

export default async function AgentPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: conversations }, { count: pendingProposals }] =
    await Promise.all([
      supabase
        .from("agent_conversations")
        .select("id, title, specialist, updated_at")
        .eq("profile_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("agent_actions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Assistant"
          description="Ask a specialist about your classes, data, and planning."
        />
        {(pendingProposals ?? 0) > 0 && (
          <Link
            href="/agent/proposals"
            className="h-fit rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            {pendingProposals} proposal
            {pendingProposals === 1 ? "" : "s"} awaiting review
          </Link>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Start a conversation
      </h2>
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SPECIALISTS.map((s) => (
          <form key={s.id} action={startConversation}>
            <input type="hidden" name="specialist" value={s.id} />
            <button type="submit" className="w-full text-left">
              <Card className="h-full transition hover:border-slate-400 hover:shadow">
                <p className="text-sm font-medium text-slate-900">{s.label}</p>
                <p className="mt-1 text-xs text-slate-500">{s.blurb}</p>
              </Card>
            </button>
          </form>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Recent conversations
      </h2>
      {(conversations ?? []).length === 0 ? (
        <EmptyState message="No conversations yet. Pick a specialist above to begin." />
      ) : (
        <div className="flex flex-col gap-2">
          {(conversations ?? []).map((c) => (
            <Link key={c.id} href={`/agent/${c.id}`}>
              <Card className="p-3 transition hover:border-slate-400">
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate text-sm text-slate-800">{c.title}</p>
                  <span className="shrink-0 text-xs text-slate-500">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
