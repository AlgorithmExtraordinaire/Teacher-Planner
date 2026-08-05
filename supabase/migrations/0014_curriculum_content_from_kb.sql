-- Curriculum content, transcribed from the Notion Knowledge Base.
--
-- Sources, all revised 5 Aug 2026:
--   Year Planners → SCA Academic Calendar 2026
--   Curriculum Resource Inventory 2026 — Textbooks & Teacher Guides
--   Academic Programme & Curriculum → Standards alignment
--
-- Verification performed before loading: the KB states every Eureka grade
-- totals 180 days (Pre-K 177). Summing planned_days per grade after this
-- migration reproduces exactly that, which is the check that the module
-- titles and day counts were transcribed correctly.
--
-- Idempotent: the module map upserts on (subject, grade_level,
-- sequence_order), so re-running a corrected map updates in place rather than
-- duplicating or requiring a destructive reload.

-- ============================================================
-- 1. Eureka / EngageNY Mathematics — full module map, PK-8
-- ============================================================
insert into public.curriculum_modules
  (subject, grade_level, grade_band, source, sequence_order, planned_days, title, source_url)
values
 ('Mathematics','Pre-Kindergarten','Kindergarten','EngageNY / Eureka Math',1,45,'Counting to 5','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Pre-Kindergarten','Kindergarten','EngageNY / Eureka Math',2,12,'Shapes','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Pre-Kindergarten','Kindergarten','EngageNY / Eureka Math',3,50,'Counting to 10','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Pre-Kindergarten','Kindergarten','EngageNY / Eureka Math',4,35,'Comparison of Length, Weight, Capacity, and Numbers to 5','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Pre-Kindergarten','Kindergarten','EngageNY / Eureka Math',5,35,'Addition and Subtraction Stories and Counting to 20','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Kindergarten','Kindergarten','EngageNY / Eureka Math',1,43,'Numbers to 10','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Kindergarten','Kindergarten','EngageNY / Eureka Math',2,12,'Two-Dimensional and Three-Dimensional Shapes','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Kindergarten','Kindergarten','EngageNY / Eureka Math',3,38,'Comparison of Length, Weight, Capacity, and Numbers to 10','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Kindergarten','Kindergarten','EngageNY / Eureka Math',4,47,'Number Pairs, Addition and Subtraction to 10','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Kindergarten','Kindergarten','EngageNY / Eureka Math',5,30,'Numbers 10-20 and Counting to 100','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Kindergarten','Kindergarten','EngageNY / Eureka Math',6,10,'Analyzing, Comparing, and Composing Shapes','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 1','Elementary (1-5)','EngageNY / Eureka Math',1,45,'Sums and Differences to 10','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 1','Elementary (1-5)','EngageNY / Eureka Math',2,35,'Introduction to Place Value Through Addition and Subtraction Within 20','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 1','Elementary (1-5)','EngageNY / Eureka Math',3,15,'Ordering and Comparing Length Measurements as Numbers','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 1','Elementary (1-5)','EngageNY / Eureka Math',4,35,'Place Value, Comparison, Addition and Subtraction to 40','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 1','Elementary (1-5)','EngageNY / Eureka Math',5,15,'Identifying, Composing, and Partitioning Shapes','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 1','Elementary (1-5)','EngageNY / Eureka Math',6,35,'Place Value, Comparison, Addition and Subtraction to 100','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',1,10,'Sums and Differences to 100','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',2,12,'Addition and Subtraction of Length Units','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',3,25,'Place Value, Counting, and Comparison of Numbers to 1,000','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',4,35,'Addition and Subtraction Within 200 with Word Problems to 100','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',5,24,'Addition and Subtraction Within 1,000 with Word Problems to 100','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',6,24,'Foundations of Multiplication and Division','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',7,30,'Problem Solving with Length, Money, and Data','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 2','Elementary (1-5)','EngageNY / Eureka Math',8,20,'Time, Shapes, and Fractions as Equal Parts of Shapes','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 3','Elementary (1-5)','EngageNY / Eureka Math',1,25,'Properties of Multiplication and Division and Solving Problems with Units of 2-5 and 10','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 3','Elementary (1-5)','EngageNY / Eureka Math',2,25,'Place Value and Problem Solving with Units of Measure','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 3','Elementary (1-5)','EngageNY / Eureka Math',3,25,'Multiplication and Division with Units of 0, 1, 6-9, and Multiples of 10','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 3','Elementary (1-5)','EngageNY / Eureka Math',4,20,'Multiplication and Area','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 3','Elementary (1-5)','EngageNY / Eureka Math',5,35,'Fractions as Numbers on the Number Line','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 3','Elementary (1-5)','EngageNY / Eureka Math',6,10,'Collecting and Displaying Data','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 3','Elementary (1-5)','EngageNY / Eureka Math',7,40,'Geometry and Measurement Word Problems','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 4','Elementary (1-5)','EngageNY / Eureka Math',1,25,'Place Value, Rounding, and Algorithms for Addition and Subtraction','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 4','Elementary (1-5)','EngageNY / Eureka Math',2,7,'Unit Conversions and Problem Solving with Metric Measurement','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 4','Elementary (1-5)','EngageNY / Eureka Math',3,43,'Multi-Digit Multiplication and Division','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 4','Elementary (1-5)','EngageNY / Eureka Math',4,20,'Angle Measure and Plane Figures','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 4','Elementary (1-5)','EngageNY / Eureka Math',5,45,'Fraction Equivalence, Ordering, and Operations','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 4','Elementary (1-5)','EngageNY / Eureka Math',6,20,'Decimal Fractions','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 4','Elementary (1-5)','EngageNY / Eureka Math',7,20,'Exploring Measurement with Multiplication','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 5','Elementary (1-5)','EngageNY / Eureka Math',1,20,'Place Value and Decimal Fractions','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 5','Elementary (1-5)','EngageNY / Eureka Math',2,35,'Multi-Digit Whole Number and Decimal Fraction Operations','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 5','Elementary (1-5)','EngageNY / Eureka Math',3,22,'Addition and Subtraction of Fractions','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 5','Elementary (1-5)','EngageNY / Eureka Math',4,38,'Multiplication and Division of Fractions and Decimal Fractions','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 5','Elementary (1-5)','EngageNY / Eureka Math',5,25,'Addition and Multiplication with Volume and Area','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 5','Elementary (1-5)','EngageNY / Eureka Math',6,40,'Problem Solving with the Coordinate Plane','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 6','Middle School (6-8)','EngageNY / Eureka Math',1,35,'Ratios and Unit Rates','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 6','Middle School (6-8)','EngageNY / Eureka Math',2,25,'Arithmetic Operations Including Division of Fractions','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 6','Middle School (6-8)','EngageNY / Eureka Math',3,25,'Rational Numbers','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 6','Middle School (6-8)','EngageNY / Eureka Math',4,45,'Expressions and Equations','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 6','Middle School (6-8)','EngageNY / Eureka Math',5,25,'Area, Surface Area, and Volume Problems','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 6','Middle School (6-8)','EngageNY / Eureka Math',6,25,'Statistics','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 7','Middle School (6-8)','EngageNY / Eureka Math',1,30,'Ratios and Proportional Relationships','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 7','Middle School (6-8)','EngageNY / Eureka Math',2,30,'Rational Numbers','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 7','Middle School (6-8)','EngageNY / Eureka Math',3,35,'Expressions and Equations','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 7','Middle School (6-8)','EngageNY / Eureka Math',4,25,'Percent and Proportional Relationships','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 7','Middle School (6-8)','EngageNY / Eureka Math',5,25,'Statistics and Probability','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 7','Middle School (6-8)','EngageNY / Eureka Math',6,35,'Geometry','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 8','Middle School (6-8)','EngageNY / Eureka Math',1,20,'Integer Exponents and Scientific Notation','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 8','Middle School (6-8)','EngageNY / Eureka Math',2,25,'The Concept of Congruence','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 8','Middle School (6-8)','EngageNY / Eureka Math',3,25,'Similarity','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 8','Middle School (6-8)','EngageNY / Eureka Math',4,40,'Linear Equations','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 8','Middle School (6-8)','EngageNY / Eureka Math',5,15,'Examples of Functions from Geometry','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 8','Middle School (6-8)','EngageNY / Eureka Math',6,20,'Linear Functions','https://archive.org/details/engageny-mathematics-archive'),
 ('Mathematics','Grade 8','Middle School (6-8)','EngageNY / Eureka Math',7,35,'Introduction to Irrational Numbers Using Geometry','https://archive.org/details/engageny-mathematics-archive')
