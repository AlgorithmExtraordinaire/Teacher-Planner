import { timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { executeWorkflow, isDue, type WorkflowRow } from "@/lib/workflows/run";

// Scheduled workflow runner.
//
// POST /api/cron/workflows
//   Authorization: Bearer <CRON_SECRET>
//   ?force=true   run every enabled workflow, ignoring cadence (for testing)
//
// Called by an external scheduler (n8n Schedule Trigger or systemd timer).
// The app itself holds no timer: a Next.js server has no reliable place to
// keep one across restarts or replicas, and a wedged in-process interval
// fails silently. An external caller is observable and retryable.
//
// This route is exempt from the auth redirect in `lib/supabase/proxy.ts`,
// so the bearer check below is the ONLY thing standing in front of a
// service-role client. Treat it accordingly.

export const maxDuration = 300;

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Length is compared first and leaks only the length, which is not secret.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return Response.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !secretMatches(provided, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Service client unavailable." },
      { status: 503 },
    );
  }

  const force = new URL(request.url).searchParams.get("force") === "true";

  const { data: workflows, error } = await supabase
    .from("workflows")
    .select(
      "id, name, rule_type, params, severity, recipient_role, cadence, is_enabled, last_run_at",
    )
    .eq("is_enabled", true);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const enabled = (workflows ?? []) as unknown as WorkflowRow[];
  const due = enabled.filter((w) => force || isDue(w, now));

  // Sequential on purpose: these are analytical queries over the whole school,
  // and a burst of them in parallel is how you take the database down.
  const results = [];
  for (const workflow of due) {
    const outcome = await executeWorkflow(supabase, workflow, "scheduled");
    results.push({ id: workflow.id, name: workflow.name, ...outcome });
  }

  const failed = results.filter((r) => r.status === "error").length;

  return Response.json(
    {
      at: now.toISOString(),
      enabled: enabled.length,
      due: due.length,
      ran: results.length,
      failed,
      results,
    },
    // A failed workflow is a real incident the scheduler should be able to
    // detect from the status code alone, without parsing the body.
    { status: failed > 0 ? 500 : 200 },
  );
}
