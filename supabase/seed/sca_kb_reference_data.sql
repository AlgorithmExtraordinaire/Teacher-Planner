-- =====================================================================
-- SCA Teacher-Planner — reference data from the Notion Knowledge Base
--
-- Snapshot of the real school data held in the teacher-planner Supabase
-- project (nmuvtgefbswmufpineyp) as of 2026-08-01.
--
--   teachers            6
--   students           58
--   classes            45
--   class_enrollment  327  (derived — see note below)
--   curriculum_modules 18
--
-- PROVENANCE — every row below traces to the SCA Operations Hub in Notion:
--   * Staff        → "Human Resources" (staff list, Jul 2026)
--   * Learners     → "Student Results — Assessment Data (Synexis)"
--                    (58-student roster with student numbers and grades)
--   * Subjects     → "Academic Programme & Curriculum" (phases & subjects)
--   * Modules      → "Curriculum Resource Inventory 2026 — Textbooks &
--                     Teacher Guides (Maths + ELA)"
--
-- Nothing here is invented. Where the KB is silent the column is NULL
-- rather than filled with a plausible guess — see "KNOWN GAPS" at the end.
--
-- Idempotent: re-running inserts nothing new.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Teachers (6) — Human Resources page.
-- `subject` carries the register class plus teaching allocation verbatim.
-- email is NULL throughout: the KB records no staff email addresses.
-- ---------------------------------------------------------------------
INSERT INTO public.teachers (id, profile_id, full_name, email, subject, grade_band, status) VALUES
  ('60b98309-3775-4b31-a428-e2faa5dab407', NULL, 'Benestar Joseph', NULL, 'Grade 1 register — all subjects', 'Elementary (1-5)', 'active'),
  ('07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', NULL, 'Evelina Nangolo', NULL, 'Grade 4-5 register; Mathematics Gr 4-8', 'Elementary (1-5)', 'active'),
  ('65c197de-fe98-47d3-b9fe-bd0f14bfdf73', NULL, 'Merceline Hummel', NULL, 'Grade 3 register — all subjects', 'Elementary (1-5)', 'active'),
  ('2bc85691-b00e-440d-88d6-b9e7ea05b1ea', NULL, 'Namibianca Links', NULL, 'Grade 6-7 register; English Language Arts & Social Studies', 'Middle School (6-8)', 'active'),
  ('7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', NULL, 'Revaldo Gertze', NULL, 'Grade 8 register; Science & Computer Science Gr 4-8; Head of IT Operations', 'Middle School (6-8)', 'active'),
  ('c170f708-c16b-46fa-bd98-d8ec80713068', NULL, 'Yolande Links', NULL, 'Grade 2 register — all subjects; Finance Administrator', 'Elementary (1-5)', 'active')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Students (58) — Synexis roster, ordered by student number.
