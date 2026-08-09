/**
 * Lesson-plan autofill, derived from the curriculum module the teacher picks.
 *
 * WHAT IS FILLED AND WHAT IS NOT
 *
 * Two kinds of field live on a lesson plan and they deserve different
 * treatment:
 *
 *   FACTUAL — title, source, textbook, standards, pacing. These come out of
 *   curriculum_modules and curriculum_standards and are filled completely.
 *   Making a teacher retype "EngageNY / Eureka Math" is pure friction.
 *
 *   INSTRUCTIONAL — warm-up, direct instruction, guided and independent
 *   practice, assessment, differentiation. These are filled with a scaffold
 *   that NAMES THE MODULE'S CONTENT and prompts the teacher, not with
 *   invented lesson text.
 *
 * The second choice is deliberate and worth defending. Generating plausible
 * instructional prose would produce plans that look finished and say nothing;
 * a hollow plan that reads as complete is worse than an empty one, because
 * nobody reviews it. The scaffolds carry the module's actual content so the
 * teacher starts from their material rather than a blank box.
 *
 * STANDARDS ARE SUGGESTED, NEVER ASSERTED
 *
 * There is no stored module-to-standard mapping in the Knowledge Base. The
 * domain hints below are keyword heuristics over module titles, and they are
 * surfaced as PRE-FILTERED SUGGESTIONS the teacher confirms. Auto-attaching
 * standards from a guess would manufacture curriculum alignment — the exact
 * failure the standards library was rebuilt to prevent.
 */

export type CurriculumModule = {
  id: string;
  title: string;
  subject: string | null;
  grade_level: string | null;
  sequence_order: number | null;
  planned_days: number | null;
  source: string | null;
  source_url: string | null;
};

export type PlanTier = "annual" | "term" | "monthly" | "weekly" | "daily";

/**
 * CCSS domain names exactly as they appear in curriculum_standards.domain.
 *
 * Word boundaries are not decoration. Without \b, "Ope-ratio-ns" matches
 * /ratio/ and every module whose title ends "and Operations" — which is most
 * of Eureka — gets tagged Ratios & Proportional Relationships, a domain that
 * does not exist below Grade 6. "Addition" inside "Additional" is the same
 * trap. Substring matching over human-written titles is how a suggestion
 * engine quietly starts lying.
 */
const MATH_DOMAIN_HINTS: [RegExp, string][] = [
  [/fraction|decimal/i, "Numbers & Operations - Fractions"],
  [/place value|rounding|base ten|multi-digit|\baddition\b|\bsubtraction\b/i, "Number & Operations in Base Ten"],
  [/measurement|unit conversion|angle measure|\bdata\b|\btime\b|money|volume|\bmass\b/i, "Measurement & Data"],
  [/\bangles?\b|plane figure|geometry|\bshapes?\b|symmetry|coordinate/i, "Geometry"],
  [/multiplication|division|algebraic|pattern|word problem|expression|equation/i, "Operations & Algebraic Thinking"],
  [/\bratios?\b|\bproportion/i, "Ratios & Proportional Relationships"],
  [/statistic|probability/i, "Statistics & Probability"],
  [/counting|cardinality/i, "Counting & Cardinality"],
];

const ELA_DOMAIN_HINTS: [RegExp, string][] = [
  [/phonic|fluency|decod|phonem|foundational/i, "Reading: Foundational Skills"],
  [/inform|research|nonfiction|non-fiction|expositor/i, "Reading: Informational Text"],
  [/literature|story|stories|poem|poetry|narrative text|fiction|novel/i, "Reading: Literature"],
  [/writ|essay|compos|opinion|argument|narrative/i, "Writing"],
  [/speak|listen|discuss|present|collaborat/i, "Speaking & Listening"],
  [/grammar|vocabular|language|convention|spelling/i, "Language"],
];

/**
 * Domains suggested by a module title. Empty is a valid answer and means
 * "no confident guess" — the form then offers the whole grade rather than
 * silently narrowing to something wrong.
 */
export function suggestedDomains(
  moduleTitle: string,
  subject: string | null,
): string[] {
  const table =
    subject === "Mathematics"
      ? MATH_DOMAIN_HINTS
      : subject === "English Language Arts"
        ? ELA_DOMAIN_HINTS
        : [];

  const hits = table.filter(([re]) => re.test(moduleTitle)).map(([, d]) => d);
  return [...new Set(hits)];
}

const ordinal = (n: number) => `Module ${n}`;

/** "Mathematics · Grade 4 · Module 2 — Unit Conversions and Problem Solving" */
export function buildTitle(m: CurriculumModule): string {
  const parts = [m.subject, m.grade_level].filter(Boolean).join(" · ");
  const unit = m.sequence_order ? ` · ${ordinal(m.sequence_order)}` : "";
  return `${parts}${unit} — ${m.title}`;
}

/**
 * Pacing note. planned_days is the module's full length; a daily plan is one
 * lesson inside it, so the wording must not imply the whole module happens
 * in a day.
 */
function pacing(m: CurriculumModule, tier: PlanTier): string {
  if (!m.planned_days) return "";
  const total = `${m.planned_days} instructional day${m.planned_days === 1 ? "" : "s"}`;
  return tier === "daily"
    ? `One lesson within a module of ${total}.`
    : `Module allocation: ${total}.`;
}

export type AutofilledPlan = {
  title: string;
  objective: string;
  materials: string;
  warm_up: string;
  direct_instruction: string;
  guided_practice: string;
  independent_practice: string;
  assessment_strategy: string;
  differentiation: string;
};

export function buildPlan(
  m: CurriculumModule,
  tier: PlanTier,
): AutofilledPlan {
  const content = m.title;
  const pace = pacing(m, tier);

  const materials = [
    m.source ? `Programme: ${m.source}` : null,
    m.subject && m.grade_level ? `${m.grade_level} ${m.subject}` : null,
    m.sequence_order ? ordinal(m.sequence_order) : null,
    m.source_url,
    pace,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: buildTitle(m),
    objective: `Learners will be able to — [complete the verb and criterion] — within ${content}.`,
    materials,
    warm_up: `Retrieval practice on the prior lesson, then a short entry task that surfaces what learners already know about ${content}.`,
    direct_instruction: `I DO — model the core procedure or concept from ${content}. Work one worked example aloud, making the reasoning visible.`,
    guided_practice: `WE DO — work through examples together, releasing responsibility gradually. Check for understanding before moving on.`,
    independent_practice: `YOU DO — learners practise independently. Circulate and note who is stuck and where.`,
    assessment_strategy: `Exit ticket tied to the objective above. [State the success criterion — what does a correct response look like?]`,
    differentiation: `Support: [scaffold, e.g. concrete materials, worked example, sentence stems].\nExtension: [challenge for learners who finish early].`,
  };
}

/** Fields that carry a bracketed prompt the teacher is expected to replace. */
export const PROMPTED_FIELDS = [
  "objective",
  "assessment_strategy",
  "differentiation",
] as const;

/** True when generated scaffolding was left unedited. */
export function hasUnresolvedPrompts(value: string): boolean {
  return /\[[^\]]+\]/.test(value);
}
