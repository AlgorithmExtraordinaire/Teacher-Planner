import { createClient } from "@/lib/supabase/server";
import { DataTable, PageHeader, StatTile } from "@/components/ui";

const DAY_TYPE_LABEL: Record<string, string> = {
  school_day: "School day",
  holiday: "Holiday",
  weekend: "Weekend",
  pd_day: "PD day",
  term_break: "Term break",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ count: schoolDays }, { count: holidays }, { data: upcoming }] =
    await Promise.all([
      supabase
        .from("academic_calendar")
        .select("*", { count: "exact", head: true })
        .eq("day_type", "school_day"),
      supabase
        .from("academic_calendar")
        .select("*", { count: "exact", head: true })
        .eq("day_type", "holiday"),
      supabase
        .from("academic_calendar")
        .select("date, day_type, term, label")
        .gte("date", today)
        .order("date")
        .limit(20),
    ]);

  return (
    <div>
      <PageHeader
        title="Academic Calendar"
        description="2026 school year — school days, holidays, and term breaks."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile label="School days" value={schoolDays ?? 0} />
        <StatTile label="Holidays" value={holidays ?? 0} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Upcoming dates
      </h2>
      <DataTable
        columns={["Date", "Type", "Term", "Label"]}
        rows={(upcoming ?? []).map((d) => [
          d.date,
          DAY_TYPE_LABEL[d.day_type] ?? d.day_type,
          d.term,
          d.label,
        ])}
      />
    </div>
  );
}
