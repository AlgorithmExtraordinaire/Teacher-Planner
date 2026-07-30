import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { AGENT_TOOLS, executeTool } from "@/lib/agent/tools";
import { buildSystemPrompt, getSpecialist } from "@/lib/agent/personas";

export const maxDuration = 120;

const MODEL = "gemini-3.1-flash-lite";
const MAX_TOOL_ROUNDS = 8;

// Interaction steps, as sent to and received from the Gemini interactions API.
// We replay the transcript ourselves (`store: false`) so the school's own
// database stays the single source of truth and Google retains nothing.
type TextContent = { type: "text"; text: string };
type Step =
  | { type: "user_input"; content: TextContent[] }
  | { type: "model_output"; content?: TextContent[] }
  | { type: "function_call"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "function_result"; call_id: string; name?: string; result: string; is_error?: boolean }
  | { type: string; [k: string]: unknown };

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Steps are structurally JSON; Supabase's `Json` type wants an index signature. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (value: unknown) => value as any;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "The assistant is not configured yet — GEMINI_API_KEY is missing on the server.",
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

  // Rebuild the transcript from our own records.
  const { data: history } = await supabase
    .from("agent_messages")
    .select("content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const steps: Step[] = (history ?? []).flatMap(
    (row) => (row.content ?? []) as unknown as Step[],
  );

  const userStep: Step = {
    type: "user_input",
    content: [{ type: "text", text: userMessage }],
  };
  steps.push(userStep);

  await supabase.from("agent_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: asJson([userStep]),
  });

  const specialist = getSpecialist(conversation.specialist);
  const systemInstruction = buildSystemPrompt(specialist, user);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(new TextEncoder().encode(sse(event, data)));

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const modelStream = await ai.interactions.create({
            model: MODEL,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            input: steps as any,
            system_instruction: systemInstruction,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tools: AGENT_TOOLS as any,
            store: false,
            stream: true,
          });

          let assistantText = "";
          const calls: {
            id: string;
            name: string;
            args: Record<string, unknown>;
          }[] = [];
          // function_call arguments arrive as a JSON string across deltas
          const argBuffers = new Map<number, string>();
          const callMeta = new Map<number, { id: string; name: string }>();

          for await (const event of modelStream) {
            if (event.event_type === "step.start") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const step = (event as any).step;
              if (step?.type === "function_call") {
                callMeta.set(Number((event as { index?: number }).index ?? 0), {
                  id: String(step.id ?? ""),
                  name: String(step.name ?? ""),
                });
              }
              continue;
            }

            if (event.event_type !== "step.delta") continue;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const delta = (event as any).delta;
            const index = Number((event as { index?: number }).index ?? 0);

            if (delta?.type === "text" && typeof delta.text === "string") {
              assistantText += delta.text;
              send("text", { delta: delta.text });
            } else if (delta?.type === "arguments") {
              argBuffers.set(
                index,
                (argBuffers.get(index) ?? "") + String(delta.arguments ?? ""),
              );
              if (delta.id || delta.name) {
                callMeta.set(index, {
                  id: String(delta.id ?? callMeta.get(index)?.id ?? ""),
                  name: String(delta.name ?? callMeta.get(index)?.name ?? ""),
                });
              }
            } else if (delta?.type === "function_call") {
              calls.push({
                id: String(delta.id ?? ""),
                name: String(delta.name ?? ""),
                args: (delta.arguments ?? {}) as Record<string, unknown>,
              });
            }
          }

          // Fold any streamed argument buffers into concrete calls.
          for (const [index, raw] of argBuffers) {
            const meta = callMeta.get(index);
            if (!meta?.name) continue;
            let args: Record<string, unknown> = {};
            try {
              args = raw ? JSON.parse(raw) : {};
            } catch {
              args = {};
            }
            calls.push({ id: meta.id, name: meta.name, args });
          }

          const producedSteps: Step[] = [];
          if (assistantText) {
            producedSteps.push({
              type: "model_output",
              content: [{ type: "text", text: assistantText }],
            });
          }
          for (const c of calls) {
            producedSteps.push({
              type: "function_call",
              id: c.id,
              name: c.name,
              arguments: c.args,
            });
          }

          steps.push(...producedSteps);

          // No tool calls — the turn is complete.
          if (calls.length === 0) {
            if (producedSteps.length > 0) {
              await supabase.from("agent_messages").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: asJson(producedSteps),
              });
            }
            await supabase
              .from("agent_conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
            break;
          }

          const resultSteps: Step[] = [];
          for (const call of calls) {
            send("tool", { name: call.name });

            const outcome = await executeTool(call.name, call.args, {
              supabase,
              profileId: user.id,
              conversationId,
            });

            if (outcome.proposedActionId) {
              send("proposal", { id: outcome.proposedActionId });
            }

            resultSteps.push({
              type: "function_result",
              call_id: call.id,
              name: call.name,
              result: outcome.content,
            });
          }

          steps.push(...resultSteps);

          await supabase.from("agent_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: asJson([...producedSteps, ...resultSteps]),
          });
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
