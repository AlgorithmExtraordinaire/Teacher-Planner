import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { Card, DataTable, PageHeader, StatTile } from "@/components/ui";

export default async function CommandCenterPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: classCount },
    { count: studentCount },
    { count: lessonPlanCount },
    { data: todaysLessons },
    { data: alerts },
  ] = await Promise.all([
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase
      .from("lesson_plans")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("lesson_plans")
      .select("title, tier, status, classes(name)")
      .eq("lesson_date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("system_alerts")
      .select("message, severity, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.full_name.split(" ")[0]}`}
        description={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Classes" value={classCount ?? 0} />
        <StatTile label="Students" value={studentCount ?? 0} />
        <StatTile label="Lesson plans" value={lessonPlanCount ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Today&apos;s lessons
          </h2>
          <DataTable
            columns={["Title", "Class", "Tier", "Status"]}
            rows={(todaysLessons ?? []).map((l) => [
              l.title,
              l.classes?.name ?? null,
              l.tier,
              l.status,
            ])}
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Alerts
          </h2>
          {alerts && alerts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {alerts.map((a, i) => (
                <Card key={i} className="p-3">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    {a.severity}
                  </p>
                  <p className="text-sm text-slate-700">{a.message}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-sm text-slate-500">No open alerts.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
