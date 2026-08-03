import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpecialist } from "@/lib/agent/personas";
import { AgentChat } from "@/app/(dashboard)/agent/[id]/agent-chat";

type TextContent = { type: string; text?: string };
type Step = { type: string; content?: TextContent[] };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("agent_conversations")
    .select("id, specialist, title")
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("agent_messages")
    .select("role, content")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  // Collapse stored interaction steps into display turns, dropping tool-call
  // scaffolding — the transcript should read like a conversation.
  const turns = (messages ?? [])
    .map((m) => {
      const steps = (m.content ?? []) as unknown as Step[];
      const text = steps
        .filter((s) => s.type === "user_input" || s.type === "model_output")
        .flatMap((s) => s.content ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("")
        .trim();
      const tools = steps.filter((s) => s.type === "function_call").length;
      return {
        role: m.role as "user" | "assistant",
        text,
        tools: tools > 0 ? Array(tools).fill("tool") : undefined,
      };
    })
    .filter((t) => t.text.length > 0);

  const specialist = getSpecialist(conversation.specialist);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/agent"
          className="text-xs font-medium text-body hover:text-ink"
        >
          ← Conversations
        </Link>
        <span className="rounded-md bg-[#f1f4f8] px-2 py-1 text-xs font-medium text-body">
          {specialist.label}
        </span>
      </div>

      <AgentChat
        conversationId={conversation.id}
        initialTurns={turns}
        specialistLabel={specialist.label}
      />
    </div>
  );
}
