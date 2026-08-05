"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";

export type LessonPlanState = { error?: string } | undefined;

const TIERS = ["annual", "term", "monthly", "weekly", "daily"] as const;

export async function createLessonPlan(
  _prevState: LessonPlanState,
  formData: FormData,
): Promise<LessonPlanState> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!teacher) {
    return {
      error:
        "No teacher record is linked to your account yet. Ask an admin to link one.",
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const tier = String(formData.get("tier") ?? "");
  const classId = String(formData.get("class_id") ?? "") || null;
  const lessonDate = String(formData.get("lesson_date") ?? "") || null;
  const objective = String(formData.get("objective") ?? "");

  if (!title) return { error: "Title is required." };
  if (!TIERS.includes(tier as (typeof TIERS)[number])) {
    return { error: "Choose a valid planning tier." };
  }

  // Standards are resolved to real library rows BEFORE the plan is written.
  // The old text[] accepted any string, so a typo looked identical to a valid
  // citation and quietly broke coverage reporting. An unrecognised code now
  // fails the save with the offending code named.
  const codes = String(formData.get("standards") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  let standardIds: string[] = [];

  if (codes.length > 0) {
    const { data: matched, error: lookupError } = await supabase
      .from("curriculum_standards")
      .select("id, code")
      .in("code", codes);

    if (lookupError) return { error: lookupError.message };

    const found = new Set((matched ?? []).map((m) => m.code));
    const unknown = codes.filter((c) => !found.has(c));

    if (unknown.length > 0) {
      return {
        error: `Not in the standards library: ${unknown.join(", ")}. Check the code on the Curriculum Standards page.`,
      };
    }

    standardIds = (matched ?? []).map((m) => m.id);
  }

  const { data: plan, error } = await supabase
    .from("lesson_plans")
    .insert({
      teacher_id: teacher.id,
      class_id: classId,
      title,
      tier,
      lesson_date: lessonDate,
      objective,
      warm_up: String(formData.get("warm_up") ?? ""),
      direct_instruction: String(formData.get("direct_instruction") ?? ""),
      guided_practice: String(formData.get("guided_practice") ?? ""),
      independent_practice: String(
        formData.get("independent_practice") ?? "",
      ),
      assessment_strategy: String(formData.get("assessment_strategy") ?? ""),
      differentiation: String(formData.get("differentiation") ?? ""),
      materials: String(formData.get("materials") ?? ""),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (standardIds.length > 0 && plan) {
    const { error: linkError } = await supabase
      .from("lesson_plan_standards")
      .insert(
        standardIds.map((standard_id) => ({
          lesson_plan_id: plan.id,
          standard_id,
        })),
      );

    // The plan exists; report the linking failure rather than pretending the
    // standards were recorded.
    if (linkError) {
      return {
        error: `Lesson plan saved, but its standards could not be linked: ${linkError.message}`,
      };
    }
  }

  redirect("/lesson-plans");
}
