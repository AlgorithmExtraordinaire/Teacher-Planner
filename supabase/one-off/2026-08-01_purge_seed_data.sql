-- =====================================================================
-- SCA Teacher-Planner — REMAINING STEP: purge dummy / seed rows
-- Project: teacher-planner (nmuvtgefbswmufpineyp)
--
-- All real KB data is ALREADY LOADED and verified:
--   teachers 6 · students 58 · classes 45 · class_enrollment 327
--   curriculum_modules 18
--
-- Only the DELETEs below remain — they were blocked by the agent's
-- permission classifier. Run this in the Supabase SQL editor.
-- Everything here is a seed/sample row or Moodle leftover.
-- =====================================================================

BEGIN;

-- Seed lesson plan "Multiplication Arrays Intro" (all fields blank)
DELETE FROM public.lesson_plan_resources;
DELETE FROM public.lesson_plans;

-- 3 stale alerts fired against the seed class
DELETE FROM public.system_alerts;

DELETE FROM public.pacing_monitor;

-- Seed class "Grade 3 Mathematics".
-- The 45 real classes all contain an em-dash separator ("Grade 3 — Mathematics")
-- so this predicate removes ONLY the seed row. Its enrolments cascade out first.
DELETE FROM public.class_enrollment
 WHERE class_id IN (SELECT id FROM public.classes WHERE name NOT LIKE '%—%');
DELETE FROM public.classes WHERE name NOT LIKE '%—%';

-- 2 sample CCSS standards (real codes, but seeded as examples, not a real set)
DELETE FROM public.curriculum_standards;

-- 2 invented module titles ("Multiplication & Division Foundations",
-- "Reading Comprehension Unit 1"). The 18 real modules are kept.
DELETE FROM public.curriculum_modules
 WHERE source NOT IN ('EngageNY / Eureka Math','EngageNY ELA','CKLA');

-- Moodle-derived resource tree — Moodle is no longer a source
DELETE FROM public.resource_courses;
DELETE FROM public.resource_categories;

-- Placeholder teacher "SCA Admin" / admin@sca.edu.na.
-- NOTE: the linked row in public.profiles is the REAL auth login and is
-- deliberately NOT deleted. Deleting it would lock you out.
DELETE FROM public.teachers WHERE email = 'admin@sca.edu.na';

COMMIT;

-- ---------------------------------------------------------------------
-- Verify afterwards — every count below should be 0:
-- ---------------------------------------------------------------------
-- SELECT
--   (SELECT count(*) FROM public.teachers WHERE email='admin@sca.edu.na') AS dummy_teacher,
--   (SELECT count(*) FROM public.classes WHERE name NOT LIKE '%—%')       AS dummy_class,
--   (SELECT count(*) FROM public.curriculum_standards)                    AS sample_standards,
--   (SELECT count(*) FROM public.resource_categories)                     AS moodle_categories,
--   (SELECT count(*) FROM public.lesson_plans)                            AS seed_lesson_plans;
--
-- And these should be unchanged (real data):
--   teachers 6 · students 58 · classes 45 · class_enrollment 327
--   curriculum_modules 18 · resources 4 · resource_collections 32
-- =====================================================================
