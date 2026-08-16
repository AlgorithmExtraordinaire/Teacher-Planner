import { requireUser, isStaffAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, Notice } from "@/components/ui";
import { Badge } from "@/components/cell";
import { PositionForm, type ModuleOption } from "./position-form";

/**
 * Where each class currently is in its curriculum.
 *
 * A teacher records their own; a grade lead or admin sees every class in one
 * list. This is the thing pacing rules have been querying since the beginning
 * and never finding — `pacing_behind` has been evaluating an empty table and
 * reporting "all clear" for months, which is the worst answer a monitoring
 * rule can give.
 */
export default async function CurriculumPositionPage() {
  const user = await requireUser();
  const staff = isStaffAdmin(user);
  const supabase = await createClient();

  const { data: teacherRow } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const classQuery = supabase
    .from("classes")
    .select("id, name, subject, grade_level, teachers(full_name)")
    .order("name");
  if (!staff && teacherRow) classQuery.eq("teacher_id", teacherRow.id);

  const [{ data: classes }, { data: modules }, { data: positions }] =
    await Promise.all([
      classQuery,
      supabase
        .from("curriculum_modules")
        .select("id, title, subject, grade_level, sequence_order")
        .order("sequence_order"),
      supabase
        .from("pacing_monitor")
        .select(
          "id, class_id, curriculum_module_id, status, notes, planned_completion_date, actual_completion_date, curriculum_modules(title)",
        ),
    ]);

  const classList = classes ?? [];
  const moduleList = modules ?? [];
  const positionList = positions ?? [];

  if (classList.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Curriculum Position" description="Where each class has reached." />
        <EmptyState
          message={
            teacherRow
              ? "No classes are assigned to you."
              : "Your account is not linked to a teacher record, so no classes resolve."
          }
        />
      </div>
    );
  }

  // Modules are matched on subject and grade the same way the lesson plan
  // generator matches them, so a class offers the same list in both places.
  const modulesFor = (subject: string | null, grade: string | null): ModuleOption[] =>
    moduleList
      .filter((m) => m.subject === subject && m.grade_level === grade)
      .map((m) => ({
        id: m.id,
        title: m.title,
        sequence_order: m.sequence_order,
      }));

  const positionsFor = (classId: string) =>
    positionList.filter((p) => p.class_id === classId);

  const recorded = new Set(positionList.map((p) => p.class_id)).size;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Curriculum Position"
        description={
          staff
            ? `Every class, and where its teacher says it has reached. ${recorded} of ${classList.length} classes have recorded a position.`
            : "Tell the school where you have reached. Your grade lead and admin see this; it is how pacing support gets offered before a term runs out."
        }
      />

      {recorded === 0 && (
        <Notice tone="warning">
          No class has recorded a position yet. Until they do, the{" "}
          <code className="font-mono text-xs">pacing_behind</code> workflow rule
          queries an empty table and reports that everything is fine — which is
          not the same thing as everything being fine.
        </Notice>
      )}

      <div className="flex flex-col gap-6">
        {classList.map((c) => {
          const options = modulesFor(c.subject, c.grade_level);
          const existing = positionsFor(c.id);
          const latest = existing[existing.length - 1] ?? null;
          const teacherName = Array.isArray(c.teachers)
            ? c.teachers[0]?.full_name
            : c.teachers?.full_name;

          return (
            <Card key={c.id}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">{c.name}</h2>
                <span className="text-xs text-body">
                  {staff && teacherName ? `${teacherName} · ` : ""}
                  {existing.length} module
                  {existing.length === 1 ? "" : "s"} tracked
                </span>
              </div>

              {existing.length > 0 && (
                <ul className="mb-4 flex flex-col gap-1 border-l-2 border-line pl-3">
                  {existing.map((p) => {
                    const mod = Array.isArray(p.curriculum_modules)
                      ? p.curriculum_modules[0]
                      : p.curriculum_modules;
                    return (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center gap-2 text-xs text-body"
                      >
                        <Badge value={p.status} />
                        <span className="text-ink">{mod?.title ?? "—"}</span>
                        {p.planned_completion_date && (
                          <span>· due {p.planned_completion_date}</span>
                        )}
                        {p.actual_completion_date && (
                          <span>· finished {p.actual_completion_date}</span>
                        )}
                        {p.notes && <span>· {p.notes}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}

              {options.length === 0 ? (
                <p className="text-xs text-body">
                  No curriculum modules are loaded for {c.grade_level}{" "}
                  {c.subject}, so there is nothing to place this class against
                  yet.
                </p>
              ) : (
                <PositionForm
                  classId={c.id}
                  modules={options}
                  currentModuleId={latest?.curriculum_module_id ?? null}
                  currentStatus={latest?.status ?? null}
                  currentNotes={latest?.notes ?? null}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
