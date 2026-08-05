-- Standards are identified by (framework, code): "3.OA.A.1" means one thing in
-- CCSS-M and could mean another elsewhere. Without this, re-importing a
-- standards set silently duplicates every row.
create unique index if not exists curriculum_standards_framework_code
  on public.curriculum_standards (framework, code);

-- Grade level as its own column. grade_band was carrying values like
-- "Grade 3" because there was nowhere else to put them, which conflates the
-- phase (Elementary) with the year (Grade 3).
alter table public.curriculum_standards
  add column if not exists grade_level text,
  add column if not exists domain text,
  add column if not exists source_url text;

update public.curriculum_standards
   set grade_level = grade_band
 where grade_level is null;
