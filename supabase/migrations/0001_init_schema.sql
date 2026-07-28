-- Teacher-Planner initial schema
-- Swakopmund Christian Academy — SCA Live Teacher Planner

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
