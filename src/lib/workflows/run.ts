import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateRule } from "@/lib/workflows/rules";
import type { RuleType } from "@/lib/workflows/definitions";

// One execution path for workflows, shared by the "Run now" button and the
// scheduled runner. Both record a `workflow_runs` row, so a manual run and an
// automatic one are indistinguishable in the audit trail apart from `trigger`.

export type WorkflowRow = {
  id: string;
  name: string;
  rule_type: string;
  params: Record<string, unknown> | null;
  severity: string;
  recipient_role: string | null;
  cadence: string;
  is_enabled: boolean;
  last_run_at: string | null;
};

export type RunOutcome = {
  status: "success" | "error";
  matches: number;
  alertsCreated: number;
  summary: string;
};

const CADENCE_MS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Tolerance so a scheduler that fires a few seconds early still counts the
 * interval as elapsed. Without it an hourly job invoked by a fixed-time cron
 * would skip every other run.
 */
const EARLY_TOLERANCE_MS = 60 * 1000;

/**
 * Is this workflow due to run again?
 *
 * An unrecognised cadence never auto-runs. That is deliberate: a workflow
 * whose schedule we cannot interpret should sit still and wait for a human,
 * not guess an interval.
 */
export function isDue(workflow: WorkflowRow, now: Date = new Date()): boolean {
  if (!workflow.is_enabled) return false;

  const interval = CADENCE_MS[workflow.cadence];
  if (!interval) return false;

  if (!workflow.last_run_at) return true;

  const last = Date.parse(workflow.last_run_at);
  if (Number.isNaN(last)) return true;

  return now.getTime() - last >= interval - EARLY_TOLERANCE_MS;
}

/**
 * Evaluate one workflow, raise its alerts, and close out the run row.
 *
 * Any failure — including a failed alert insert — is recorded as `error`.
 * A run must never report success when it did not actually check anything;
 * a false all-clear is worse than a visible failure.
 */
export async function executeWorkflow(
  supabase: SupabaseClient,
  workflow: WorkflowRow,
  trigger: "manual" | "scheduled" = "manual",
): Promise<RunOutcome> {
  const { data: run } = await supabase
    .from("workflow_runs")
    .insert({ workflow_id: workflow.id, status: "running" })
    .select("id")
    .single();

  const runId: string | null = run?.id ?? null;

  try {
    const { matches, note } = await evaluateRule(
      supabase,
      workflow.rule_type as RuleType,
      workflow.params ?? {},
    );

    let alertsCreated = 0;
    if (matches.length > 0) {
      const { error: alertError } = await supabase.from("system_alerts").insert(
        matches.map((m) => ({
          message: `[${workflow.name}] ${m.summary}`,
          severity: workflow.severity,
          recipient_role: workflow.recipient_role,
          teacher_id: m.teacherId ?? null,
        })),
      );
      // Previously swallowed. If we found problems but could not tell anyone,
      // the run failed — surface it rather than reporting a clean pass.
      if (alertError) {
        throw new Error(`Alerts could not be raised: ${alertError.message}`);
      }
      alertsCreated = matches.length;
    }

    const summary = `${trigger === "scheduled" ? "Scheduled" : "Manual"} run — ${
      matches.length
    } match(es). ${note}`;

    await Promise.all([
      runId
        ? supabase
            .from("workflow_runs")
            .update({
              status: "success",
              finished_at: new Date().toISOString(),
              matches_found: matches.length,
              alerts_created: alertsCreated,
              summary,
            })
            .eq("id", runId)
        : Promise.resolve(),
      supabase
        .from("workflows")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", workflow.id),
    ]);

    return {
      status: "success",
      matches: matches.length,
      alertsCreated,
      summary,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    if (runId) {
      await supabase
        .from("workflow_runs")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          error_message: message,
        })
        .eq("id", runId);
    }

    // `last_run_at` is intentionally NOT stamped on failure, so the scheduler
    // retries on its next tick instead of waiting out a full cadence.
    return { status: "error", matches: 0, alertsCreated: 0, summary: message };
  }
}
