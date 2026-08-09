"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";

export type LessonPlanState = { error?: string } | undefined;

const TIERS = ["annual", "term", "monthly", "weekly", "daily"] as const;

export type StandardOption = {
  id: string;
  code: string;
  description: string | null;
  domain: string | null;
  suggested: boolean;
};

/**
 * Candidate standards for a module, for the picker in the form.
 *
 * Server Functions are reachable by direct POST, not only through our own UI,
 * so this authenticates on every call exactly like a route handler would.
 * Standards are not secret, but an unauthenticated data endpoint is still an
 * endpoint nobody signed up for.
 *
 * `suggestedDomains` are keyword guesses from the module title. They mark
 * rows as suggested; they never filter anything out. A teacher planning a
 * cross-domain lesson must still be able to reach every standard in the
 * grade, so a wrong guess costs a scroll rather than a missing option.
 */
export async function standardsForModule(
  subject: string | null,
  gradeLevel: string | null,
  suggestedDomains: string[],
): Promise<StandardOption[]> {
  await requireUser();

  if (!gradeLevel) return [];

  const supabase = await createClient();

  // Framework follows the subject; a maths module must not offer ELA codes.
  const frameworks =
    subject === "Mathematics"
      ? ["CCSS-M"]
      : subject === "English Language Arts"
        ? ["CCSS-ELA"]
        : subject === "Science"
          ? ["Utah SEEd"]
          : [];

  let query = supabase
    .from("curriculum_standards")
    .select("id, code, description, domain")
    .eq("grade_level", gradeLevel)
    .order("code");

  if (frameworks.length > 0) query = query.in("framework", frameworks);

  const { data, error } = await query.limit(400);
  if (error || !data) return [];

  const hinted = new Set(suggestedDomains);

  return data
    .map((s) => ({ ...s, suggested: s.domain ? hinted.has(s.domain) : false }))
    // Suggested first, then by code, so the likely picks are reachable
    // without scrolling but nothing is hidden.
    .sort((a, b) =>
      a.suggested === b.suggested
        ? a.code.localeCompare(b.code, undefined, { numeric: true })
        : a.suggested
          ? -1
          : 1,
    );
}

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
  const moduleId = String(formData.get("curriculum_module_id") ?? "") || null;
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
  // getAll, not get: the picker submits one `standards` entry per ticked
  // checkbox, while the free-text escape hatch submits one comma-separated
  // entry. Reading only the first value would silently drop every standard
  // after the first — a plan that looks aligned and is not.
  const codes = [
    ...new Set(
      formData
        .getAll("standards")
        .flatMap((v) => String(v).split(","))
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ];

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
      // Written for the first time here. The column has existed since the
      // initial schema and nothing ever populated it, so every plan was
      // untraceable to the curriculum it came from and pacing coverage could
      // not be computed at all.
      curriculum_module_id: moduleId,
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
