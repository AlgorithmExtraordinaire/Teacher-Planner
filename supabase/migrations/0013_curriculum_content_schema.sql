-- Room for the KB's curriculum content: per-grade module sequencing with
-- Great Minds' guideline day counts, plus registries for the programmes SCA
-- runs and the free sources they come from.
--
-- Source: Notion KB — Curriculum Resource Inventory 2026, revised 5 Aug 2026.

alter table public.curriculum_modules
  add column if not exists grade_level text,
  add column if not exists planned_days int,
  add column if not exists source_url text;

-- Backfill grade_level from the existing title convention ("Grade 3 — Module 1").
update public.curriculum_modules
   set grade_level = split_part(title, ' — ', 1)
 where grade_level is null;

-- Lets the module map be re-run as an upsert instead of a delete-and-reload,
-- so re-importing a corrected map never destroys linked pacing rows.
create unique index if not exists curriculum_modules_unique_slot
  on public.curriculum_modules (subject, grade_level, sequence_order);

-- Which programme SCA actually runs for each subject, and against which
-- standard. Distinct from curriculum_frameworks: that records the standard,
-- this records the materials taught against it.
create table public.curriculum_programmes (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  programme text not null,
  governing_standard text,
  grades text,
  status text not null default 'adopted',
  is_daily boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (subject, programme)
);

comment on table public.curriculum_programmes is
  'Programmes in use per subject. Source: Notion KB, Curriculum Resource Inventory 2026, revised 5 Aug 2026.';

-- The acquisition list. Every entry is free and openly licensed; this is what
-- turns "we have a gap" into "we know exactly where to get it".
create table public.curriculum_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  provides text,
  url text not null,
  licence text,
  acquired boolean not null default false,
  priority int,
  created_at timestamptz not null default now()
);

comment on table public.curriculum_sources is
  'Free, openly-licensed sources for every programme. Source: Notion KB, Curriculum Resource Inventory 2026, Master Source Library.';

alter table public.curriculum_programmes enable row level security;
alter table public.curriculum_sources    enable row level security;

create policy "curriculum_programmes_select" on public.curriculum_programmes
  for select to authenticated using (true);
create policy "curriculum_programmes_write" on public.curriculum_programmes
  for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());

create policy "curriculum_sources_select" on public.curriculum_sources
  for select to authenticated using (true);
create policy "curriculum_sources_write" on public.curriculum_sources
  for all to authenticated using (public.is_staff_admin()) with check (public.is_staff_admin());
