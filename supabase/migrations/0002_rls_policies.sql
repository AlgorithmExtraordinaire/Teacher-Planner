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
