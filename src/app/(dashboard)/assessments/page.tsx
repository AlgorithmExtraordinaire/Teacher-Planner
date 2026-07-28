import { createClient } from "@/lib/supabase/server";
import { DataTable, PageHeader } from "@/components/ui";

export default async function AssessmentsPage() {
  const supabase = await createClient();

  const { data: assessments } = await supabase
    .from("assessments")
    .select(
      "title, type, date, sbg_level_max, classes(name), assessment_results(sbg_level)",
    )
    .order("date", { ascending: false })
    .limit(50);

  const rows = (assessments ?? []).map((a) => {
    const results = a.assessment_results ?? [];
    const levels = results
      .map((r) => r.sbg_level)
      .filter((v): v is number => v != null);
    const avg =
      levels.length > 0
        ? (levels.reduce((sum, v) => sum + v, 0) / levels.length).toFixed(1)
        : null;

    return [
      a.title,
      a.type,
      a.classes?.name ?? null,
      a.date,
      avg ? `${avg} / ${a.sbg_level_max}` : "No results yet",
    ];
  });

  return (
    <div>
      <PageHeader
        title="Assessment Tracker"
        description="Standards-Based Grading (1–4) performance by assessment."
      />
      <DataTable
        columns={["Title", "Type", "Class", "Date", "Avg SBG level"]}
        rows={rows}
      />
    </div>
  );
}
