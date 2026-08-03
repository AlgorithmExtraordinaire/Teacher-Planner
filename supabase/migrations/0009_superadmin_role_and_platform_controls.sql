-- Fourth role: superadmin — plus the control surfaces it exists to own.
--
-- Until now `admin` was the ceiling, which meant any admin could edit any
-- other profile's role, including promoting themselves. That is not a
-- privilege boundary, it is a shared key. `superadmin` is the tier that
-- actually owns platform-level control:
--
--   * role assignment          (admins can no longer escalate)
--   * system settings          (platform configuration)
--   * the school registry      (multi-school foundation)
--   * the audit log            (append-only oversight)
--
-- Everything `admin` could do, `superadmin` can do — is_staff_admin() is
-- widened rather than replaced, so all existing policies inherit it and no
-- per-table policy rewrite is needed.

-- ============================================================
-- 1. The role itself
-- ============================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('teacher', 'grade_lead', 'admin', 'superadmin'));

create or replace function public.is_superadmin()
returns boolean language sql security definer set search_path = public stable
as $$ select public.current_role() = 'superadmin' $$;

-- Widened, not replaced: every existing policy that calls is_staff_admin()
-- now admits superadmin automatically.
create or replace function public.is_staff_admin()
returns boolean language sql security definer set search_path = public stable
as $$ select public.current_role() in ('admin', 'grade_lead', 'superadmin') $$;

revoke execute on function public.is_superadmin() from anon;
grant execute on function public.is_superadmin() to authenticated;

-- ============================================================
-- 2. Role escalation guard
-- ============================================================
-- RLS cannot restrict a single column, so the boundary is a trigger.
-- Enforced only when there is a real JWT: the handle_new_user trigger and
-- the service-role runner both operate with auth.uid() null and must still
-- be able to seed and repair roles.

create or replace function public.enforce_role_change_superadmin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(public.current_role(), '') <> 'superadmin' then
    raise exception
      'Only a superadmin may change a profile role (attempted % -> %)',
      old.role, new.role
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_change_guard on public.profiles;
create trigger profiles_role_change_guard
  before update on public.profiles
  for each row execute function public.enforce_role_change_superadmin();

-- ============================================================
-- 3. School registry — foundation for multi-school
-- ============================================================
-- Deliberately scoped: this establishes the tenant list and which school a
-- person belongs to. Full tenant isolation (school_id on every table, plus
-- a school predicate in every policy) is a separate, larger migration and is
-- NOT implied by this one.

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  timezone text not null default 'Africa/Windhoek',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.schools (name, code)
values ('Swakopmund Christian Academy', 'SCA');

alter table public.profiles
  add column school_id uuid references public.schools (id) on delete set null;

update public.profiles
   set school_id = (select id from public.schools where code = 'SCA');

create index on public.profiles (school_id);

-- ============================================================
-- 4. System settings
-- ============================================================

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value, description) values
  ('academic.current_term', '"Term 3 2026"'::jsonb,
   'Term label applied to newly created classes and lesson plans.'),
  ('academic.sbg_scale_max', '4'::jsonb,
   'Top of the Standards-Based Grading scale.'),
  ('alerts.digest_enabled', 'false'::jsonb,
   'Whether the daily digest workflow may raise alerts.'),
  ('platform.multi_school_enabled', 'false'::jsonb,
   'Reserved. Tenant isolation is not implemented yet — see migration notes.');

-- ============================================================
-- 5. Audit log — append-only
-- ============================================================
-- No update or delete policy exists, so rows cannot be altered or removed
-- through the API by any role. That is the point of an audit trail.

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index on public.audit_log (created_at desc);
create index on public.audit_log (actor_id, created_at desc);

-- ============================================================
-- 6. RLS
-- ============================================================

alter table public.schools enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_log enable row level security;

-- Schools: visible to all staff, mutable only by superadmin.
create policy "schools_select" on public.schools
  for select to authenticated using (true);
create policy "schools_superadmin_write" on public.schools
  for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Settings: readable by all staff so the app can honour them; only a
-- superadmin may change platform configuration.
create policy "system_settings_select" on public.system_settings
  for select to authenticated using (true);
create policy "system_settings_superadmin_write" on public.system_settings
  for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Audit log: any authenticated actor may append their own entry; only a
-- superadmin may read it. No update/delete policy — append-only by design.
create policy "audit_log_insert_self" on public.audit_log
  for insert to authenticated
  with check (actor_id = (select auth.uid()) or actor_id is null);
create policy "audit_log_superadmin_select" on public.audit_log
  for select to authenticated
  using (public.is_superadmin());
