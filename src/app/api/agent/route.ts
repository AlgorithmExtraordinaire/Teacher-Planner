import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { AGENT_TOOLS, executeTool } from "@/lib/agent/tools";
import { buildSystemPrompt, getSpecialist } from "@/lib/agent/personas";

export const maxDuration = 120;

const MODEL = "claude-opus-5";
const MAX_TOOL_ROUNDS = 8;

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Anthropic's content blocks are structurally JSON but don't carry the index
 * signature Supabase's `Json` type wants. This is the one boundary where that
 * matters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (blocks: unknown) => blocks as any;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "The assistant is not configured yet — ANTHROPIC_API_KEY is missing on the server.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const body = await request.json();
  const conversationId: string = body.conversationId;
  const userMessage: string = String(body.message ?? "").trim();

  if (!conversationId || !userMessage) {
    return new Response("Bad request", { status: 400 });
  }

  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("agent_conversations")
    .select("id, specialist")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  // Load prior turns, then append the new one.
  const { data: history } = await supabase
    .from("agent_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages: Anthropic.MessageParam[] = (history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    // Stored as jsonb; the shape is Anthropic's own content blocks.
    content: m.content as unknown as Anthropic.ContentBlockParam[],
  }));

  messages.push({ role: "user", content: [{ type: "text", text: userMessage }] });

  await supabase.from("agent_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: [{ type: "text", text: userMessage }],
  });

  const specialist = getSpecialist(conversation.specialist);
  const system = buildSystemPrompt(specialist, user);
  const anthropic = new Anthropic();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(new TextEncoder().encode(sse(event, data)));

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const modelStream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 16000,
            system,
            tools: AGENT_TOOLS,
            thinking: { type: "adaptive" },
            messages,
          });

          modelStream.on("text", (delta) => send("text", { delta }));

          const message = await modelStream.finalMessage();

          if (message.stop_reason === "refusal") {
            send("error", {
              message:
                "The assistant declined to answer that. Try rephrasing, or ask a staff member.",
            });
            break;
          }

          messages.push({ role: "assistant", content: message.content });

          const toolUses = message.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          // No tools requested — this is the final answer for the turn.
          if (toolUses.length === 0) {
            await supabase.from("agent_messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: asJson(message.content),
            });
            await supabase
              .from("agent_conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
            break;
          }

          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tool of toolUses) {
            send("tool", { name: tool.name });

            const outcome = await executeTool(
              tool.name,
              tool.input as Record<string, unknown>,
              { supabase, profileId: user.id, conversationId },
            );

            if (outcome.proposedActionId) {
              send("proposal", { id: outcome.proposedActionId });
            }

            results.push({
              type: "tool_result",
              tool_use_id: tool.id,
              content: outcome.content,
            });
          }

          // Persist the assistant turn (with its tool calls) and the results,
          // so the conversation replays correctly on reload.
          await supabase.from("agent_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: asJson(message.content),
          });

          messages.push({ role: "user", content: results });
        }

        send("done", {});
      } catch (e) {
        send("error", {
          message: e instanceof Error ? e.message : "Something went wrong.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

