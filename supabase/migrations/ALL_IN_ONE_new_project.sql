-- Teacher-Planner — complete schema, consolidated for a fresh Supabase project.
-- Generated from migrations 0001-0004. Apply once, in the Supabase SQL Editor
-- of the target project. Safe to run on an empty project only.
--
-- Order matters: tables, then RLS helpers + policies, then the auth trigger,
-- then the agent/workflow layer.

begin;

-- ===== 0001_init_schema.sql =====
-- Teacher-Planner initial schema
-- Swakopmund Christian Academy â€” SCA Live Teacher Planner

create extension if not exists pgcrypto;

-- ============================================================
-- Core identity
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('teacher', 'grade_lead', 'admin')),
  grade_band text,
  created_at timestamptz not null default now()
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null,
  email text unique,
  subject text,
  grade_band text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  student_number text unique,
  grade_band text,
  grade_level text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Classes & roster
-- ============================================================

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  grade_band text,
  grade_level text,
  teacher_id uuid references public.teachers (id) on delete set null,
  term text,
  created_at timestamptz not null default now()
);

create table public.class_enrollment (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  enrolled_at date not null default current_date,
  unique (class_id, student_id)
);

-- ============================================================
-- Curriculum
-- ============================================================

create table public.curriculum_standards (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  framework text not null,
  subject text,
  grade_band text,
  description text,
  created_at timestamptz not null default now()
);

create table public.curriculum_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  grade_band text,
  source text,
  term text,
  sequence_order int,
  created_at timestamptz not null default now()
);

create table public.academic_calendar (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  day_type text not null check (day_type in ('school_day', 'holiday', 'weekend', 'pd_day', 'term_break')),
  term text,
  label text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Lesson planning
-- ============================================================

create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes (id) on delete set null,
  teacher_id uuid references public.teachers (id) on delete set null,
  curriculum_module_id uuid references public.curriculum_modules (id) on delete set null,
  title text not null,
  tier text not null check (tier in ('annual', 'term', 'monthly', 'weekly', 'daily')),
  lesson_date date,
  week_of date,
  objective text,
  standards text[] not null default '{}',
  materials text,
  warm_up text,
  direct_instruction text,
  guided_practice text,
  independent_practice text,
  assessment_strategy text,
  differentiation text,
  homework text,
  reflection text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Assessment
-- ============================================================

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes (id) on delete cascade,
  title text not null,
  type text,
  standard_code text,
  sbg_level_max int not null default 4,
  date date,
  created_at timestamptz not null default now()
);

create table public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  score numeric,
  sbg_level int check (sbg_level between 1 and 4),
  notes text,
  created_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);

-- ============================================================
-- Pacing, interventions, reflection
-- ============================================================

create table public.pacing_monitor (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes (id) on delete cascade,
  curriculum_module_id uuid references public.curriculum_modules (id) on delete cascade,
  planned_completion_date date,
  actual_completion_date date,
  status text not null default 'on_track' check (status in ('on_track', 'behind', 'ahead', 'complete')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete set null,
  category text,
  description text not null,
  start_date date not null default current_date,
  status text not null default 'open' check (status in ('open', 'monitoring', 'resolved')),
  follow_up_date date,
  created_at timestamptz not null default now()
);

create table public.reflection_pd_log (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teachers (id) on delete cascade,
  entry_date date not null default current_date,
  type text not null default 'reflection' check (type in ('reflection', 'professional_development')),
  title text,
  notes text,
  hours numeric,
  created_at timestamptz not null default now()
);

-- ============================================================
-- External learning platform integrations
-- ============================================================

create table public.mobymax_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  subject text,
  session_date date,
  minutes_spent int,
  lessons_completed int,
  proficiency_pct numeric,
  created_at timestamptz not null default now()
);

create table public.mobymax_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes (id) on delete cascade,
  title text not null,
  subject text,
  assigned_date date not null default current_date,
  due_date date,
  completion_pct numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.duolingo_tracker (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  language text not null default 'Spanish',
  session_date date,
  xp_earned int,
  streak_days int,
  proficiency_level text,
  created_at timestamptz not null default now()
);

