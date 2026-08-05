-- Retire lesson_plans.standards.
--
-- Migration 0016 added lesson_plan_standards and migrated any array values
-- into it by matching on code. The lesson-plan form now writes through the
-- join table and validates every code against the library before saving, so
-- nothing reads or writes this column any more.
--
-- Keeping it would leave two places to record the same fact, one of which
-- accepts typos silently and cannot be joined. Any value still present has
-- already been migrated where its code resolved.

alter table public.lesson_plans drop column if exists standards;
