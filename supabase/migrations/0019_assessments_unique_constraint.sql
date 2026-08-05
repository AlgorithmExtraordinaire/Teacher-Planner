-- Make assessments upsertable on (title, class_id).
--
-- 0018 created this as an EXPRESSION index over
-- (title, coalesce(class_id::text, 'none')). Postgres accepted it, but
-- PostgREST rejects it as an on_conflict target: on_conflict takes column
-- names, and the expression is not one. Every upsert against the table
-- returned HTTP 400.
--
-- NULLS NOT DISTINCT is what the coalesce was reaching for. Non-promotional
-- assessments (Character Education, PE, Arts, Computer Tech, Foreign
-- Language) have no class in the roster and so carry a null class_id. Under
-- default NULL semantics two such rows never conflict, so the loader would
-- insert a fresh duplicate set on every run.

drop index if exists public.assessments_unique_title_class;

alter table public.assessments
  add constraint assessments_title_class_uk unique nulls not distinct (title, class_id);
