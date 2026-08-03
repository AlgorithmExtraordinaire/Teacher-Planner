-- Wrap auth.uid() as (select auth.uid()) so Postgres evaluates it once per
-- query via an InitPlan instead of once per row.
--
-- Semantics are identical; only the evaluation count changes. Without this,
-- every row scanned re-invokes auth.uid(), which is invisible at 58 learners
-- and a real cost as the roll grows.
--
-- Addresses the `auth_rls_initplan` advisor warnings.

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "agent_conversations_own" on public.agent_conversations;
create policy "agent_conversations_own" on public.agent_conversations for all to authenticated
  using (profile_id = (select auth.uid()) or public.is_staff_admin())
  with check (profile_id = (select auth.uid()));

drop policy if exists "agent_messages_own" on public.agent_messages;
create policy "agent_messages_own" on public.agent_messages for all to authenticated
  using (
    conversation_id in (select id from public.agent_conversations where profile_id = (select auth.uid()))
    or public.is_staff_admin()
  )
  with check (
    conversation_id in (select id from public.agent_conversations where profile_id = (select auth.uid()))
  );

drop policy if exists "agent_actions_select" on public.agent_actions;
create policy "agent_actions_select" on public.agent_actions for select to authenticated
  using (proposed_by = (select auth.uid()) or public.is_staff_admin());

drop policy if exists "agent_actions_insert" on public.agent_actions;
create policy "agent_actions_insert" on public.agent_actions for insert to authenticated
  with check (proposed_by = (select auth.uid()));