create table public.language_platform_migration (
  id uuid primary key default gen_random_uuid(),
  platform_name text not null,
  evaluation_status text not null default 'pending' check (evaluation_status in ('pending', 'in_review', 'approved', 'rejected')),
  target_term text not null default '2027 Term 1',
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Alerts
-- ============================================================

create table public.system_alerts (
  id uuid primary key default gen_random_uuid(),
  recipient_role text check (recipient_role in ('teacher', 'grade_lead', 'admin')),
  teacher_id uuid references public.teachers (id) on delete cascade,
  severity text not null default 'info' check (severity in ('info', 'warning', 'urgent')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index on public.classes (teacher_id);
create index on public.class_enrollment (student_id);
create index on public.lesson_plans (class_id);
create index on public.lesson_plans (teacher_id);
create index on public.lesson_plans (lesson_date);
create index on public.assessment_results (student_id);
create index on public.interventions (student_id);
create index on public.mobymax_log (student_id);
create index on public.duolingo_tracker (student_id);


-- ===== 0002_rls_policies.sql =====
-- Row Level Security for Teacher-Planner
-- Model: any authenticated staff member can read shared school data;
-- writes are restricted to admins/grade leads, or to the owning teacher
-- for their own lesson plans, reflections, interventions, and pacing notes.

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.teachers where profile_id = auth.uid()
$$;

create or replace function public.is_staff_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() in ('admin', 'grade_lead')
$$;

alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollment enable row level security;
alter table public.curriculum_standards enable row level security;
alter table public.curriculum_modules enable row level security;
alter table public.academic_calendar enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_results enable row level security;
alter table public.pacing_monitor enable row level security;
alter table public.interventions enable row level security;
alter table public.reflection_pd_log enable row level security;
alter table public.mobymax_log enable row level security;
alter table public.mobymax_assignments enable row level security;
alter table public.duolingo_tracker enable row level security;
alter table public.language_platform_migration enable row level security;
alter table public.system_alerts enable row level security;

-- profiles: everyone can see everyone's directory entry; users manage their own row, admins manage all
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

-- reference / shared data: readable by all staff, writable by admin & grade_lead
create policy "teachers_select" on public.teachers for select to authenticated using (true);
create policy "teachers_write" on public.teachers for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "students_select" on public.students for select to authenticated using (true);
create policy "students_write" on public.students for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "classes_select" on public.classes for select to authenticated using (true);
create policy "classes_write_admin" on public.classes for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());
create policy "classes_update_own" on public.classes for update to authenticated using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

create policy "class_enrollment_select" on public.class_enrollment for select to authenticated using (true);
create policy "class_enrollment_write" on public.class_enrollment for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "curriculum_standards_select" on public.curriculum_standards for select to authenticated using (true);
create policy "curriculum_standards_write" on public.curriculum_standards for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "curriculum_modules_select" on public.curriculum_modules for select to authenticated using (true);
create policy "curriculum_modules_write" on public.curriculum_modules for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "academic_calendar_select" on public.academic_calendar for select to authenticated using (true);
create policy "academic_calendar_write" on public.academic_calendar for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

-- lesson plans: all staff can read; owning teacher or admin/grade_lead can write
create policy "lesson_plans_select" on public.lesson_plans for select to authenticated using (true);
create policy "lesson_plans_write_own" on public.lesson_plans for all to authenticated
  using (teacher_id = public.current_teacher_id() or public.is_staff_admin())
  with check (teacher_id = public.current_teacher_id() or public.is_staff_admin());

-- assessments & results: all staff read; admin/grade_lead write, teachers write for their own classes
create policy "assessments_select" on public.assessments for select to authenticated using (true);
create policy "assessments_write" on public.assessments for all to authenticated
  using (
    public.is_staff_admin()
    or class_id in (select id from public.classes where teacher_id = public.current_teacher_id())
  )
  with check (
    public.is_staff_admin()
    or class_id in (select id from public.classes where teacher_id = public.current_teacher_id())
  );

create policy "assessment_results_select" on public.assessment_results for select to authenticated using (true);
create policy "assessment_results_write" on public.assessment_results for all to authenticated
  using (
    public.is_staff_admin()
    or assessment_id in (
      select a.id from public.assessments a
      join public.classes c on c.id = a.class_id
      where c.teacher_id = public.current_teacher_id()
    )
  )
  with check (
    public.is_staff_admin()
    or assessment_id in (
      select a.id from public.assessments a
      join public.classes c on c.id = a.class_id
      where c.teacher_id = public.current_teacher_id()
    )
  );

-- pacing, interventions, reflection: readable by all staff; writable by owner or admin/grade_lead
create policy "pacing_monitor_select" on public.pacing_monitor for select to authenticated using (true);
create policy "pacing_monitor_write" on public.pacing_monitor for all to authenticated
  using (
    public.is_staff_admin()
    or class_id in (select id from public.classes where teacher_id = public.current_teacher_id())
  )
  with check (
    public.is_staff_admin()
    or class_id in (select id from public.classes where teacher_id = public.current_teacher_id())
  );

create policy "interventions_select" on public.interventions for select to authenticated using (true);
create policy "interventions_write" on public.interventions for all to authenticated
  using (teacher_id = public.current_teacher_id() or public.is_staff_admin())
  with check (teacher_id = public.current_teacher_id() or public.is_staff_admin());

create policy "reflection_pd_log_select" on public.reflection_pd_log for select to authenticated using (true);
create policy "reflection_pd_log_write_own" on public.reflection_pd_log for all to authenticated
  using (teacher_id = public.current_teacher_id() or public.is_staff_admin())
  with check (teacher_id = public.current_teacher_id() or public.is_staff_admin());

-- external platform logs: readable by all staff, writable by admin/grade_lead
create policy "mobymax_log_select" on public.mobymax_log for select to authenticated using (true);
create policy "mobymax_log_write" on public.mobymax_log for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "mobymax_assignments_select" on public.mobymax_assignments for select to authenticated using (true);
create policy "mobymax_assignments_write" on public.mobymax_assignments for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "duolingo_tracker_select" on public.duolingo_tracker for select to authenticated using (true);
create policy "duolingo_tracker_write" on public.duolingo_tracker for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "language_platform_migration_select" on public.language_platform_migration for select to authenticated using (true);
create policy "language_platform_migration_write" on public.language_platform_migration for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

-- system alerts: staff see broadcasts + alerts for their role/teacher record; admin sees & writes all
create policy "system_alerts_select" on public.system_alerts for select to authenticated
  using (
    recipient_role is null
    or recipient_role = public.current_role()
    or teacher_id = public.current_teacher_id()
    or public.is_staff_admin()
  );
create policy "system_alerts_write" on public.system_alerts for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());


-- ===== 0003_auto_profile.sql =====
-- Auto-create a profile row whenever a new auth user is created.
-- Defaults to the 'teacher' role; admins can promote via the profiles table.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, grade_band)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'teacher'),
    new.raw_user_meta_data ->> 'grade_band'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ===== 0004_agent_and_workflows.sql =====
