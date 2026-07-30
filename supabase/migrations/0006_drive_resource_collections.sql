-- Google Drive as a second resource source alongside Moodle.
-- The Engage NY trees are Subject -> Grade -> Module -> files, so collections
-- are a self-nesting tree and Drive resources hang off a collection.

create table public.resource_collections (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'drive' check (source in ('drive', 'moodle')),
  drive_folder_id text unique,
  parent_id uuid references public.resource_collections (id) on delete cascade,
  name text not null,
  -- Denormalised so a teacher can filter without walking the tree.
  subject text,
  grade_level text,
  grade_band text,
  module_name text,
  depth int not null default 0,
  path text,
  view_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.resource_collections (parent_id);
create index on public.resource_collections (subject, grade_level);

alter table public.resources
  add column source text not null default 'moodle' check (source in ('moodle', 'drive')),
  add column drive_file_id text unique,
  add column collection_id uuid references public.resource_collections (id) on delete cascade,
  -- Parsed from the Engage NY filename convention, not AI-inferred.
  add column doc_role text check (doc_role in (
    'student_workbook', 'teacher_edition', 'additional_materials',
    'full_module', 'curriculum_outline', 'other'
  ));

-- Moodle rows keep course_id; Drive rows use collection_id.
alter table public.resources
  add constraint resources_one_parent check (
    (course_id is not null and collection_id is null)
    or (course_id is null and collection_id is not null)
    or (course_id is null and collection_id is null)
  );

create index on public.resources (collection_id);
create index on public.resources (doc_role);

alter table public.resource_collections enable row level security;

create policy "resource_collections_select" on public.resource_collections for select to authenticated using (true);
create policy "resource_collections_write" on public.resource_collections for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());