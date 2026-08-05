-- Standards coverage needs a join, not an array.
--
-- lesson_plans.standards is a text[]. You can load ten thousand standard
-- codes and still not answer "which standards has Grade 4 Maths covered this
-- term?", because an array cannot be joined against curriculum_standards and
-- a typo in it is invisible. This adds the join table, keyed to real standard
-- rows, so coverage becomes a query rather than a guess.
--
-- The old column is retained for now so the existing lesson-plan form keeps
-- working; it should be dropped once the form writes through this table.

create table public.lesson_plan_standards (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans (id) on delete cascade,
  standard_id uuid not null references public.curriculum_standards (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (lesson_plan_id, standard_id)
);

create index on public.lesson_plan_standards (standard_id);
create index on public.lesson_plan_standards (lesson_plan_id);

comment on table public.lesson_plan_standards is
  'Which standards a lesson plan addresses. Replaces lesson_plans.standards (text[]), which could not be joined or validated.';

-- Migrate anything already captured in the array, matching on code. Rows whose
-- code does not resolve are left behind rather than invented — they will show
-- up as the difference between the array length and the join count.
insert into public.lesson_plan_standards (lesson_plan_id, standard_id)
select lp.id, cs.id
  from public.lesson_plans lp
  cross join lateral unnest(lp.standards) as code(value)
  join public.curriculum_standards cs on cs.code = code.value
 where lp.standards is not null and array_length(lp.standards, 1) > 0
on conflict do nothing;

alter table public.lesson_plan_standards enable row level security;

-- Mirrors the lesson plan's own ownership rule: all staff read, the owning
-- teacher or a staff admin writes.
create policy "lesson_plan_standards_select" on public.lesson_plan_standards
  for select to authenticated using (true);

create policy "lesson_plan_standards_write" on public.lesson_plan_standards
  for all to authenticated
  using (
    lesson_plan_id in (
      select id from public.lesson_plans
       where teacher_id = public.current_teacher_id()
    ) or public.is_staff_admin()
  )
  with check (
    lesson_plan_id in (
      select id from public.lesson_plans
       where teacher_id = public.current_teacher_id()
    ) or public.is_staff_admin()
  );
