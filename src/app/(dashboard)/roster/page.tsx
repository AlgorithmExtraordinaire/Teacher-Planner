import { createClient } from "@/lib/supabase/server";
import { DataTable, PageHeader } from "@/components/ui";

export default async function RosterPage() {
  const supabase = await createClient();

  const [{ data: classes }, { data: students }] = await Promise.all([
    supabase
      .from("classes")
      .select("name, subject, grade_level, term, teachers(full_name)")
      .order("name"),
    supabase
      .from("students")
      .select("full_name, student_number, grade_level, status")
      .order("full_name"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeader
          title="Class Roster"
          description="Classes currently on record, with their assigned teacher."
        />
        <DataTable
          columns={["Class", "Subject", "Grade", "Term", "Teacher"]}
          rows={(classes ?? []).map((c) => [
            c.name,
            c.subject,
            c.grade_level,
            c.term,
            c.teachers?.full_name ?? null,
          ])}
        />
      </div>

      <div>
        <PageHeader
          title="Students"
          description="School-wide student directory."
        />
        <DataTable
          columns={["Name", "Student #", "Grade", "Status"]}
          rows={(students ?? []).map((s) => [
            s.full_name,
            s.student_number,
            s.grade_level,
            s.status,
          ])}
        />
      </div>
    </div>
  );
}
