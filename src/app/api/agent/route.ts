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

          // The wire protocol is: step.start announces a step (with its type and,
          // for function calls, id + name), step.delta carries incremental
          // payload keyed by the same index, step.stop closes it. Accumulate per
          // index rather than guessing, so text, tool args, and thought
          // signatures each land in the right place.
          type Pending = {
            type: string;
            id?: string;
            name?: string;
            text: string;
            argsRaw: string;
            signature?: string;
          };
          const pending = new Map<number, Pending>();

          const slot = (index: number, type = ""): Pending => {
            const existing = pending.get(index);
            if (existing) return existing;
            const fresh: Pending = { type, text: "", argsRaw: "" };
            pending.set(index, fresh);
            return fresh;
          };

          for await (const raw of modelStream) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = raw as any;
            const index = Number(event.index ?? 0);

            if (event.event_type === "step.start") {
              const step = event.step ?? {};
              const s = slot(index, String(step.type ?? ""));
              s.type = String(step.type ?? s.type);
              if (step.id) s.id = String(step.id);
              if (step.name) s.name = String(step.name);
              continue;
            }

            if (event.event_type !== "step.delta") continue;

            const delta = event.delta ?? {};
            const s = slot(index);

            switch (delta.type) {
              case "text":
                s.text += String(delta.text ?? "");
                send("text", { delta: String(delta.text ?? "") });
                break;
              // Tool arguments stream as a JSON string, in one or more chunks.
              case "arguments_delta":
              case "arguments":
                s.argsRaw += String(delta.arguments ?? "");
                break;
              case "thought_signature":
                s.signature = String(delta.signature ?? "");
                break;
            }
          }

          const producedSteps: Step[] = [];
          const calls: {
            id: string;
            name: string;
            args: Record<string, unknown>;
          }[] = [];

          for (const index of [...pending.keys()].sort((a, b) => a - b)) {
            const s = pending.get(index)!;

            if (s.type === "thought") {
              // Replayed so the model keeps its reasoning thread across turns.
              producedSteps.push(
                s.signature
                  ? { type: "thought", signature: s.signature }
                  : { type: "thought" },
              );
            } else if (s.type === "model_output" && s.text) {
              producedSteps.push({
                type: "model_output",
                content: [{ type: "text", text: s.text }],
              });
            } else if (s.type === "function_call" && s.name) {
              let args: Record<string, unknown> = {};
              if (s.argsRaw) {
                try {
                  args = JSON.parse(s.argsRaw);
                } catch {
                  args = {};
                }
              }
              calls.push({ id: s.id ?? "", name: s.name, args });
              producedSteps.push({
                type: "function_call",
                id: s.id ?? "",
                name: s.name,
                arguments: args,
              });
            }
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
