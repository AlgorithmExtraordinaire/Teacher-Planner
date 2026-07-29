import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RuleType } from "@/lib/workflows/definitions";

// Built-in workflow evaluators.
//
// Each rule is a hand-written query with typed parameters. The agent may
// choose a rule and fill in its params, but it never authors the query — so
// nothing model-generated executes unattended against school data.
//
// Rule *definitions* live in ./definitions.ts so the client form can read them.

export type RuleMatch = {
  summary: string;
  /** Optional teacher to address the alert to. */
  teacherId?: string | null;
};

export type RuleResult = {
  matches: RuleMatch[];
  note: string;
};

/**
 * PostgREST returns a single row for a many-to-one embed, but the generated
 * types widen it to an array. Normalise so join access reads naturally.
 */
function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

function num(params: Record<string, unknown>, key: string, fallback: number) {
  const v = Number(params?.[key]);
  return Number.isFinite(v) ? v : fallback;
}

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Evaluate a rule. Read-only: returns what it found, and the caller decides
 * whether to raise alerts.
 */
export async function evaluateRule(
  supabase: SupabaseClient,
  ruleType: RuleType,
  params: Record<string, unknown>,
): Promise<RuleResult> {
  const today = new Date().toISOString().slice(0, 10);

  switch (ruleType) {
    case "missing_lesson_plans": {
      const daysAhead = num(params, "days_ahead", 3);
      const until = isoDaysFromNow(daysAhead);

      const [{ data: classes }, { data: plans }, { data: schoolDays }] =
        await Promise.all([
          supabase.from("classes").select("id, name, teacher_id"),
          supabase
            .from("lesson_plans")
            .select("class_id, lesson_date")
            .eq("tier", "daily")
            .gte("lesson_date", today)
            .lte("lesson_date", until),
          supabase
            .from("academic_calendar")
            .select("date")
            .eq("day_type", "school_day")
            .gte("date", today)
            .lte("date", until),
        ]);

      const schoolDayCount = (schoolDays ?? []).length;
      if (schoolDayCount === 0) {
        return { matches: [], note: "No school days in the window." };
      }

      const planned = new Set(
        (plans ?? []).map((p) => `${p.class_id}|${p.lesson_date}`),
      );

      const matches: RuleMatch[] = [];
      for (const c of classes ?? []) {
        const missing = (schoolDays ?? []).filter(
          (d) => !planned.has(`${c.id}|${d.date}`),
        ).length;
        if (missing > 0) {
          matches.push({
            summary: `${c.name} has no daily plan for ${missing} of the next ${schoolDayCount} school day(s).`,
            teacherId: c.teacher_id,
          });
        }
      }
      return {
        matches,
        note: `Checked ${(classes ?? []).length} class(es) across ${schoolDayCount} school day(s).`,
      };
    }

    case "pacing_behind": {
      const grace = num(params, "grace_days", 0);
      const cutoff = isoDaysFromNow(-grace);

      const { data } = await supabase
        .from("pacing_monitor")
        .select(
          "planned_completion_date, status, classes(name, teacher_id), curriculum_modules(title)",
        )
        .is("actual_completion_date", null)
        .lt("planned_completion_date", cutoff)
        .neq("status", "complete");

      const matches = (data ?? []).map((row) => {
        const cls = one(row.classes);
        const module = one(row.curriculum_modules);
        return {
          summary: `${cls?.name ?? "A class"} is behind on "${
            module?.title ?? "a module"
          }" (planned ${row.planned_completion_date}).`,
          teacherId: cls?.teacher_id ?? null,
        };
      });
      return { matches, note: `Grace period: ${grace} day(s).` };
    }

    case "assessment_below_threshold": {
      const threshold = num(params, "threshold", 2);

      const { data } = await supabase
        .from("assessment_results")
        .select(
          "sbg_level, students(full_name), assessments(title, classes(name, teacher_id))",
        )
        .not("sbg_level", "is", null)
        .lte("sbg_level", threshold);

      const matches = (data ?? []).map((row) => {
        const student = one(row.students);
        const assessment = one(row.assessments);
        return {
          summary: `${student?.full_name ?? "A student"} scored SBG ${
            row.sbg_level
          } on "${assessment?.title ?? "an assessment"}".`,
          teacherId: one(assessment?.classes)?.teacher_id ?? null,
        };
      });
      return { matches, note: `Threshold: SBG ≤ ${threshold}.` };
    }

    case "intervention_followup_due": {
      const daysAhead = num(params, "days_ahead", 0);
      const until = isoDaysFromNow(daysAhead);

      const { data } = await supabase
        .from("interventions")
        .select("description, follow_up_date, teacher_id, students(full_name)")
        .neq("status", "resolved")
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", until);

      const matches = (data ?? []).map((row) => ({
        summary: `Follow-up due ${row.follow_up_date} for ${
          one(row.students)?.full_name ?? "a student"
        }: ${row.description}`,
        teacherId: row.teacher_id,
      }));
      return { matches, note: `Window: through ${until}.` };
    }

    case "mobymax_low_engagement": {
      const minMinutes = num(params, "min_minutes", 15);
      const lookback = num(params, "lookback_days", 7);
      const since = isoDaysFromNow(-lookback);

      const { data } = await supabase
        .from("mobymax_log")
        .select("minutes_spent, session_date, subject, students(full_name)")
        .gte("session_date", since)
        .lt("minutes_spent", minMinutes);

      const matches = (data ?? []).map((row) => ({
        summary: `${one(row.students)?.full_name ?? "A student"} spent ${
          row.minutes_spent
        } min on ${row.subject ?? "MobyMax"} (${row.session_date}).`,
        teacherId: null,
      }));
      return {
        matches,
        note: `Under ${minMinutes} min, last ${lookback} day(s).`,
      };
    }

    case "language_migration_checkpoint": {
      const { data } = await supabase
        .from("language_platform_migration")
        .select("platform_name, evaluation_status, target_term")
        .in("evaluation_status", ["pending", "in_review"]);

      const matches = (data ?? []).map((row) => ({
        summary: `${row.platform_name} is still ${row.evaluation_status.replace(
          /_/g,
          " ",
        )} for ${row.target_term}.`,
        teacherId: null,
      }));
      return { matches, note: "Candidates not yet decided." };
    }

    case "ai_daily_digest": {
      // The digest is assembled by the agent runner, which has model access.
      // Evaluated here only to surface the counts it will summarise.
      const [{ count: plans }, { count: behind }, { count: lowScores }] =
        await Promise.all([
          supabase
            .from("lesson_plans")
            .select("*", { count: "exact", head: true })
            .eq("lesson_date", today),
          supabase
            .from("pacing_monitor")
            .select("*", { count: "exact", head: true })
            .eq("status", "behind"),
          supabase
            .from("assessment_results")
            .select("*", { count: "exact", head: true })
            .lte("sbg_level", 2),
        ]);

      return {
        matches: [
          {
            summary: `Today: ${plans ?? 0} lesson plan(s) scheduled, ${
              behind ?? 0
            } class(es) behind pace, ${lowScores ?? 0} assessment result(s) at or below SBG 2.`,
            teacherId: null,
          },
        ],
        note: "Daily digest snapshot.",
      };
    }

    default:
      return { matches: [], note: "Unknown rule type." };
  }
}
