"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaffAdmin, requireUser } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";
import { executeWorkflow, type WorkflowRow } from "@/lib/workflows/run";
import { getRule } from "@/lib/workflows/definitions";

export type WorkflowState = { error?: string; ok?: string } | undefined;

export async function createWorkflow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  const user = await requireStaffAdmin();
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
  const user = await requireStaffAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const enable = String(formData.get("enable") ?? "") === "true";

  await supabase.from("workflows").update({ is_enabled: enable }).eq("id", id);

  // Enabling a workflow lets it write alerts unattended, so it is a
  // governance event, not just a UI toggle.
  await recordAudit(supabase, {
    actorId: user.id,
    action: enable ? "workflow.enabled" : "workflow.disabled",
    entity: "workflows",
    entityId: id,
  });

  revalidatePath("/workflows");
}

/**
 * Run one workflow now, on the caller's own client so RLS still applies.
 *
 * Shares `executeWorkflow` with the scheduled runner in
 * `/api/cron/workflows`, so a manual run and an automatic one behave
 * identically and land in the same audit trail.
 */
export async function runWorkflow(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { data: workflow } = await supabase
    .from("workflows")
    .select(
      "id, name, rule_type, params, severity, recipient_role, cadence, is_enabled, last_run_at",
    )
    .eq("id", id)
    .single();

  if (!workflow) return;

  await executeWorkflow(supabase, workflow as unknown as WorkflowRow, "manual");

  revalidatePath("/workflows");
  revalidatePath("/");
}
