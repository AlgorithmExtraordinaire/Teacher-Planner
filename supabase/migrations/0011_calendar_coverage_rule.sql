-- Allow the `calendar_coverage_low` workflow rule.
--
-- The rule warns before academic_calendar's last recorded day arrives.
-- Without it the only signal is missing_lesson_plans failing *after* the
-- calendar has already lapsed — a warning that arrives once the damage is
-- done. This turns a silent dependency into a scheduled early warning.

alter table public.workflows drop constraint if exists workflows_rule_type_check;

alter table public.workflows add constraint workflows_rule_type_check
  check (rule_type in (
    'missing_lesson_plans',
    'pacing_behind',
    'assessment_below_threshold',
    'intervention_followup_due',
    'mobymax_low_engagement',
    'language_migration_checkpoint',
    'calendar_coverage_low',
    'ai_daily_digest'
  ));