on conflict (subject, grade_level, sequence_order) do update
  set title = excluded.title, planned_days = excluded.planned_days,
      grade_band = excluded.grade_band, source = excluded.source,
      source_url = excluded.source_url;

-- ============================================================
-- 2. Utah SEEd science strands, K-8
-- ============================================================
-- Codes run Grade.Strand.Standard (e.g. K.2.4). These are the strand
-- headings — the level teachers cite in a lesson plan.
insert into public.curriculum_standards (code, framework, subject, grade_band, description) values
 ('K.1','Utah SEEd','Science','Kindergarten','Weather Patterns'),
 ('K.2','Utah SEEd','Science','Kindergarten','Living Things and Their Surroundings'),
 ('K.3','Utah SEEd','Science','Kindergarten','Forces, Motion, and Interactions'),
 ('1.1','Utah SEEd','Science','Grade 1','Seasons and Space Patterns'),
 ('1.2','Utah SEEd','Science','Grade 1','The Needs of Living Things and Their Offspring'),
 ('1.3','Utah SEEd','Science','Grade 1','Light and Sound'),
 ('2.1','Utah SEEd','Science','Grade 2','Changes in the Earth''s Surface'),
 ('2.2','Utah SEEd','Science','Grade 2','Living Things and Their Habitats'),
 ('2.3','Utah SEEd','Science','Grade 2','Properties of Matter'),
 ('3.1','Utah SEEd','Science','Grade 3','Weather and Climate Patterns'),
 ('3.2','Utah SEEd','Science','Grade 3','Effects of Traits on Survival'),
 ('3.3','Utah SEEd','Science','Grade 3','Force Affects Motion'),
 ('4.1','Utah SEEd','Science','Grade 4','Organisms Functioning in Their Environment'),
 ('4.2','Utah SEEd','Science','Grade 4','Energy Transfer'),
 ('4.3','Utah SEEd','Science','Grade 4','Wave Patterns'),
 ('4.4','Utah SEEd','Science','Grade 4','Observable Patterns in the Sky'),
 ('5.1','Utah SEEd','Science','Grade 5','Characteristics and Interactions of Earth''s Systems'),
 ('5.2','Utah SEEd','Science','Grade 5','Properties and Changes of Matter'),
 ('5.3','Utah SEEd','Science','Grade 5','Cycling of Matter in Ecosystems'),
 ('6.1','Utah SEEd','Science','Grade 6','Structure and Motion Within the Solar System'),
 ('6.2','Utah SEEd','Science','Grade 6','Energy Affects Matter'),
 ('6.3','Utah SEEd','Science','Grade 6','Earth''s Weather Patterns and Climate'),
 ('6.4','Utah SEEd','Science','Grade 6','Stability and Change in Ecosystems'),
 ('7.1','Utah SEEd','Science','Grade 7','Forces Are Interactions Between Matter'),
 ('7.2','Utah SEEd','Science','Grade 7','Changes to Earth Over Time'),
 ('7.3','Utah SEEd','Science','Grade 7','Structure and Function of Life'),
 ('7.4','Utah SEEd','Science','Grade 7','Reproduction and Inheritance'),
 ('7.5','Utah SEEd','Science','Grade 7','Changes in Species Over Time'),
 ('8.1','Utah SEEd','Science','Grade 8','Matter and Energy Interact in the Physical World'),
 ('8.2','Utah SEEd','Science','Grade 8','Energy Is Stored and Transferred in Physical Systems'),
 ('8.3','Utah SEEd','Science','Grade 8','Life Systems Store and Transfer Matter and Energy'),
 ('8.4','Utah SEEd','Science','Grade 8','Interactions With Natural Systems and Resources');

