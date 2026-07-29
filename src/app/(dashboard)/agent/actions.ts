"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireUser } from "@/lib/dal";

export async function startConversation(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const specialist = String(formData.get("specialist") ?? "general");

  const { data } = await supabase
    .from("agent_conversations")
    .insert({ profile_id: user.id, specialist })
    .select("id")
    .single();

  if (!data) redirect("/agent");
  redirect(`/agent/${data.id}`);
}

/**
 * Apply a proposal the agent queued. Admin/grade-lead only — this is the
 * point where model-suggested data actually enters the school's records.
 */
export async function reviewAction(formData: FormData) {
  const reviewer = await requireRole("admin", "grade_lead");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  const { data: proposal } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal || proposal.status !== "pending") return;

  if (decision === "reject") {
    await supabase
      .from("agent_actions")
      .update({
        status: "rejected",
        reviewed_by: reviewer.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidatePath("/agent/proposals");
    return;
  }

  const TARGET = {
    create_lesson_plan: "lesson_plans",
    create_intervention: "interventions",
    create_assessment: "assessments",
    update_pacing: "pacing_monitor",
  } as const;

  const table = TARGET[proposal.action_type as keyof typeof TARGET];

  if (!table) {
    await supabase
      .from("agent_actions")
      .update({
        status: "failed",
        error_message: `Unknown action type: ${proposal.action_type}`,
        reviewed_by: reviewer.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    revalidatePath("/agent/proposals");
    return;
  }

  // The payload is model-authored JSON, so its shape is only known at runtime;
  // Postgres constraints and RLS are what actually validate it on insert.
  const { data: inserted, error } = await supabase
    .from(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(proposal.payload as any)
    .select("id")
    .single();

  await supabase
    .from("agent_actions")
    .update({
      status: error ? "failed" : "applied",
      error_message: error?.message ?? null,
      result_id: inserted?.id ?? null,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/agent/proposals");
  revalidatePath("/");
}
