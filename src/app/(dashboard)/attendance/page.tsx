import { requireUser, isStaffAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, Notice, StatTile } from "@/components/ui";
import { RegisterForm, type Learner } from "./register-form";

/**
 * Terms open for marking, with the school day count from the printed academy
 * calendar beside each.
 *
 * Kept as a constant rather than derived, because "which terms are open" is a
 * school decision, not a fact about the data: when Term 1 2027 is loaded,
 * someone should have to decide to open it.
 *
 * `officialDays` is the printed figure, held here so the page can compare it to
 * what the database actually holds and flag only the terms that disagree. Term
 * 3 reconciled on 17 Aug 2026 when 27-28 August were confirmed as the Heroes
 * Day long weekend; Term 4 still carries one unidentified extra day.
 */
const OPEN_TERMS = [
  { term: "Term 3 2026", officialDays: 42 },
  { term: "Term 4 2026", officialDays: 39 },
];
const OPEN_TERM_NAMES = OPEN_TERMS.map((t) => t.term);

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>;
}) {
  const { class: classParam, date: dateParam } = await searchParams;
  const user = await requireUser();
  const staff = isStaffAdmin(user);
  const supabase = await createClient();

  // Which classes this person may mark. A teacher gets their own; an admin
  // gets all of them, because covering an absent colleague is the ordinary
  // case this has to support.
  const { data: teacherRow } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const classQuery = supabase
    .from("classes")
    .select("id, name, subject, grade_level, teacher_id")
    .order("name");
  if (!staff && teacherRow) classQuery.eq("teacher_id", teacherRow.id);

  const [{ data: classes }, { data: days }, { data: variance }] =
    await Promise.all([
      classQuery,
      supabase
        .from("academic_calendar")
        .select("date, term, label")
        .eq("day_type", "school_day")
        .in("term", OPEN_TERM_NAMES)
        .order("date"),
      supabase
        .from("system_settings")
        .select("key, value, description")
        .eq("key", "academic.calendar_variance")
        .maybeSingle(),
    ]);

  const classList = classes ?? [];
  const schoolDays = days ?? [];

  if (classList.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Attendance" description="Daily register." />
        <EmptyState
          message={
            teacherRow
              ? "No classes are assigned to you."
              : "Your account is not linked to a teacher record, so no classes resolve. An admin can fix this from Staff Accounts."
          }
        />
      </div>
    );
  }

  const selectedClass =
    classList.find((c) => c.id === classParam) ?? classList[0];

  // Default to today when today is a school day, otherwise the most recent one
  // that has passed — a teacher opening this on a Monday should land on
  // Monday, and on a Saturday should land on Friday rather than on February.
  const today = new Date().toISOString().slice(0, 10);
  const fallback =
    schoolDays.find((d) => d.date === today)?.date ??
    [...schoolDays].reverse().find((d) => d.date <= today)?.date ??
    schoolDays[0]?.date;
  const selectedDate =
    schoolDays.find((d) => d.date === dateParam)?.date ?? fallback;

  const canMark = staff || selectedClass.teacher_id === teacherRow?.id;

  const [
    { data: enrolment },
    { data: marks, error: marksError },
    { count: recordedDays },
  ] = await Promise.all([
      supabase
        .from("class_enrollment")
        .select("students(id, full_name, student_number, status)")
        .eq("class_id", selectedClass.id),
      selectedDate
        ? supabase
            .from("attendance")
            .select("student_id, status")
            .eq("class_id", selectedClass.id)
            .eq("date", selectedDate)
        : Promise.resolve({
            data: [] as { student_id: string; status: string }[],
            error: null,
          }),
      supabase
        .from("attendance")
        .select("date", { count: "exact", head: true })
        .eq("class_id", selectedClass.id),
    ]);

  // The register depends on migration 0020. Until it is applied the table does
  // not exist, and a grid that looks fine and silently refuses to save is
  // worse than being told why.
  //
  // Detected on the marks query, NOT on the count above: the count uses
  // head:true, so PostgREST returns no body, so there is no message to match
  // and a missing table reads as success. That is exactly how this page first
  // shipped a working-looking register for a table that did not exist.
  const tableMissing =
    Boolean(marksError) &&
    /does not exist|schema cache|PGRST205|42P01/i.test(
      `${marksError?.message} ${marksError?.code}`,
    );

  const markByStudent = new Map(
    (marks ?? []).map((m) => [m.student_id, m.status]),
  );

  const learners: Learner[] = (enrolment ?? [])
    .map((row) => {
      const s = Array.isArray(row.students) ? row.students[0] : row.students;
      return s ?? null;
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .filter((s) => s.status !== "inactive")
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((s) => ({
      id: s.id,
      full_name: s.full_name,
      student_number: s.student_number,
      status: markByStudent.get(s.id) ?? null,
    }));

  const byTerm = OPEN_TERMS.map((t) => ({
    term: t.term,
    days: schoolDays.filter((d) => d.term === t.term).length,
    officialDays: t.officialDays,
  }));
  // Only the terms that actually disagree. Flagging a term that reconciles
  // teaches teachers to ignore the warning.
  const mismatched = byTerm.filter((t) => t.days !== t.officialDays);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Attendance"
        description={`Daily register for ${OPEN_TERM_NAMES.join(" and ")}. Present, absent, late or excused.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {byTerm.map((t) => (
          <StatTile key={t.term} label={`${t.term} school days`} value={t.days} />
        ))}
        <StatTile
          label="Marks recorded for this class"
          value={recordedDays ?? 0}
        />
      </div>

      {mismatched.length > 0 && (
        <Notice tone="warning">
          {mismatched
            .map(
              (t) =>
                `${t.term} offers ${t.days} school days where the printed academy calendar has ${t.officialDays}`,
            )
            .join("; ")}
          . The extra day
          {mismatched.reduce((n, t) => n + (t.days - t.officialDays), 0) === 1
            ? " is"
            : "s are"}{" "}
          not identified, so they are offered here rather than dropped — marking
          them <code className="font-mono text-xs">term_break</code> in the
          academic calendar removes them from this list.
          {variance
            ? ` A variance of ${String(variance.value).replace(/"/g, "")} across 2026 is recorded in system settings.`
            : ""}
        </Notice>
      )}

      {/* Plain GET form: no JavaScript, and the chosen class and date live in
          the URL, so a teacher can bookmark their own register. */}
      <Card>
        <form method="GET" className="flex flex-wrap items-end gap-4">
          <div className="field">
            <label htmlFor="class" className="field__label">
              Class
            </label>
            <select
              id="class"
              name="class"
              defaultValue={selectedClass.id}
              className="input"
            >
              {classList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date" className="field__label">
              Date
            </label>
            <select
              id="date"
              name="date"
              defaultValue={selectedDate}
              className="input"
            >
              {schoolDays.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.date}
                  {d.date === today ? " — today" : ""}
                  {d.label ? ` · ${d.label}` : ""}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-outline">
            Open register
          </button>
        </form>
      </Card>

      {tableMissing ? (
        <Notice tone="danger">
          The attendance table has not been created in this database yet, so
          nothing can be marked. Apply{" "}
          <code className="font-mono text-xs">
            supabase/migrations/0020_daily_attendance.sql
          </code>{" "}
          and this page starts working immediately — no redeploy needed.
        </Notice>
      ) : schoolDays.length === 0 ? (
        <Notice tone="danger">
          No school days are loaded for {OPEN_TERM_NAMES.join(" or ")}, so there is
          nothing to mark. The academic calendar needs those terms before
          attendance can be taken.
        </Notice>
      ) : learners.length === 0 ? (
        <EmptyState message="No learners are enrolled in this class." />
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            {selectedClass.name} · {selectedDate}
          </h2>
          <RegisterForm
            key={`${selectedClass.id}-${selectedDate}`}
            classId={selectedClass.id}
            date={selectedDate}
            learners={learners}
            canMark={canMark}
          />
        </div>
      )}
    </div>
  );
}