-- ============================================================
-- 3. Programmes in use
-- ============================================================
insert into public.curriculum_programmes (subject, programme, governing_standard, grades, status, is_daily, notes) values
 ('Mathematics','EngageNY / Eureka Math — A Story of Units (PK-5), A Story of Ratios (6-8)','CCSS-M','1-8','adopted',false,'Student and teacher editions in Drive.'),
 ('English Language Arts','Spectrum Language Arts — one workbook per grade','CCSS-ELA (Language & Writing strands)','1-8','adopted',true,'The daily ELA spine at SCA. All 8 grade workbooks confirmed; answer key bound into each workbook.'),
 ('English Language Arts','CKLA — Core Knowledge Language Arts','CCSS-ELA (Reading Foundational + Knowledge)','K-2','partial',false,'Runs alongside daily Spectrum. K partial (Domains D7-D12); G1-2 to confirm.'),
 ('English Language Arts','EngageNY ELA — modules and novels','CCSS-ELA (Reading, Writing, Speaking & Listening)','3-8','partial',false,'Runs alongside daily Spectrum. G3 M1 confirmed; G4-8 to confirm.'),
 ('Science','Utah SEEd standards + Utah OER SEEd student textbooks','Utah SEEd (NGSS-derived)','K-8','source_secured',false,'Free textbooks identified at UEN eMedia; download and filing pending. Texts are student reference only — no labs or assessments.'),
 ('Social Studies','iCivics + Granite SD Social Studies maps','Utah Core Social Studies · NCSS C3','1-8','partial',false,'Programme present; per-grade folders thin. Granite maps supply the missing scope and sequence.'),
 ('Visual Arts','Utah Core Fine Arts curriculum maps','Utah Core Fine Arts · NCAS','K-8','adopted',false,'Per-grade maps confirmed in Drive.'),
 ('Music','Utah Core Fine Arts curriculum maps','Utah Core Fine Arts · NCAS','K-8','to_confirm',false,'Structure mirrors Visual Arts.'),
 ('Theatre','Utah Core Fine Arts curriculum maps','Utah Core Fine Arts · NCAS','K-8','to_confirm',false,null),
 ('Physical Education','Utah Core PE curriculum maps','Utah Core PE · SHAPE America','K-8','to_confirm',false,null),
 ('Health','Utah Core Health Education maps','Utah Core Health','K-8','to_confirm',false,'Covers Character Education. Folder present, not yet opened.'),
 ('Computer Science','Code.org CS Fundamentals (K-5) + CS Discoveries (6-8)','Utah K-12 Computer Science Core · CSTA','1-8','source_secured',false,'Free full course identified; class sections to be set up.')
