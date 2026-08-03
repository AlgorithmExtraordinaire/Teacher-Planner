import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DataTable, PageHeader } from "@/components/ui";

export default async function LessonPlansPage() {
  const supabase = await createClient();

  const { data: lessonPlans } = await supabase
    .from("lesson_plans")
    .select("title, tier, lesson_date, status, classes(name), teachers(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title="Lesson Plan Repository"
          description="Most recently updated lesson plans across all tiers."
        />
        <Link
          href="/lesson-plans/new"
          className="h-fit rounded-md bg-crimson px-4 py-2 text-sm font-medium text-white hover:bg-crimson-hover"
        >
          + Generate lesson plan
        </Link>
      </div>

      <DataTable
        columns={["Title", "Class", "Teacher", "Tier", "Date", "Status"]}
        rows={(lessonPlans ?? []).map((l) => [
          l.title,
          l.classes?.name ?? null,
          l.teachers?.full_name ?? null,
          l.tier,
          l.lesson_date,
          l.status,
        ])}
      />
    </div>
  );
}
