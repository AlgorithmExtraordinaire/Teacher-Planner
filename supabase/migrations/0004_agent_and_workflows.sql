-- Agentic layer + workflow automation for Teacher-Planner
--
-- Design notes:
--   * Workflows are built-in rule types, not arbitrary conditions. An LLM never
--     writes SQL that runs unattended — it selects a rule and its parameters.
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