on conflict (subject, programme) do nothing;

-- ============================================================
-- 4. Master source library — the acquisition list
-- ============================================================
-- Every entry is free and openly licensed. `priority` follows the KB's
-- acquisition checklist: 1 is the largest single gap (science textbooks).
insert into public.curriculum_sources (name, category, provides, url, licence, priority) values
 ('EngageNY / Eureka Math archive','Core academic','Full student and teacher editions, every module, every lesson, PK-8','https://archive.org/details/engageny-mathematics-archive','CC BY-NC-SA',2),
 ('EngageNY ELA archive','Core academic','Complete modules, units, lessons, teacher guides and assessments, G3-8','https://archive.org/details/engageny-ela-archive','CC BY-NC-SA',3),
 ('CKLA — Core Knowledge Language Arts','Core academic','Anthologies, Flip Books, Image Cards, teacher guides, scope and sequence, K-5','https://www.coreknowledge.org/ckla-files/','CC',4),
 ('Utah OER SEEd Science Textbooks','Core academic','One student textbook per grade, K-8, PDF and print-ready','https://emedia.uen.org/curated-collections/108','CC',1),
 ('iCivics','Core academic','Lesson plans, games and primary-source sets for civics','https://www.icivics.org/','Free',6),
 ('Code.org — CS Fundamentals and CS Discoveries','Core academic','Full course, lesson plans, unplugged activities, teacher dashboard','https://code.org/educate/curriculum/elementary-school','Free',5),
 ('CommonLit','Reading','Levelled reading passages G3-12 with questions','https://www.commonlit.org/','Free',6),
 ('ReadWorks','Reading','Non-fiction passages K-8 with comprehension sets and audio','https://www.readworks.org/','Free',6),
 ('Project Gutenberg','Reading','Public-domain set novels and classics','https://www.gutenberg.org/','Public domain',8),
 ('Core Knowledge Read-Alouds','Reading','Text sets matched to CKLA domains','https://www.coreknowledge.org/','CC',8),
 ('Utah Core Standards — all subjects index','Standards','Standards index for every Utah-anchored subject','https://www.uen.org/core/','Open',7),
 ('Utah SEEd Science Standards K-8','Standards','Full K-8 science standards document','https://schools.utah.gov/curr/science','Open',7),
 ('Utah Computer Science Core K-5','Standards','Computer science standards, K-5','https://www.uen.org/core/core.do?courseNum=512','Open',7),
 ('Utah Computer Science Core 6-12','Standards','Computer science standards, 6-12','https://www.uen.org/core/core.do?courseNum=612','Open',7),
 ('Granite SD Curriculum Maps','Standards','Year-at-a-Glance maps K-8 across all Utah-anchored subjects','https://www.graniteschools.org/','Open',7),
 ('CCSS — Math and ELA','Standards','Common Core State Standards','http://www.thecorestandards.org/','Open',7),
 ('NGSS','Standards','Parent framework to Utah SEEd','https://www.nextgenscience.org/','Open',8),
 ('NCSS C3 Framework','Standards','Inquiry arc for social studies','https://www.socialstudies.org/c3','Open',8),
 ('National Core Arts Standards','Standards','Parent framework to Utah Core Fine Arts','https://www.nationalartsstandards.org/','Open',8),
 ('SHAPE America','Standards','Parent framework to Utah Core PE','https://www.shapeamerica.org/','Open',8),
 ('CSTA K-12 CS Standards','Standards','Parent framework to Utah CS Core','https://www.csteachers.org/k12standards/','Open',8)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- VERIFY: every Eureka grade should total 180 days (Pre-K 177).
--   select grade_level, count(*), sum(planned_days)
--     from public.curriculum_modules where subject='Mathematics'
--    group by grade_level;
-- ---------------------------------------------------------------------
