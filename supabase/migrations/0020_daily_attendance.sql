-- Daily attendance register.
--
-- 0018 created attendance_summary, keyed by (student_id, term), and said why:
-- the mid-year workbook publishes a term summary, not a daily register, and
-- storing a summary per-day would have invented events nobody recorded. It
-- also said where the real thing would go — "a separate table that this one
-- can be derived from". This is that table.
--
-- The two coexist deliberately. attendance_summary holds what the workbook
-- reported for the first semester; this holds what teachers mark from Term 3
-- onward. Neither is derived from the other retroactively, because the
-- first-semester daily records do not exist and never will.

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  -- Foreign key to the calendar, not a bare date. Attendance can only be
  -- recorded against a day the school actually recognises, so a typo cannot
  -- create a register for a day that does not exist. Restrict rather than
  -- cascade: deleting a calendar day must not silently delete the register
  -- taken on it.
  date date not null references public.academic_calendar (date) on delete restrict,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  note text,
  -- Who marked it, kept separately from the class's teacher: a reliever or an
  -- admin correcting a record is a different person from the class owner, and
  -- the register should say which.
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One mark per learner per class per day. Makes the save an upsert, so a
  -- teacher who corrects a mark and saves again updates rather than
  -- accumulating contradictory rows.
  unique (class_id, student_id, date)
);

comment on table public.attendance is
  'Daily attendance register, from Term 3 2026 onward. Term-level figures for the first semester live in attendance_summary and are not derived from this.';

create index on public.attendance (class_id, date);
create index on public.attendance (student_id);
create index on public.attendance (date);

alter table public.attendance enable row level security;

-- Reads follow the same school-wide rule as every other record here. Writes
-- are the class's own teacher, or a staff admin.
create policy "attendance_select" on public.attendance
  for select to authenticated using (true);

create policy "attendance_write" on public.attendance
  for all to authenticated
  using (
    class_id in (
      select id from public.classes
       where teacher_id = public.current_teacher_id()
    ) or public.is_staff_admin()
  )
  with check (
    class_id in (
      select id from public.classes
       where teacher_id = public.current_teacher_id()
    ) or public.is_staff_admin()
  );

-- Keep updated_at honest; the register is a record of when a mark was last
-- changed as much as what it says.
create or replace function public.touch_attendance_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function public.touch_attendance_updated_at();
