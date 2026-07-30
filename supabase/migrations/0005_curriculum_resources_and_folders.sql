-- Curriculum resource catalogue + teacher "hanging folders"
--
-- Shape follows the source of truth: the school's Moodle instance at
-- online.elearning-swakopca.edu.na. Moodle IDs are stored so a sync is
-- idempotent (upsert on moodle_*_id) rather than duplicating on every run.
--
-- The catalogue tables are read-mostly and populated by the n8n sync.
-- The folder tables are teacher-owned working space.

-- ============================================================
-- Catalogue: mirrors Moodle categories -> courses -> resources
-- ============================================================

create table public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  moodle_category_id int unique not null,
  name text not null,
  grade_band text,
  grade_level text,
  course_count int,
  sort_order int not null default 0,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.resource_courses (
  id uuid primary key default gen_random_uuid(),
  moodle_course_id int unique not null,
  category_id uuid references public.resource_categories (id) on delete cascade,
  fullname text not null,
  shortname text,
  subject text,
  summary text,
  visible boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- One row per usable teaching artefact: a book, PDF, link, page, video.
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.resource_courses (id) on delete cascade,
  moodle_module_id int unique,
  name text not null,
  kind text not null default 'file' check (kind in (
    'book', 'file', 'pdf', 'url', 'page', 'video', 'audio',
    'folder', 'quiz', 'assignment', 'scorm', 'other'
  )),
  mime_type text,
  file_url text,
  file_size bigint,
  section_name text,
  sort_order int not null default 0,
  -- Populated by the AI classifier pass, not by Moodle.
  ai_subject text,
  ai_topics text[] not null default '{}',
  ai_summary text,
  ai_classified_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.resource_courses (category_id);
create index on public.resources (course_id);
create index on public.resources (kind);
create index on public.resources (ai_subject);

-- Sync bookkeeping so a failed run is visible rather than silent.
create table public.resource_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  categories_seen int not null default 0,
  courses_seen int not null default 0,
  resources_seen int not null default 0,
  error_message text
);

-- ============================================================
-- Hanging folders: a teacher's own organisation of the catalogue
-- ============================================================

create table public.planner_folders (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teachers (id) on delete cascade,
  parent_id uuid references public.planner_folders (id) on delete cascade,
  name text not null,
  colour text,
  -- true when the AI proposed this folder rather than the teacher creating it
  is_ai_generated boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.planner_folder_items (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.planner_folders (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  note text,
  sort_order int not null default 0,
  added_at timestamptz not null default now(),
  unique (folder_id, resource_id)
);

-- Attach catalogue resources directly to a lesson plan, by teaching role.
create table public.lesson_plan_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  role text not null default 'material' check (role in (
    'material', 'warm_up', 'direct_instruction', 'guided_practice',
    'independent_practice', 'assessment', 'homework', 'extension'
  )),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (lesson_plan_id, resource_id, role)
);

create index on public.planner_folders (teacher_id);
create index on public.planner_folders (parent_id);
create index on public.planner_folder_items (folder_id);
create index on public.lesson_plan_resources (lesson_plan_id);

-- ============================================================
-- RLS
-- ============================================================

alter table public.resource_categories enable row level security;
alter table public.resource_courses enable row level security;
alter table public.resources enable row level security;
alter table public.resource_sync_runs enable row level security;
alter table public.planner_folders enable row level security;
alter table public.planner_folder_items enable row level security;
alter table public.lesson_plan_resources enable row level security;

-- Catalogue is shared reference data: all staff read, admins curate.
create policy "resource_categories_select" on public.resource_categories for select to authenticated using (true);
create policy "resource_categories_write" on public.resource_categories for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "resource_courses_select" on public.resource_courses for select to authenticated using (true);
create policy "resource_courses_write" on public.resource_courses for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "resources_select" on public.resources for select to authenticated using (true);
create policy "resources_write" on public.resources for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "resource_sync_runs_select" on public.resource_sync_runs for select to authenticated using (true);
create policy "resource_sync_runs_write" on public.resource_sync_runs for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

-- Folders are private working space, owned by the teacher who made them.
create policy "planner_folders_own" on public.planner_folders for all to authenticated
  using (teacher_id = public.current_teacher_id() or public.is_staff_admin())
  with check (teacher_id = public.current_teacher_id() or public.is_staff_admin());

create policy "planner_folder_items_own" on public.planner_folder_items for all to authenticated
  using (
    folder_id in (select id from public.planner_folders where teacher_id = public.current_teacher_id())
    or public.is_staff_admin()
  )
  with check (
    folder_id in (select id from public.planner_folders where teacher_id = public.current_teacher_id())
    or public.is_staff_admin()
  );

-- Lesson-plan attachments follow the lesson plan's own ownership rule.
create policy "lesson_plan_resources_select" on public.lesson_plan_resources for select to authenticated using (true);
create policy "lesson_plan_resources_write" on public.lesson_plan_resources for all to authenticated
  using (
    lesson_plan_id in (select id from public.lesson_plans where teacher_id = public.current_teacher_id())
    or public.is_staff_admin()
  )
  with check (
    lesson_plan_id in (select id from public.lesson_plans where teacher_id = public.current_teacher_id())
    or public.is_staff_admin()
  );
