// Data-driven registry for the Tables browser.
//
// One entry per Postgres table. The browser reads this to build list views,
// so adding a table to the UI is a config change, not a new page.

import type { Database } from "@/lib/supabase/types";

/** Every table the schema actually has — a typo here is a compile error. */
export type TableName = keyof Database["public"]["Tables"];

export type ColumnKind = "text" | "date" | "number" | "badge" | "bool";

export type ColumnSpec = {
  key: string;
  label: string;
  kind?: ColumnKind;
};

export type TableSpec = {
  /** URL slug and Postgres table name — kept identical on purpose. */
  name: TableName;
  label: string;
  group: string;
  description: string;
  /** Column shown in list views. `select` is derived from these. */
  columns: ColumnSpec[];
  orderBy: { column: string; ascending: boolean };
};

export const TABLE_GROUPS = [
  "Identity",
  "Roster",
  "Curriculum",
  "Planning",
  "Assessment",
  "Monitoring",
  "Integrations",
  "Resources",
  "Automation",
  "Platform",
] as const;

export const TABLES: TableSpec[] = [
  // ---------------------------------------------------------------- Identity
  {
    name: "profiles",
    label: "Profiles",
    group: "Identity",
    description: "Staff accounts and their role in the system.",
    columns: [
      { key: "full_name", label: "Name" },
      { key: "role", label: "Role", kind: "badge" },
      { key: "grade_band", label: "Grade band" },
      { key: "created_at", label: "Created", kind: "date" },
    ],
    orderBy: { column: "full_name", ascending: true },
  },
  {
    name: "teachers",
    label: "Teachers",
    group: "Identity",
    description: "Teaching staff directory.",
    columns: [
      { key: "full_name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subject", label: "Subject" },
      { key: "grade_band", label: "Grade band" },
      { key: "status", label: "Status", kind: "badge" },
    ],
    orderBy: { column: "full_name", ascending: true },
  },
  {
    name: "students",
    label: "Students",
    group: "Identity",
    description: "Student directory across all grade bands.",
    columns: [
      { key: "full_name", label: "Name" },
      { key: "student_number", label: "Student #" },
      { key: "grade_level", label: "Grade" },
      { key: "grade_band", label: "Band" },
      { key: "status", label: "Status", kind: "badge" },
    ],
    orderBy: { column: "full_name", ascending: true },
  },

  // ------------------------------------------------------------------ Roster
  {
    name: "classes",
    label: "Classes",
    group: "Roster",
    description: "Class sections and their assigned teacher.",
    columns: [
      { key: "name", label: "Class" },
      { key: "subject", label: "Subject" },
      { key: "grade_level", label: "Grade" },
      { key: "term", label: "Term" },
    ],
    orderBy: { column: "name", ascending: true },
  },
  {
    name: "class_enrollment",
    label: "Class Enrollment",
    group: "Roster",
    description: "Which students are enrolled in which classes.",
    columns: [{ key: "enrolled_at", label: "Enrolled", kind: "date" }],
    orderBy: { column: "enrolled_at", ascending: false },
  },

  // -------------------------------------------------------------- Curriculum
  {
    name: "curriculum_standards",
    label: "Curriculum Standards",
    group: "Curriculum",
    description: "CCSS / NGSS / NCSS / CASEL standards library.",
    columns: [
      { key: "code", label: "Code" },
      { key: "framework", label: "Framework", kind: "badge" },
      { key: "subject", label: "Subject" },
      { key: "grade_band", label: "Grade band" },
      { key: "description", label: "Description" },
    ],
    orderBy: { column: "code", ascending: true },
  },
  {
    name: "curriculum_modules",
    label: "Curriculum Modules",
    group: "Curriculum",
    description: "Eureka, EL Education, Spectrum, and MobyMax modules.",
    columns: [
      { key: "title", label: "Title" },
      { key: "subject", label: "Subject" },
      { key: "grade_band", label: "Grade band" },
      { key: "source", label: "Source", kind: "badge" },
      { key: "term", label: "Term" },
      { key: "sequence_order", label: "Seq", kind: "number" },
    ],
    orderBy: { column: "sequence_order", ascending: true },
  },
  {
    name: "academic_calendar",
    label: "Academic Calendar",
    group: "Curriculum",
    description: "School days, holidays, PD days, and term breaks.",
    columns: [
      { key: "date", label: "Date", kind: "date" },
      { key: "day_type", label: "Type", kind: "badge" },
      { key: "term", label: "Term" },
      { key: "label", label: "Label" },
    ],
    orderBy: { column: "date", ascending: true },
  },

  // ---------------------------------------------------------------- Planning
  {
    name: "lesson_plans",
    label: "Lesson Plans",
    group: "Planning",
    description: "All five planning tiers, annual through daily.",
    columns: [
      { key: "title", label: "Title" },
      { key: "tier", label: "Tier", kind: "badge" },
      { key: "lesson_date", label: "Date", kind: "date" },
      { key: "status", label: "Status", kind: "badge" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },

  // -------------------------------------------------------------- Assessment
  {
    name: "assessments",
    label: "Assessments",
    group: "Assessment",
    description: "Standards-based assessments by class.",
    columns: [
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "standard_code", label: "Standard" },
      { key: "date", label: "Date", kind: "date" },
      { key: "sbg_level_max", label: "Max SBG", kind: "number" },
    ],
    orderBy: { column: "date", ascending: false },
  },
  {
    name: "assessment_results",
    label: "Assessment Results",
    group: "Assessment",
    description: "Per-student SBG levels (1–4) and scores.",
    columns: [
      { key: "sbg_level", label: "SBG level", kind: "number" },
      { key: "score", label: "Score", kind: "number" },
      { key: "notes", label: "Notes" },
      { key: "created_at", label: "Recorded", kind: "date" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },

  // -------------------------------------------------------------- Monitoring
  {
    name: "pacing_monitor",
    label: "Pacing Monitor",
    group: "Monitoring",
    description: "Module completion against plan, per class.",
    columns: [
      { key: "status", label: "Status", kind: "badge" },
      { key: "planned_completion_date", label: "Planned", kind: "date" },
      { key: "actual_completion_date", label: "Actual", kind: "date" },
      { key: "notes", label: "Notes" },
    ],
    orderBy: { column: "planned_completion_date", ascending: true },
  },
  {
    name: "interventions",
    label: "Interventions",
    group: "Monitoring",
    description: "Student support plans and follow-ups.",
    columns: [
      { key: "category", label: "Category", kind: "badge" },
      { key: "description", label: "Description" },
      { key: "start_date", label: "Started", kind: "date" },
      { key: "follow_up_date", label: "Follow-up", kind: "date" },
      { key: "status", label: "Status", kind: "badge" },
    ],
    orderBy: { column: "start_date", ascending: false },
  },
  {
    name: "reflection_pd_log",
    label: "Reflection & PD Log",
    group: "Monitoring",
    description: "Teacher reflections and professional development hours.",
    columns: [
      { key: "entry_date", label: "Date", kind: "date" },
      { key: "type", label: "Type", kind: "badge" },
      { key: "title", label: "Title" },
      { key: "hours", label: "Hours", kind: "number" },
    ],
    orderBy: { column: "entry_date", ascending: false },
  },
  {
    name: "system_alerts",
    label: "System Alerts",
    group: "Monitoring",
    description: "Alerts raised by workflows and the agent.",
    columns: [
      { key: "severity", label: "Severity", kind: "badge" },
      { key: "message", label: "Message" },
      { key: "recipient_role", label: "For role" },
      { key: "is_read", label: "Read", kind: "bool" },
      { key: "created_at", label: "Raised", kind: "date" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },

  // ------------------------------------------------------------ Integrations
  {
    name: "mobymax_log",
    label: "MobyMax Log",
    group: "Integrations",
    description: "Per-student MobyMax session activity.",
    columns: [
      { key: "subject", label: "Subject" },
      { key: "session_date", label: "Date", kind: "date" },
      { key: "minutes_spent", label: "Minutes", kind: "number" },
      { key: "lessons_completed", label: "Lessons", kind: "number" },
      { key: "proficiency_pct", label: "Proficiency %", kind: "number" },
    ],
    orderBy: { column: "session_date", ascending: false },
  },
  {
    name: "mobymax_assignments",
    label: "MobyMax Assignments",
    group: "Integrations",
    description: "Assignments issued to classes via MobyMax.",
    columns: [
      { key: "title", label: "Title" },
      { key: "subject", label: "Subject" },
      { key: "assigned_date", label: "Assigned", kind: "date" },
      { key: "due_date", label: "Due", kind: "date" },
      { key: "completion_pct", label: "Complete %", kind: "number" },
    ],
    orderBy: { column: "assigned_date", ascending: false },
  },
  {
    name: "duolingo_tracker",
    label: "Duolingo Tracker",
    group: "Integrations",
    description: "Language learning progress per student.",
    columns: [
      { key: "language", label: "Language", kind: "badge" },
      { key: "session_date", label: "Date", kind: "date" },
      { key: "xp_earned", label: "XP", kind: "number" },
      { key: "streak_days", label: "Streak", kind: "number" },
      { key: "proficiency_level", label: "Level" },
    ],
    orderBy: { column: "session_date", ascending: false },
  },
  {
    name: "language_platform_migration",
    label: "Language Platform Migration",
    group: "Integrations",
    description: "2027 Duolingo replacement evaluation tracker.",
    columns: [
      { key: "platform_name", label: "Platform" },
      { key: "evaluation_status", label: "Status", kind: "badge" },
      { key: "target_term", label: "Target term" },
      { key: "notes", label: "Notes" },
    ],
    orderBy: { column: "platform_name", ascending: true },
  },

  // ---------------------------------------------------------------- Resources
  {
    name: "resource_collections",
    label: "Resource Collections",
    group: "Resources",
    description: "Drive folder tree: subject → grade → module.",
    columns: [
      { key: "path", label: "Path" },
      { key: "subject", label: "Subject" },
      { key: "grade_level", label: "Grade" },
      { key: "module_name", label: "Module" },
      { key: "depth", label: "Depth", kind: "number" },
    ],
    orderBy: { column: "path", ascending: true },
  },
  {
    name: "resources",
    label: "Resource Files",
    group: "Resources",
    description: "Individual books, PDFs, and links from Drive and Moodle.",
    columns: [
      { key: "name", label: "Name" },
      { key: "source", label: "Source", kind: "badge" },
      { key: "kind", label: "Kind", kind: "badge" },
      { key: "doc_role", label: "Role", kind: "badge" },
      { key: "file_size", label: "Bytes", kind: "number" },
    ],
    orderBy: { column: "name", ascending: true },
  },
  {
    name: "resource_categories",
    label: "Moodle Categories",
    group: "Resources",
    description: "Grade categories mirrored from the Moodle instance.",
    columns: [
      { key: "name", label: "Category" },
      { key: "grade_band", label: "Grade band" },
      { key: "course_count", label: "Courses", kind: "number" },
      { key: "last_synced_at", label: "Synced", kind: "date" },
    ],
    orderBy: { column: "sort_order", ascending: true },
  },
  {
    name: "planner_folders",
    label: "Planner Folders",
    group: "Resources",
    description: "Teacher hanging folders.",
    columns: [
      { key: "name", label: "Folder" },
      { key: "is_ai_generated", label: "AI suggested", kind: "bool" },
      { key: "created_at", label: "Created", kind: "date" },
    ],
    orderBy: { column: "name", ascending: true },
  },

  // --------------------------------------------------------------- Automation
  {
    name: "workflows",
    label: "Workflows",
    group: "Automation",
    description: "Automated monitoring rules.",
    columns: [
      { key: "name", label: "Name" },
      { key: "rule_type", label: "Rule", kind: "badge" },
      { key: "cadence", label: "Cadence", kind: "badge" },
      { key: "severity", label: "Severity", kind: "badge" },
      { key: "is_enabled", label: "Enabled", kind: "bool" },
      { key: "last_run_at", label: "Last run", kind: "date" },
    ],
    orderBy: { column: "name", ascending: true },
  },
  {
    name: "workflow_runs",
    label: "Workflow Runs",
    group: "Automation",
    description: "Execution history for each workflow.",
    columns: [
      { key: "started_at", label: "Started", kind: "date" },
      { key: "status", label: "Status", kind: "badge" },
      { key: "matches_found", label: "Matches", kind: "number" },
      { key: "alerts_created", label: "Alerts", kind: "number" },
      { key: "summary", label: "Summary" },
    ],
    orderBy: { column: "started_at", ascending: false },
  },
  {
    name: "agent_actions",
    label: "Agent Proposals",
    group: "Automation",
    description: "Actions the agent proposed, awaiting human review.",
    columns: [
      { key: "action_type", label: "Action", kind: "badge" },
      { key: "status", label: "Status", kind: "badge" },
      { key: "rationale", label: "Rationale" },
      { key: "created_at", label: "Proposed", kind: "date" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },

  {
    name: "curriculum_programmes",
    label: "Programmes",
    group: "Curriculum",
    description:
      "Which programme SCA runs for each subject, and against which standard.",
    columns: [
      { key: "subject", label: "Subject" },
      { key: "programme", label: "Programme" },
      { key: "grades", label: "Grades", kind: "badge" },
      { key: "status", label: "Status", kind: "badge" },
      { key: "is_daily", label: "Daily", kind: "bool" },
    ],
    orderBy: { column: "subject", ascending: true },
  },
  {
    name: "curriculum_sources",
    label: "Source Library",
    group: "Curriculum",
    description:
      "Free, openly-licensed source for every programme. The acquisition list.",
    columns: [
      { key: "priority", label: "Priority", kind: "number" },
      { key: "name", label: "Source" },
      { key: "category", label: "Category", kind: "badge" },
      { key: "provides", label: "Provides" },
      { key: "acquired", label: "Filed", kind: "bool" },
    ],
    orderBy: { column: "priority", ascending: true },
  },
  {
    name: "curriculum_frameworks",
    label: "Standards Frameworks",
    group: "Curriculum",
    description:
      "Which standards framework governs each subject. CCSS for Maths and ELA; Utah Core elsewhere.",
    columns: [
      { key: "subject", label: "Subject" },
      { key: "primary_standard", label: "Primary standard" },
      { key: "parent_framework", label: "Parent framework", kind: "badge" },
      { key: "notes", label: "Notes" },
    ],
    orderBy: { column: "subject", ascending: true },
  },

  // ---------------------------------------------------------------- Platform
  // Superadmin-scoped. These are listed for completeness — RLS still decides
  // what any given account can actually read, so an admin opening `audit_log`
  // sees an empty table rather than a permission error.
  {
    name: "schools",
    label: "Schools",
    group: "Platform",
    description:
      "Tenant registry. Multi-school isolation is not yet enforced across tables.",
    columns: [
      { key: "name", label: "Name" },
      { key: "code", label: "Code", kind: "badge" },
      { key: "timezone", label: "Timezone" },
      { key: "is_active", label: "Active", kind: "bool" },
    ],
    orderBy: { column: "name", ascending: true },
  },
  {
    name: "system_settings",
    label: "System Settings",
    group: "Platform",
    description: "Platform configuration. Writable by a superadmin only.",
    columns: [
      { key: "key", label: "Key" },
      { key: "value", label: "Value" },
      { key: "description", label: "Description" },
      { key: "updated_at", label: "Updated", kind: "date" },
    ],
    orderBy: { column: "key", ascending: true },
  },
  {
    name: "audit_log",
    label: "Audit Log",
    group: "Platform",
    description:
      "Append-only record of role changes, approvals, and setting edits. Readable by a superadmin only.",
    columns: [
      { key: "created_at", label: "When", kind: "date" },
      { key: "action", label: "Action", kind: "badge" },
      { key: "entity", label: "Entity" },
      { key: "entity_id", label: "Entity ID" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },
];

export function getTable(name: string): TableSpec | undefined {
  return TABLES.find((t) => t.name === name);
}

export function tablesByGroup(): { group: string; tables: TableSpec[] }[] {
  return TABLE_GROUPS.map((group) => ({
    group,
    tables: TABLES.filter((t) => t.group === group),
  })).filter((g) => g.tables.length > 0);
}
