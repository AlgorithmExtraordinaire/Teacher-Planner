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

  const { error } = await supabase.from("lesson_plans").insert({
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
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/lesson-plans");
}