-- Student numbers encode the grade: 2200261xx = Grade 1 ... 2200268xx = Grade 8.
-- ---------------------------------------------------------------------
INSERT INTO public.students (id, full_name, student_number, grade_band, grade_level, status) VALUES
  ('bd580a8d-567e-4ba8-92a2-e8ce08f4826b', 'Surei Cassim', '220026101', 'Elementary (1-5)', 'Grade 1', 'active'),
  ('3019fae7-7e98-4cf0-94c4-3f6cf04ace88', 'Genesis Katowa', '220026102', 'Elementary (1-5)', 'Grade 1', 'active'),
  ('9c950a96-7815-44a4-a81b-486161fad6c0', 'Laylah Tjikusere', '220026103', 'Elementary (1-5)', 'Grade 1', 'active'),
  ('91185728-5aaf-4ad6-bd00-48943cbcf5f0', 'Chloe Nendongo', '220026105', 'Elementary (1-5)', 'Grade 1', 'active'),
  ('3ec97501-891e-4b89-85ca-c77b57a40b99', 'Jackson Werner', '220026106', 'Elementary (1-5)', 'Grade 1', 'active'),
  ('8c2cf5a7-54a1-486d-a09e-50d6d325eee2', 'Gift Christiaan', '220026107', 'Elementary (1-5)', 'Grade 1', 'active'),
  ('3ef4c586-8f91-4e0a-8667-b03276cfab51', 'Timothy Hishiko', '220026108', 'Elementary (1-5)', 'Grade 1', 'active'),
  ('af5ee6b0-f175-4353-b722-016170634edb', 'Jesse Andreas', '220026201', 'Elementary (1-5)', 'Grade 2', 'active'),
  ('4fd8f618-3f93-4b19-ab84-96b70103af55', 'Rejoice Cornelius', '220026202', 'Elementary (1-5)', 'Grade 2', 'active'),
  ('c27898d9-ade3-4e10-b2d6-119f7f6560fa', 'Amiya Izaaks', '220026203', 'Elementary (1-5)', 'Grade 2', 'active'),
  ('8bee2603-a838-41ef-b8e3-4ab0cc053ef4', 'Elijah Beukes', '220026301', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('23bf5ab0-89eb-4e2b-b318-7d5cf7566d7f', 'Sophy Christiaan', '220026302', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('93e7e7d2-8597-4f93-9607-1ffc1928bc52', 'Willean Groenewaldt', '220026303', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('e0b1e0d1-90af-4c62-87fa-9dd91d09f23e', 'Maria Jakobus', '220026304', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('b0e12bf0-838d-43e7-b130-b41e518b4c4e', 'Jay-linn Landrew', '220026305', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('976fbf99-a024-4aca-91fb-f13e173aa191', 'Malakia Nangombe', '220026306', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('5db9d4af-0b96-4582-8492-58922959828b', 'Roman Shangombe', '220026307', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('8849406f-6b5d-4170-be3f-d315ed39460d', 'Ileni Shikongo', '220026308', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('1ca7197a-6b7d-413d-9268-0eb71f355c09', 'Frans2 Uugwanga Frans', '220026309', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('a84d43f5-3666-4621-bedb-5cf3f42f8aee', 'Shishani Uushona', '220026310', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('a7cfa49b-ae12-4813-8126-774a1e3635d2', 'Joyce Werner', '220026311', 'Elementary (1-5)', 'Grade 3', 'active'),
  ('272759d8-1464-4448-a389-45027de956e6', 'Zayddie Awaras', '220026401', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('63fa40ca-1855-41b3-a39c-df0a26edd4cd', 'Susarah Goliath', '220026402', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('bccdf3b6-cefc-454d-b149-3222cb2c1d00', 'Nathaniel Isaack', '220026403', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('d312e434-fb29-410e-a644-c615b245e273', 'Reltin Izaaks', '220026404', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('81834914-6730-4c62-b99b-7f37e0a16976', 'Rayyaan Molobole', '220026405', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('1a61f065-97b9-4dfe-a343-c20597467725', 'Caylem Van Rooyen', '220026406', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('25b08a9d-9db8-48ce-8db6-41b9e21bad4e', 'Zinha Visagie', '220026407', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('80418abb-ec03-47d8-91b9-b77505e72cf8', 'Godwill Ya-Toivo', '220026408', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('b2afee10-8f19-49d5-844a-3bd8b5bd547f', 'Caleb Omole', '220026409', 'Elementary (1-5)', 'Grade 4', 'active'),
  ('b01216a2-2eed-40d6-b5f6-e202c6b5d0a9', 'Saviour Amukwaya', '220026501', 'Elementary (1-5)', 'Grade 5', 'active'),
  ('e3f6a28f-9d52-49ea-848b-a4cb991483d2', 'Azariah Links', '220026502', 'Elementary (1-5)', 'Grade 5', 'active'),
  ('4ecf943f-de1a-4561-ac4b-07655418d543', 'Talent Mavundu', '220026503', 'Elementary (1-5)', 'Grade 5', 'active'),
  ('361d312c-4fae-4901-ab9d-d5f23780c05c', 'Lincoln Shailemo', '220026504', 'Elementary (1-5)', 'Grade 5', 'active'),
  ('c266642b-bdf5-4e8d-a68c-8768b5b03602', 'Abigail Omole', '220026505', 'Elementary (1-5)', 'Grade 5', 'active'),
  ('8a7fbd35-b551-429f-855f-137dd980dc4b', 'Frans David', '220026601', 'Middle School (6-8)', 'Grade 6', 'active'),
  ('34755ccd-69e4-4294-b877-cc669cae42bf', 'Aminolf Dolian', '220026602', 'Middle School (6-8)', 'Grade 6', 'active'),
  ('60cb4f9a-0076-43d3-a0bb-66f590f2d96b', 'Brilliant Dolian', '220026603', 'Middle School (6-8)', 'Grade 6', 'active'),
  ('c3c317c7-9940-44e0-b01c-a59cab7d83c1', 'Petrus Shiyelekeni', '220026604', 'Middle School (6-8)', 'Grade 6', 'active'),
  ('c4e79b9b-2a8f-4d6a-9f94-6296370704fa', 'Iris Tsowases', '220026605', 'Middle School (6-8)', 'Grade 6', 'active'),
  ('035f707c-04ce-4c64-95ab-a1a97841c806', 'Wilhelmine Awases', '220026701', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('7962aee7-52cc-422f-8f7f-ed8c3a887b12', 'Allison Hite', '220026702', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('15929b5f-582c-4c0d-9d82-6b9a8011475e', 'Jeremia Romano', '220026703', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('4eb1fa86-834c-4bcb-82e2-d65488b6e357', 'Itaara Komomungondo', '220026704', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('ac8e6654-9b7a-4263-927b-ae6b104c5aee', 'Jamian Maart Cohen', '220026705', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('f20579a6-d432-4567-8feb-8bf999a88f13', 'Blessed Mavundu', '220026706', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('df15e9fb-d5dc-4e74-99f7-89b21ec8bd93', 'Shane-lee Mingeri', '220026709', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('4c50b7be-4aef-40d9-99d2-b7f1871e1707', 'Chriswin Pienaar', '220026710', 'Middle School (6-8)', 'Grade 7', 'active'),
  ('1000f696-48ef-4661-bdbe-5c378afa919b', 'Heinolyn Brockerhoff', '220026801', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('a2fae37a-22ec-4438-845e-b9bf342dd90f', 'Katrinag Ganases Katrina', '220026802', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('961678fa-cb14-499c-a7ad-a7872d1f6250', 'Monique Hummel', '220026803', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('21d8ee2a-4ea9-47e3-8bc3-cf92d5a958ea', 'Leandre Jooste', '220026804', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('30b0431d-f485-46b8-b688-ec5807bf7b8e', 'Given Kangomine', '220026805', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('9d8d2b46-f430-419d-a28c-6e8361830416', 'Rodeshka Schuster', '220026806', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('da2e5f22-4083-4920-be36-d0d1d17193fc', 'Christiana Witbooi', '220026807', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('7f5c2af8-75e9-4da6-bef8-7b52fcf48e10', 'Cherizahne Basson', '220026808', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('976d7390-4be4-4ded-8040-0a43a6d0b71d', 'Brihanna Hishiko', '220026809', 'Middle School (6-8)', 'Grade 8', 'active'),
  ('a36b0716-b375-473a-af8e-6251966ba132', 'Landra Sivute', '220026810', 'Middle School (6-8)', 'Grade 8', 'active')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Classes (45) — one per grade/subject offered, Term 3 2026.
-- Naming convention "Grade N — Subject" (em-dash) distinguishes real
-- classes from any seed row.
--
-- Grades 1-3 carry the four core subjects plus a Register period, taught
-- by the grade's register teacher. Grades 4-8 add Computer Science and
-- split subject teaching across specialists per the HR allocation.
--
-- teacher_id IS NULL where the KB names no one for that class — see
-- KNOWN GAPS. These are real unstaffed classes, not missing data.
-- ---------------------------------------------------------------------
INSERT INTO public.classes (id, name, subject, grade_band, grade_level, teacher_id, term) VALUES
  ('7f5a9b28-58cd-469b-b7c8-bbccfd90c184', 'Grade 1 — English Language Arts', 'English Language Arts', 'Elementary (1-5)', 'Grade 1', '60b98309-3775-4b31-a428-e2faa5dab407', 'Term 3 2026'),
  ('274a2641-09e4-492d-8543-c26c57815487', 'Grade 1 — Mathematics', 'Mathematics', 'Elementary (1-5)', 'Grade 1', '60b98309-3775-4b31-a428-e2faa5dab407', 'Term 3 2026'),
  ('a4fc7d5a-d280-47fd-8141-b81eb15e509f', 'Grade 1 — Register', 'Register', 'Elementary (1-5)', 'Grade 1', '60b98309-3775-4b31-a428-e2faa5dab407', 'Term 3 2026'),
  ('51b96fb4-5770-4b24-9b5b-40e73806a731', 'Grade 1 — Science', 'Science', 'Elementary (1-5)', 'Grade 1', '60b98309-3775-4b31-a428-e2faa5dab407', 'Term 3 2026'),
  ('c1f424b9-d672-4750-b3af-665d7ab57ec4', 'Grade 1 — Social Studies', 'Social Studies', 'Elementary (1-5)', 'Grade 1', '60b98309-3775-4b31-a428-e2faa5dab407', 'Term 3 2026'),
  ('4a942868-63a0-4975-b7ed-8b1a0389a266', 'Grade 2 — English Language Arts', 'English Language Arts', 'Elementary (1-5)', 'Grade 2', 'c170f708-c16b-46fa-bd98-d8ec80713068', 'Term 3 2026'),
  ('4b6c212c-2d28-4daf-b8e3-20b0c16819c9', 'Grade 2 — Mathematics', 'Mathematics', 'Elementary (1-5)', 'Grade 2', 'c170f708-c16b-46fa-bd98-d8ec80713068', 'Term 3 2026'),
  ('e3c2b1ba-a8ba-4255-b820-01e6446b6ce7', 'Grade 2 — Register', 'Register', 'Elementary (1-5)', 'Grade 2', 'c170f708-c16b-46fa-bd98-d8ec80713068', 'Term 3 2026'),
  ('aef98aed-50d6-4d4f-b4ea-a4c390f6b6d1', 'Grade 2 — Science', 'Science', 'Elementary (1-5)', 'Grade 2', 'c170f708-c16b-46fa-bd98-d8ec80713068', 'Term 3 2026'),
  ('d5606341-06c1-4184-9811-b00c77f773d5', 'Grade 2 — Social Studies', 'Social Studies', 'Elementary (1-5)', 'Grade 2', 'c170f708-c16b-46fa-bd98-d8ec80713068', 'Term 3 2026'),
  ('808ea01d-5247-4707-80b9-6bbac2ca5f84', 'Grade 3 — English Language Arts', 'English Language Arts', 'Elementary (1-5)', 'Grade 3', '65c197de-fe98-47d3-b9fe-bd0f14bfdf73', 'Term 3 2026'),
  ('e6e82e27-d04d-455d-a74d-a0037886f500', 'Grade 3 — Mathematics', 'Mathematics', 'Elementary (1-5)', 'Grade 3', '65c197de-fe98-47d3-b9fe-bd0f14bfdf73', 'Term 3 2026'),
  ('f1e8b656-fdf4-4047-8aa2-1875fa46bfff', 'Grade 3 — Register', 'Register', 'Elementary (1-5)', 'Grade 3', '65c197de-fe98-47d3-b9fe-bd0f14bfdf73', 'Term 3 2026'),
  ('d80265d1-a5a3-42f9-a277-4927565dc121', 'Grade 3 — Science', 'Science', 'Elementary (1-5)', 'Grade 3', '65c197de-fe98-47d3-b9fe-bd0f14bfdf73', 'Term 3 2026'),
  ('f027ec3f-7c96-486e-b397-a5c40d91ee6b', 'Grade 3 — Social Studies', 'Social Studies', 'Elementary (1-5)', 'Grade 3', '65c197de-fe98-47d3-b9fe-bd0f14bfdf73', 'Term 3 2026'),
  ('977276b1-a754-4894-b79e-dc109d0b3532', 'Grade 4 — Computer Science', 'Computer Science', 'Elementary (1-5)', 'Grade 4', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('88824ec1-0a7a-4c99-92cf-4d05b97336f7', 'Grade 4 — English Language Arts', 'English Language Arts', 'Elementary (1-5)', 'Grade 4', NULL, 'Term 3 2026'),
  ('e165d9c2-55a7-4a12-8edd-acdeb3429bbc', 'Grade 4 — Mathematics', 'Mathematics', 'Elementary (1-5)', 'Grade 4', '07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', 'Term 3 2026'),
  ('5d82cb91-3d68-4ac4-bc95-051591794d94', 'Grade 4 — Register', 'Register', 'Elementary (1-5)', 'Grade 4', '07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', 'Term 3 2026'),
  ('ed59c1e1-cfc7-4d5f-b0bf-7ba2f59ab966', 'Grade 4 — Science', 'Science', 'Elementary (1-5)', 'Grade 4', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('565a8c6b-eabd-4c33-9c40-9342bf8e587c', 'Grade 4 — Social Studies', 'Social Studies', 'Elementary (1-5)', 'Grade 4', NULL, 'Term 3 2026'),
  ('f9381396-8121-4e86-8277-8e0b6d53d33f', 'Grade 5 — Computer Science', 'Computer Science', 'Elementary (1-5)', 'Grade 5', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('95248c31-a8ef-494c-a537-9992a0463e16', 'Grade 5 — English Language Arts', 'English Language Arts', 'Elementary (1-5)', 'Grade 5', NULL, 'Term 3 2026'),
  ('80337714-d97e-46fe-bd4b-f5de56a68f1e', 'Grade 5 — Mathematics', 'Mathematics', 'Elementary (1-5)', 'Grade 5', '07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', 'Term 3 2026'),
  ('be87f249-0993-4a14-a972-071252f7ad6e', 'Grade 5 — Register', 'Register', 'Elementary (1-5)', 'Grade 5', '07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', 'Term 3 2026'),
  ('d57be02c-b790-4e1d-b07f-5ff1682cfa18', 'Grade 5 — Science', 'Science', 'Elementary (1-5)', 'Grade 5', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('1a42321d-1aeb-46d5-aa52-b46d07ed7b74', 'Grade 5 — Social Studies', 'Social Studies', 'Elementary (1-5)', 'Grade 5', NULL, 'Term 3 2026'),
  ('61fb4b2e-033e-4260-91b3-abaa26686730', 'Grade 6 — Computer Science', 'Computer Science', 'Middle School (6-8)', 'Grade 6', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('3bb8d88d-4c0f-49f1-bdea-34dd9b0793c1', 'Grade 6 — English Language Arts', 'English Language Arts', 'Middle School (6-8)', 'Grade 6', '2bc85691-b00e-440d-88d6-b9e7ea05b1ea', 'Term 3 2026'),
  ('faa753bd-d602-4cf4-b492-6ca78c04511e', 'Grade 6 — Mathematics', 'Mathematics', 'Middle School (6-8)', 'Grade 6', '07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', 'Term 3 2026'),
  ('359051df-e5c1-4cb4-b8f3-063b0815dd6e', 'Grade 6 — Register', 'Register', 'Middle School (6-8)', 'Grade 6', '2bc85691-b00e-440d-88d6-b9e7ea05b1ea', 'Term 3 2026'),
  ('5c165be1-18d0-4524-9531-178037b09846', 'Grade 6 — Science', 'Science', 'Middle School (6-8)', 'Grade 6', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('1d0964c8-c785-4de9-ad77-0a4b1fbb0412', 'Grade 6 — Social Studies', 'Social Studies', 'Middle School (6-8)', 'Grade 6', '2bc85691-b00e-440d-88d6-b9e7ea05b1ea', 'Term 3 2026'),
  ('8ae1f184-498b-48eb-9a3a-314305ccbca0', 'Grade 7 — Computer Science', 'Computer Science', 'Middle School (6-8)', 'Grade 7', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('91fce51e-56e7-4eed-967f-04f645b0cbeb', 'Grade 7 — English Language Arts', 'English Language Arts', 'Middle School (6-8)', 'Grade 7', '2bc85691-b00e-440d-88d6-b9e7ea05b1ea', 'Term 3 2026'),
  ('e7b511ab-6b9c-4b5e-b044-76e36bf88722', 'Grade 7 — Mathematics', 'Mathematics', 'Middle School (6-8)', 'Grade 7', '07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', 'Term 3 2026'),
  ('6edba612-2afd-4d15-8c43-ca388a6b5178', 'Grade 7 — Register', 'Register', 'Middle School (6-8)', 'Grade 7', '2bc85691-b00e-440d-88d6-b9e7ea05b1ea', 'Term 3 2026'),
  ('f7ea1275-612b-4b81-ba83-869a9e5a81fb', 'Grade 7 — Science', 'Science', 'Middle School (6-8)', 'Grade 7', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('4c88e8be-0820-45c6-856d-150b70498e6f', 'Grade 7 — Social Studies', 'Social Studies', 'Middle School (6-8)', 'Grade 7', '2bc85691-b00e-440d-88d6-b9e7ea05b1ea', 'Term 3 2026'),
  ('6f94ce18-4199-48cd-a586-c5a57fb829d6', 'Grade 8 — Computer Science', 'Computer Science', 'Middle School (6-8)', 'Grade 8', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('1c5d3453-a622-4b81-aca4-21a1f5ac7052', 'Grade 8 — English Language Arts', 'English Language Arts', 'Middle School (6-8)', 'Grade 8', NULL, 'Term 3 2026'),
  ('1b4d518c-0375-43bd-8336-9d8d9a45d35f', 'Grade 8 — Mathematics', 'Mathematics', 'Middle School (6-8)', 'Grade 8', '07a6ed6f-b1dc-4db1-afa9-f9b5ddbb0a32', 'Term 3 2026'),
  ('f5d4e2b8-003c-4e8e-b644-f5acecdf0df3', 'Grade 8 — Register', 'Register', 'Middle School (6-8)', 'Grade 8', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('98ac0397-5596-449d-8aa2-789f2009f71d', 'Grade 8 — Science', 'Science', 'Middle School (6-8)', 'Grade 8', '7d2da825-d5cf-4ab1-a4d9-aa7a1a299575', 'Term 3 2026'),
  ('e12f13bb-05b9-4b20-9c49-92b9ffcf4273', 'Grade 8 — Social Studies', 'Social Studies', 'Middle School (6-8)', 'Grade 8', NULL, 'Term 3 2026')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Enrolment (327) — DERIVED, not transcribed.
--
-- SCA runs whole-class grade groups: every learner takes every subject
-- offered at their grade. This statement reproduces the live table
-- exactly — 327 rows, verified equal to the grade-matched pair count.
--
-- Expressing it as a join rather than 327 UUID pairs keeps the rule
-- visible and self-correcting: add a class or a learner and re-run, and
-- enrolment stays consistent.
-- ---------------------------------------------------------------------
INSERT INTO public.class_enrollment (class_id, student_id)
SELECT c.id, s.id
  FROM public.students s
  JOIN public.classes c
    ON c.grade_level = s.grade_level
 WHERE c.name LIKE '%—%'
   AND NOT EXISTS (
       SELECT 1 FROM public.class_enrollment e
        WHERE e.class_id = c.id AND e.student_id = s.id);

-- ---------------------------------------------------------------------
-- Curriculum modules (18) — Curriculum Resource Inventory.
-- Only modules actually sighted in the school Drive are listed; the
-- inventory's "to confirm" entries are deliberately excluded.
--   EngageNY / Eureka Math .. 11   Maths, Grades 3-7
--   CKLA ..................... 6   Kindergarten Domains 7-12
--   EngageNY ELA ............. 1   Grade 3 Module 1, Units 1-3
-- `term` is NULL: the inventory maps modules to grades, not to terms.
-- ---------------------------------------------------------------------
INSERT INTO public.curriculum_modules (id, title, subject, grade_band, source, term, sequence_order) VALUES
  ('f1eee05f-3aa6-4d87-b391-883bdeadc43b', 'Grade 3 — Module 1, Units 1-3', 'English Language Arts', 'Elementary (1-5)', 'EngageNY ELA', NULL, 1),
  ('5f11a53b-f8ec-4839-a595-b27965cff74d', 'Kindergarten — Domain 7', 'English Language Arts', 'Kindergarten', 'CKLA', NULL, 7),
  ('b154e3f8-c113-4d6f-a82f-263cce7d9fa8', 'Kindergarten — Domain 8', 'English Language Arts', 'Kindergarten', 'CKLA', NULL, 8),
  ('3e257902-7e52-4a5e-9a3f-b6bc5d5c16b9', 'Kindergarten — Domain 9', 'English Language Arts', 'Kindergarten', 'CKLA', NULL, 9),
  ('858e42fc-7dc3-4688-86bf-651fc06d4d05', 'Kindergarten — Domain 10', 'English Language Arts', 'Kindergarten', 'CKLA', NULL, 10),
  ('a0cb7d30-1e89-40ef-9487-7bfe6d891c11', 'Kindergarten — Domain 11', 'English Language Arts', 'Kindergarten', 'CKLA', NULL, 11),
  ('926a0ebe-2b0f-4207-a733-3d02b7c9652a', 'Kindergarten — Domain 12', 'English Language Arts', 'Kindergarten', 'CKLA', NULL, 12),
  ('5489217f-4b2a-4789-a3cd-e4af3d383709', 'Grade 3 — Module 1', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 1),
  ('b449dd0c-1c04-48f8-9e99-dd12731e791c', 'Grade 3 — Module 2', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 2),
  ('7d832f1f-e6a9-4dc4-bb03-f9401e49e485', 'Grade 3 — Module 3', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 3),
  ('a9e998d2-8743-42f3-a197-0dc77b69cfae', 'Grade 3 — Module 4', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 4),
  ('7e635e45-eebe-474b-b6b1-ff3461fde689', 'Grade 3 — Module 5', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 5),
  ('0e69e626-8809-4554-b675-8666159a330d', 'Grade 3 — Module 6', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 6),
  ('b049e881-9160-40f6-b6ab-1243de811bab', 'Grade 3 — Module 7', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 7),
  ('b37127d2-53d7-41f8-a9e1-d51b53354482', 'Grade 4 — Module 1 (Lessons 1-18)', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 1),
  ('9bf32c3b-3874-492b-a57c-291c0284d5be', 'Grade 5 — Module 1 (Lessons 1-16)', 'Mathematics', 'Elementary (1-5)', 'EngageNY / Eureka Math', NULL, 1),
  ('ae635ad1-a85c-4415-bb1b-4a0c05d3fdc6', 'Grade 6 — Module 1 (Lessons 1-29)', 'Mathematics', 'Middle School (6-8)', 'EngageNY / Eureka Math', NULL, 1),
  ('18f91541-cd04-4e70-843d-8cbb1accf3c8', 'Grade 7 — Module 1 (Lessons 1-10)', 'Mathematics', 'Middle School (6-8)', 'EngageNY / Eureka Math', NULL, 1)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================================
-- KNOWN GAPS — the KB does not answer these. Left NULL on purpose;
-- do not fill with plausible-looking values.
--
--   * 3 of the 9 staff named in the KB are not teachers and are absent
--     here (receptionist, groundskeeper, cleaner, maintenance are
--     non-teaching; the roster of 9 in the master spreadsheet has not
--     been reconciled against the 6 teaching staff on the HR page).
--   * No teacher email addresses are recorded anywhere in the KB.
--   * ELA and Social Studies are unstaffed at Grades 4, 5 and 8 (6
--     classes). The HR allocation covers Namibianca Links for Gr 6-7
--     only; nobody is named for those grades.
--   * curriculum_standards is intentionally empty. The KB names the
--     frameworks (CCSS / NGSS / NCSS) but contains no standard codes.
--   * Learning Center (6) and GED (3) learners from the Academic
--     Inventory are not in the roster: the Synexis export covers 58
--     assessed learners, and those groups are assessed separately.
--
-- VERIFY:
--   SELECT (SELECT count(*) FROM public.teachers)           AS teachers,     -- 6
--          (SELECT count(*) FROM public.students)           AS students,     -- 58
--          (SELECT count(*) FROM public.classes)            AS classes,      -- 45
--          (SELECT count(*) FROM public.class_enrollment)   AS enrolments,   -- 327
--          (SELECT count(*) FROM public.curriculum_modules) AS modules;      -- 18
-- =====================================================================
