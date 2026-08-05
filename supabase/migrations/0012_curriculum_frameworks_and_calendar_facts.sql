-- Standards alignment, as decided in the Knowledge Base on 5 Aug 2026.
--
-- `curriculum_standards` holds individual standard codes. It has no home for
-- the *decision* of which framework governs each subject — which is the part
-- the school has actually settled, and the part a lesson plan needs to cite.
--
-- SCA aligns to a US-only spine: CCSS governs Maths and ELA; Utah Core is the
-- named state anchor everywhere Common Core does not reach, chosen because it
-- is openly licensed and its materials are the ones already held in the school
-- Drive. NIED is retained for local registration only and is deliberately not
-- part of this alignment.

create table public.curriculum_frameworks (
  id uuid primary key default gen_random_uuid(),
  subject text not null unique,
  primary_standard text not null,
  state_anchor text,
  parent_framework text,
  source_url text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.curriculum_frameworks is
  'Which standards framework governs each subject. Source: Notion KB, Academic Programme & Curriculum, revised 5 Aug 2026.';

insert into public.curriculum_frameworks
  (subject, primary_standard, state_anchor, parent_framework, source_url, notes) values
  ('Mathematics', 'CCSS-M', 'Utah Core Mathematics (CCSS-derived)', null,
   'http://www.thecorestandards.org/',
   'EngageNY/Eureka is a direct CCSS-M implementation — no re-mapping needed.'),

  ('English Language Arts', 'CCSS-ELA', 'Utah Core ELA + Utah Supplemental Standards for ELA', null,
   'http://www.thecorestandards.org/',
   'Spectrum Language Arts is the daily programme, one workbook per grade G1-8. CKLA (K-2) and EngageNY ELA (3-8) layer on top; all three map to CCSS-ELA strands.'),

  ('Science', 'Utah SEEd (Science with Engineering Education Standards)', 'Utah SEEd', 'NGSS',
   'https://schools.utah.gov/curr/science',
   'SEEd is Utah''s NGSS implementation and is the version held in the Drive. Cite SEEd codes in lesson plans, NGSS as the parent.'),

  ('Social Studies', 'Utah Core Social Studies', 'Utah Core Social Studies — Elementary / Secondary', 'NCSS C3 Framework',
   'https://www.socialstudies.org/c3',
   'iCivics supplies civics content; the C3 Framework supplies the inquiry arc.'),

  ('Fine Arts', 'Utah Core Fine Arts', 'Utah Core Fine Arts', 'National Core Arts Standards (NCAS)',
   'https://www.nationalartsstandards.org/',
   'Covers Visual Arts, Music, Theatre and Dance. Utah Fine Arts is NCAS-derived; grade-by-grade maps already in the Drive.'),

  ('Physical Education', 'Utah Core Physical Education', 'Utah Core Physical Education', 'SHAPE America',
   'https://www.shapeamerica.org/', null),

  ('Health', 'Utah Core Health Education', 'Utah Core Health Education', null,
   'https://www.uen.org/core/',
   'Covers the Character Education / whole-child strand.'),

  ('Computer Science', 'Utah K-12 Computer Science Standards', 'Utah CS Core (K-5 and 6-12)', 'CSTA K-12 CS Standards',
   'https://www.uen.org/core/core.do?courseNum=512',
   'Corrected 5 Aug 2026. Utah''s Educational Technology (ETSA) standards cover digital citizenship only and are a supplement, not the CS standard.'),

  ('World Languages', 'Utah Core World Languages', 'Utah Core World Languages', 'ACTFL',
   'https://www.uen.org/core/',
   'Supports the 40+ language offering.');

alter table public.curriculum_frameworks enable row level security;

create policy "curriculum_frameworks_select" on public.curriculum_frameworks
  for select to authenticated using (true);
create policy "curriculum_frameworks_write" on public.curriculum_frameworks
  for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

-- ============================================================
-- Calendar facts, including a known variance
-- ============================================================
-- The KB publishes term dates, public holidays AND a total of 166 school days.
-- Generating from the dates and holidays alone yields 170. The 4-day gap is
-- almost certainly the mid-term breaks the KB says are published on
-- swakopca.com/info but does not enumerate. Recording the variance here so it
-- is visible in the platform console rather than lost in a conversation.

insert into public.system_settings (key, value, description) values
  ('academic.year_start', '"2026-02-02"'::jsonb,
   'First school day of the 2026 academic year.'),
  ('academic.year_end', '"2026-11-27"'::jsonb,
   'Last school day of the 2026 academic year.'),
  ('academic.school_days_official', '166'::jsonb,
   'School-issued total for 2026. The generated calendar currently yields 170 — see academic.calendar_variance.'),
  ('academic.calendar_variance', '"4 days"'::jsonb,
   'Generated school days (170) exceed the official count (166). Likely unlisted mid-term breaks. Mark those dates as term_break in academic_calendar to reconcile.'),
  ('academic.eureka_pacing_shortfall', '"14 days (~8%)"'::jsonb,
   'Eureka/EngageNY maths is written for a 180-day year; SCA runs 166. Compress flexible review days inside modules rather than dropping modules, and never drop a grade''s final module.')
on conflict (key) do update
  set value = excluded.value, description = excluded.description;
