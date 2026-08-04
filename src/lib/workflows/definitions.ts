// Workflow rule definitions — shared by the server evaluators and the client
// form. Deliberately free of server-only imports so the form can render the
// parameter fields for a chosen rule.

export type RuleType =
  | "missing_lesson_plans"
  | "pacing_behind"
  | "assessment_below_threshold"
  | "intervention_followup_due"
  | "mobymax_low_engagement"
  | "language_migration_checkpoint"
  | "calendar_coverage_low"
  | "ai_daily_digest";

export type RuleParam = {
  key: string;
  label: string;
  type: "number" | "text";
  default: string | number;
  help?: string;
};

export type RuleDefinition = {
  type: RuleType;
  label: string;
  description: string;
  params: RuleParam[];
};

export const RULES: RuleDefinition[] = [
  {
    type: "missing_lesson_plans",
    label: "Missing lesson plans",
    description:
      "Flags classes with no daily lesson plan for the upcoming school days.",
    params: [
      {
        key: "days_ahead",
        label: "Days ahead",
        type: "number",
        default: 3,
        help: "How far forward to look for gaps.",
      },
    ],
  },
  {
    type: "pacing_behind",
    label: "Pacing behind schedule",
    description:
      "Flags curriculum modules past their planned completion date with no actual completion.",
    params: [
      {
        key: "grace_days",
        label: "Grace days",
        type: "number",
        default: 0,
        help: "Days past the planned date before flagging.",
      },
    ],
  },
  {
    type: "assessment_below_threshold",
    label: "Assessment below threshold",
    description:
      "Flags students whose recent SBG level falls below the mastery threshold.",
    params: [
      {
        key: "threshold",
        label: "SBG threshold",
        type: "number",
        default: 2,
        help: "Flag results at or below this level (1–4).",
      },
    ],
  },
  {
    type: "intervention_followup_due",
    label: "Intervention follow-up due",
    description: "Flags open interventions whose follow-up date has arrived.",
    params: [
      {
        key: "days_ahead",
        label: "Days ahead",
        type: "number",
        default: 0,
        help: "Include follow-ups due within this many days.",
      },
    ],
  },
  {
    type: "mobymax_low_engagement",
    label: "MobyMax low engagement",
    description: "Flags students below a minutes-per-session engagement floor.",
    params: [
      {
        key: "min_minutes",
        label: "Minimum minutes",
        type: "number",
        default: 15,
      },
      {
        key: "lookback_days",
        label: "Lookback days",
        type: "number",
        default: 7,
      },
    ],
  },
  {
    type: "language_migration_checkpoint",
    label: "Language migration checkpoint",
    description:
      "Flags 2027 language-platform candidates still pending evaluation.",
    params: [],
  },
  {
    type: "calendar_coverage_low",
    label: "Academic calendar running out",
    description:
      "Warns before the calendar's last recorded day arrives. Planning rules depend on it, and once it lapses they cannot tell 'all planned' from 'no data'.",
    params: [
      {
        key: "min_days_ahead",
        label: "Warn when fewer than N days remain",
        type: "number",
        default: 14,
        help: "Give whoever maintains the calendar time to extend it.",
      },
    ],
  },
  {
    type: "ai_daily_digest",
    label: "AI daily digest",
    description:
      "Summarises the day across planning, pacing, and assessment, and raises one digest alert.",
    params: [],
  },
];

export function getRule(type: string): RuleDefinition | undefined {
  return RULES.find((r) => r.type === type);
}
