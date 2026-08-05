-- Attendance and report comments.
--
-- The mid-year results workbook carries four sheets. Two of them — Attendance
-- and Comments — had nowhere to land: the schema tracked assessments but not
-- the attendance figure or the teacher's narrative comment that appear on
-- every report card the school issues.
--
-- Both are keyed by (student_id, term) rather than by date. The workbook
-- publishes a term SUMMARY (present days / total days / percentage), not a
-- daily register, and storing a summary in a per-day table would invent
-- attendance events that were never recorded. If daily registers are adopted
-- later they belong in a separate table that this one can be derived from.

create table if not exists public.attendance_summary (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  term text not null,
  present_days int,
  total_days int,
  attendance_pct numeric,
  created_at timestamptz not null default now(),
  unique (student_id, term)
);

create table if not exists public.report_comments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  term text not null,
  comment text not null,
  author_teacher_id uuid references public.teachers (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, term)
);

alter table public.attendance_summary enable row level security;
alter table public.report_comments   enable row level security;

-- Staff read; only admins write. A comment is part of a learner's record and
-- an attendance figure is used for promotion decisions, so neither should be
-- editable by any signed-in account without an audit trail behind it.
create policy attendance_summary_select on public.attendance_summary
  for select to authenticated using (true);
create policy attendance_summary_write on public.attendance_summary
  for all to authenticated using (public.is_staff_admin())
  with check (public.is_staff_admin());

create policy report_comments_select on public.report_comments
  for select to authenticated using (true);
create policy report_comments_write on public.report_comments
  for all to authenticated using (public.is_staff_admin())
  with check (public.is_staff_admin());

create index if not exists attendance_summary_student_idx
  on public.attendance_summary (student_id);
create index if not exists report_comments_student_idx
  on public.report_comments (student_id);
