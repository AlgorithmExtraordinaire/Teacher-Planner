"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireUser } from "@/lib/dal";
import { evaluateRule } from "@/lib/workflows/rules";
import { getRule, type RuleType } from "@/lib/workflows/definitions";

export type WorkflowState = { error?: string; ok?: string } | undefined;

export async function createWorkflow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  const user = await requireRole("admin", "grade_lead");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const ruleType = String(formData.get("rule_type") ?? "");
  const rule = getRule(ruleType);

  if (!name) return { error: "Name is required." };
  if (!rule) return { error: "Choose a valid rule." };

  // Only accept parameters the rule actually declares.
  const params: Record<string, number | string> = {};
  for (const p of rule.params) {
    const raw = formData.get(`param_${p.key}`);
    if (raw === null || raw === "") {
      params[p.key] = p.default;
      continue;
    }
    params[p.key] = p.type === "number" ? Number(raw) : String(raw);
  }

  const { error } = await supabase.from("workflows").insert({
    name,
    description: String(formData.get("description") ?? "") || null,
    rule_type: ruleType,
    params,
    cadence: String(formData.get("cadence") ?? "daily"),
    severity: String(formData.get("severity") ?? "info"),
    recipient_role: String(formData.get("recipient_role") ?? "") || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/workflows");
  return { ok: "Workflow created." };
}

export async function toggleWorkflow(formData: FormData) {
  await requireRole("admin", "grade_lead");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const enable = String(formData.get("enable") ?? "") === "true";

  await supabase.from("workflows").update({ is_enabled: enable }).eq("id", id);
  revalidatePath("/workflows");
}

/**
 * Run one workflow now. Records a run, raises alerts for each match, and
 * stamps `last_run_at`.
 */
export async function runWorkflow(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .single();

  if (!workflow) return;

  const { data: run } = await supabase
    .from("workflow_runs")
    .insert({ workflow_id: workflow.id, status: "running" })
    .select("id")
    .single();

  try {
    const { matches, note } = await evaluateRule(
      supabase,
      workflow.rule_type as RuleType,
      (workflow.params ?? {}) as Record<string, unknown>,
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
      if (!alertError) alertsCreated = matches.length;
    }

    await Promise.all([
      supabase
        .from("workflow_runs")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          matches_found: matches.length,
          alerts_created: alertsCreated,
          summary: `${matches.length} match(es). ${note}`,
        })
        .eq("id", run?.id ?? ""),
      supabase
        .from("workflows")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", workflow.id),
    ]);
  } catch (e) {
    await supabase
      .from("workflow_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error_message: e instanceof Error ? e.message : String(e),
      })
      .eq("id", run?.id ?? "");
  }

  revalidatePath("/workflows");
  revalidatePath("/");
}
