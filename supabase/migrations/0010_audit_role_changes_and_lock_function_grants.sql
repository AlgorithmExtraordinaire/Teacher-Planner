-- Two fixes, both consequences of migration 0009.
--
-- 1. Role changes were not audited.
--    The escalation guard is a database trigger, so a role change made in SQL
--    never passes through the application and recordAudit() never saw it —
--    a hole in the trail exactly where oversight matters most. The trigger now
--    writes the entry itself, so every role change is captured regardless of
--    how it was made.
--
-- 2. `revoke ... from anon` did not do what it looked like it did.
--    Postgres grants EXECUTE on new functions to PUBLIC, and `anon` inherits
--    from PUBLIC, so revoking from `anon` alone left the function callable
--    anonymously via /rest/v1/rpc/. The revokes below target PUBLIC, which is
--    the grant that actually exists.

-- ============================================================
-- 1. Audit every role change, from inside the guard
-- ============================================================

create or replace function public.enforce_role_change_superadmin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null
       and coalesce(public.current_role(), '') <> 'superadmin' then
      raise exception
        'Only a superadmin may change a profile role (attempted % -> %)',
        old.role, new.role
        using errcode = '42501';
    end if;

    -- SECURITY DEFINER, so this insert is not subject to audit_log's RLS.
    -- actor_id is null when the change came from the service role or a
    -- migration rather than a signed-in user; that distinction is worth
    -- keeping rather than attributing system changes to a person.
    insert into public.audit_log (actor_id, action, entity, entity_id, detail)
    values (
      auth.uid(),
      'role.changed',
      'profiles',
      new.id::text,
      jsonb_build_object(
        'from', old.role,
        'to', new.role,
        'via', case when auth.uid() is null then 'system' else 'session' end
      )
    );
  end if;

  return new;
end;
$$;

-- ============================================================
-- 2. Lock down function execution
-- ============================================================

-- Trigger function: invoked by the trigger as its owner, so no client role
-- needs EXECUTE. Exposing it as an RPC serves no purpose.
revoke all on function public.enforce_role_change_superadmin() from public;
revoke all on function public.enforce_role_change_superadmin() from anon;
revoke all on function public.enforce_role_change_superadmin() from authenticated;

-- Policy helpers: RLS evaluates these in the caller's context, so signed-in
-- users genuinely need EXECUTE. Anonymous callers do not.
revoke all on function public.current_role() from public;
revoke all on function public.current_teacher_id() from public;
revoke all on function public.is_staff_admin() from public;
revoke all on function public.is_superadmin() from public;

revoke all on function public.current_role() from anon;
revoke all on function public.current_teacher_id() from anon;
revoke all on function public.is_staff_admin() from anon;
revoke all on function public.is_superadmin() from anon;

grant execute on function public.current_role() to authenticated;
grant execute on function public.current_teacher_id() to authenticated;
grant execute on function public.is_staff_admin() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
