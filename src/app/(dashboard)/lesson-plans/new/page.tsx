import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { LessonPlanForm } from "@/app/(dashboard)/lesson-plans/new/lesson-plan-form";

export default async function NewLessonPlanPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");

  return (
    <div>
      <PageHeader
        title="Lesson Plan Generator"
        description="Fill in the details below to create a new lesson plan."
      />
      <LessonPlanForm classes={classes ?? []} />
    </div>
  );
}
