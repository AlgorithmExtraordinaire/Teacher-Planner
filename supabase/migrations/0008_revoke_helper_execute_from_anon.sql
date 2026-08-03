-- Revoke EXECUTE on the RLS helper functions from anonymous callers.
--
-- WHY THIS EXISTS: the architecture notes claimed `anon` was already revoked,
-- but the revoke lived only in the original database — it was never captured in
-- a migration. Provisioning a fresh project from the migration files therefore
-- left all four SECURITY DEFINER helpers callable at /rest/v1/rpc/<name>
-- without signing in. Caught by the security advisor on the new project.
--
-- `authenticated` MUST keep EXECUTE on the three policy helpers: RLS policy
-- expressions are evaluated with the querying role's privileges, so revoking
-- there would break every policy that calls is_staff_admin() or
-- current_teacher_id(). The advisor still flags those three; that is intended.
--
-- handle_new_user() is a trigger function only. The trigger fires as the table
-- owner, so no client role needs EXECUTE at all.

revoke execute on function public.current_role() from anon, public;
revoke execute on function public.current_teacher_id() from anon, public;
revoke execute on function public.is_staff_admin() from anon, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

grant execute on function public.current_role() to authenticated;
grant execute on function public.current_teacher_id() to authenticated;
grant execute on function public.is_staff_admin() to authenticated;
