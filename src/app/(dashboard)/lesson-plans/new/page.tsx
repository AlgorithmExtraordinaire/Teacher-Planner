import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { LessonPlanForm } from "@/app/(dashboard)/lesson-plans/new/lesson-plan-form";

export default async function NewLessonPlanPage() {
  const supabase = await createClient();

  // Classes carry subject and grade, which is what filters the module list —
  // picking a class is what makes the rest of the form self-populating.
  //
  // All modules are shipped to the client at once. There are 71 of them, a
  // few kilobytes, so filtering happens instantly on selection rather than
  // costing a round trip per class change. Standards are the opposite case —
  // over 1,100 rows — and are fetched per module instead.
  const [{ data: classes }, { data: modules }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, subject, grade_level")
      .order("name"),
    supabase
      .from("curriculum_modules")
      .select(
        "id, title, subject, grade_level, sequence_order, planned_days, source, source_url",
      )
      .order("sequence_order"),
  ]);

  return (
    <div>
      <PageHeader
        title="Lesson Plan Generator"
        description="Choose a class and a curriculum module — the title, materials, lesson structure and standards populate from the curriculum, ready for you to edit."
      />
      <LessonPlanForm classes={classes ?? []} modules={modules ?? []} />
    </div>
  );
}
