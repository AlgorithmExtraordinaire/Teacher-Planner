import { createClient } from "@/lib/supabase/server";
import { DataTable, PageHeader } from "@/components/ui";

export default async function StandardsPage() {
  const supabase = await createClient();

  const [{ data: standards }, { data: modules }] = await Promise.all([
    supabase
      .from("curriculum_standards")
      .select("code, framework, subject, grade_band, description")
      .order("code"),
    supabase
      .from("curriculum_modules")
      .select("title, subject, grade_band, source, term, sequence_order")
      .order("sequence_order"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeader
          title="Curriculum Standards"
          description="CCSS / NGSS / NCSS / CASEL standards library."
        />
        <DataTable
          columns={["Code", "Framework", "Subject", "Grade band", "Description"]}
          rows={(standards ?? []).map((s) => [
            s.code,
            s.framework,
            s.subject,
            s.grade_band,
            s.description,
          ])}
        />
      </div>

      <div>
        <PageHeader
          title="Curriculum Modules"
          description="Eureka, EL Education, Spectrum, and MobyMax-sourced modules."
        />
        <DataTable
          columns={["Title", "Subject", "Grade band", "Source", "Term"]}
          rows={(modules ?? []).map((m) => [
            m.title,
            m.subject,
            m.grade_band,
            m.source,
            m.term,
          ])}
        />
      </div>
    </div>
  );
}
