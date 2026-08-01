import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Gemini function-tool declaration (`FunctionT` in @google/genai). */
type FunctionTool = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

// Agent tools.
//
// Reads run through the caller's own Supabase client, so Row Level Security
// applies unchanged — the agent can never see more than the person asking.
// Writes are not exposed: `propose_action` queues a row in `agent_actions`
// for a human to approve.

/** Tables the agent may read. Anything absent here is unreachable. */
const READABLE = [
  "classes",
  "students",
  "teachers",
  "class_enrollment",
  "curriculum_standards",
  "curriculum_modules",
  "academic_calendar",
  "lesson_plans",
  "assessments",
  "assessment_results",
  "pacing_monitor",
  "interventions",
  "reflection_pd_log",
  "mobymax_log",
  "mobymax_assignments",
  "duolingo_tracker",
  "language_platform_migration",
  "system_alerts",
  // Curriculum catalogue. Without these the assistant is blind to the actual
  // textbooks and teacher guides, which is most of what planning questions are
  // really about. RLS still applies: `planner_folders` and their items are
  // private to the owning teacher, so the agent sees only the caller's own.
  "resource_categories",
  "resource_courses",
  "resource_collections",
  "resources",
  "planner_folders",
  "planner_folder_items",
  "lesson_plan_resources",
] as const;

const MAX_ROWS = 100;

export const AGENT_TOOLS: FunctionTool[] = [
  {
    type: "function",
    name: "query_table",
    description: `Read rows from one of the school's tables. Use this whenever a question depends on what is actually recorded. Returns at most ${MAX_ROWS} rows.

Available tables: ${READABLE.join(", ")}.`,
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: [...READABLE],
          description: "Table to read from.",
        },
        columns: {
          type: "string",
          description:
            "Comma-separated column list, or '*' for all. Prefer naming the columns you need.",
        },
        filters: {
          type: "array",
          description: "Optional equality/comparison filters, ANDed together.",
          items: {
            type: "object",
            properties: {
              column: { type: "string" },
              op: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "is_null", "not_null"],
              },
              value: {
                type: "string",
                description: "Ignored for is_null / not_null.",
              },
            },
            required: ["column", "op"],
          },
        },
        order_by: { type: "string", description: "Column to sort by." },
        ascending: { type: "boolean", description: "Sort direction." },
        limit: {
          type: "number",
          description: `Max rows (1–${MAX_ROWS}).`,
        },
      },
      required: ["table"],
    },
  },
  {
    type: "function",
    name: "count_rows",
    description:
      "Count rows in a table, optionally filtered. Cheaper than query_table when you only need a number.",
    parameters: {
      type: "object",
      properties: {
        table: { type: "string", enum: [...READABLE] },
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              column: { type: "string" },
              op: {
                type: "string",
                enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "is_null", "not_null"],
              },
              value: { type: "string" },
            },
            required: ["column", "op"],
          },
        },
      },
      required: ["table"],
    },
  },
  {
    type: "function",
    name: "propose_action",
    description: `Propose a change to the school's data. This does NOT apply the change — it queues a proposal for a human to review and approve. Tell the user you have proposed it and that it awaits approval.`,
    parameters: {
      type: "object",
      properties: {
        action_type: {
          type: "string",
          enum: [
            "create_lesson_plan",
            "create_intervention",
            "create_assessment",
            "update_pacing",
          ],
        },
        payload: {
          type: "object",
          description:
            "The row to create or update, as column/value pairs matching the target table.",
          additionalProperties: true,
        },
        rationale: {
          type: "string",
          description:
            "Why you are proposing this — shown to the reviewer alongside the payload.",
        },
      },
      required: ["action_type", "payload", "rationale"],
    },
  },
];

type Filter = { column: string; op: string; value?: string };

function applyFilters<T>(query: T, filters: Filter[] | undefined): T {
  if (!filters?.length) return query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = query;
  for (const f of filters) {
    switch (f.op) {
      case "is_null":
        q = q.is(f.column, null);
        break;
      case "not_null":
        q = q.not(f.column, "is", null);
        break;
      case "like":
        q = q.ilike(f.column, `%${f.value ?? ""}%`);
        break;
      default:
        q = q[f.op](f.column, f.value);
    }
  }
  return q as T;
}

export type ToolContext = {
  supabase: SupabaseClient;
  profileId: string;
  conversationId: string;
};

export type ToolOutcome = {
  content: string;
  /** Set when the tool queued a proposal, so the UI can refresh the queue. */
  proposedActionId?: string;
};

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolOutcome> {
  const { supabase } = ctx;

  try {
    switch (name) {
      case "query_table": {
        const table = String(input.table ?? "");
        if (!READABLE.includes(table as (typeof READABLE)[number])) {
          return { content: `Table "${table}" is not readable.` };
        }

        const columns = String(input.columns ?? "*") || "*";
        const limit = Math.min(
          MAX_ROWS,
          Math.max(1, Number(input.limit) || 25),
        );

        let q = supabase.from(table).select(columns).limit(limit);
        q = applyFilters(q, input.filters as Filter[] | undefined);

        if (input.order_by) {
          q = q.order(String(input.order_by), {
            ascending: input.ascending !== false,
          });
        }

        const { data, error } = await q;
        if (error) return { content: `Query failed: ${error.message}` };
        if (!data || data.length === 0) {
          return { content: `No rows matched in "${table}".` };
        }
        return {
          content: JSON.stringify({ table, count: data.length, rows: data }),
        };
      }

      case "count_rows": {
        const table = String(input.table ?? "");
        if (!READABLE.includes(table as (typeof READABLE)[number])) {
          return { content: `Table "${table}" is not readable.` };
        }

        let q = supabase.from(table).select("*", { count: "exact", head: true });
        q = applyFilters(q, input.filters as Filter[] | undefined);

        const { count, error } = await q;
        if (error) return { content: `Count failed: ${error.message}` };
        return { content: JSON.stringify({ table, count: count ?? 0 }) };
      }

      case "propose_action": {
        const { data, error } = await supabase
          .from("agent_actions")
          .insert({
            conversation_id: ctx.conversationId,
            proposed_by: ctx.profileId,
            action_type: String(input.action_type),
            payload: input.payload ?? {},
            rationale: String(input.rationale ?? ""),
          })
          .select("id")
          .single();

        if (error) return { content: `Could not queue proposal: ${error.message}` };
        return {
          content: `Proposal queued (id ${data.id}). It is pending human approval and has NOT been applied.`,
          proposedActionId: data.id,
        };
      }

      default:
        return { content: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return {
      content: `Tool error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