-- Agentic layer + workflow automation for Teacher-Planner
--
-- Design notes:
--   * Workflows are built-in rule types, not arbitrary conditions. An LLM never
--     writes SQL that runs unattended â€” it selects a rule and its parameters.
--   * Agent writes are proposals by default. `agent_actions` is an approval
--     queue; nothing mutates school data until a human approves it.

-- ============================================================
-- Workflows
-- ============================================================

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  rule_type text not null check (rule_type in (
    'missing_lesson_plans',
    'pacing_behind',
    'assessment_below_threshold',
    'intervention_followup_due',
    'mobymax_low_engagement',
    'language_migration_checkpoint',
    'ai_daily_digest'
  )),
  params jsonb not null default '{}'::jsonb,
  cadence text not null default 'daily' check (cadence in ('hourly', 'daily', 'weekly')),
  severity text not null default 'info' check (severity in ('info', 'warning', 'urgent')),
  recipient_role text check (recipient_role in ('teacher', 'grade_lead', 'admin')),
  is_enabled boolean not null default true,
  last_run_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  matches_found int not null default 0,
  alerts_created int not null default 0,
  summary text,
  error_message text
);

create index on public.workflow_runs (workflow_id, started_at desc);

-- ============================================================
-- Agent conversations
-- ============================================================

create table public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'New conversation',
  specialist text not null default 'general' check (specialist in (
    'general',
    'pedagogy',
    'educational_psychology',
    'philosophy_of_education',
    'curriculum_design',
    'assessment_specialist',
    'sel_wellbeing'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index on public.agent_messages (conversation_id, created_at);

-- ============================================================
-- Agent action approval queue
-- ============================================================

create table public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.agent_conversations (id) on delete set null,
  proposed_by uuid references public.profiles (id) on delete set null,
  action_type text not null check (action_type in (
    'create_lesson_plan',
    'create_intervention',
    'create_assessment',
    'update_pacing'
  )),
  payload jsonb not null,
  rationale text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied', 'failed')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  result_id uuid,
  error_message text,
  created_at timestamptz not null default now()
);

create index on public.agent_actions (status, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_actions enable row level security;

-- workflows: all staff read, admin/grade_lead manage
create policy "workflows_select" on public.workflows for select to authenticated using (true);
create policy "workflows_write" on public.workflows for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "workflow_runs_select" on public.workflow_runs for select to authenticated using (true);
create policy "workflow_runs_write" on public.workflow_runs for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

-- conversations are private to their owner (admins can audit)
create policy "agent_conversations_own" on public.agent_conversations for all to authenticated
  using (profile_id = auth.uid() or public.is_staff_admin())
  with check (profile_id = auth.uid());

create policy "agent_messages_own" on public.agent_messages for all to authenticated
  using (
    conversation_id in (select id from public.agent_conversations where profile_id = auth.uid())
    or public.is_staff_admin()
  )
  with check (
    conversation_id in (select id from public.agent_conversations where profile_id = auth.uid())
  );

-- proposals are visible to their author and to reviewers; only admins may approve
create policy "agent_actions_select" on public.agent_actions for select to authenticated
  using (proposed_by = auth.uid() or public.is_staff_admin());
create policy "agent_actions_insert" on public.agent_actions for insert to authenticated
  with check (proposed_by = auth.uid());
create policy "agent_actions_review" on public.agent_actions for update to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());


commit;
