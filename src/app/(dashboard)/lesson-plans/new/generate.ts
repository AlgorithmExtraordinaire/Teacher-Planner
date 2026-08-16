"use server";

import { GoogleGenAI } from "@google/genai";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const MODEL = "gemini-3.1-flash-lite";

/**
 * Only these three. The school asked for the assistant to write outlines where
 * it can be held to a real standards framework — CCSS-M, CCSS-ELA and Utah
 * SEEd — and to stay out of the subjects where it would be improvising. Fine
 * Arts, PE, Health, Computer Science and Character Education have frameworks
 * recorded but no loaded standard codes, so a generated outline there would
 * cite nothing and read like authority it does not have.
 */
const SUPPORTED_SUBJECTS = ["English Language Arts", "Mathematics", "Science"];

export type Outline = {
  objective: string;
  warm_up: string;
  direct_instruction: string;
  guided_practice: string;
  independent_practice: string;
  assessment_strategy: string;
  differentiation: string;
};

export type OutlineResult =
  | { ok: true; outline: Outline; grounding: string[] }
  | { ok: false; error: string };

const FIELDS: (keyof Outline)[] = [
  "objective",
  "warm_up",
  "direct_instruction",
  "guided_practice",
  "independent_practice",
  "assessment_strategy",
  "differentiation",
];

/** Models wrap JSON in fences often enough that not handling it is a bug. */
function parseOutline(raw: string): Outline | null {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const out = {} as Outline;
    for (const f of FIELDS) {
      const v = parsed[f];
      if (typeof v !== "string" || !v.trim()) return null;
      out[f] = v.trim();
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Draft a lesson outline from the curriculum, not from the model's memory.
 *
 * Everything the model is given comes out of this database: the class, the
 * module the school actually sequenced, and the real standard codes with their
 * published descriptions. It is told to plan the teaching and to name no
 * resources, because the school's materials live in e-learning and a model
 * inventing worksheet names would send teachers looking for files that do not
 * exist.
 *
 * The result is a draft in a form the teacher edits before saving. Nothing is
 * written to the database here.
 */
export async function generateOutline(input: {
  classId: string;
  moduleId: string;
  standardCodes: string[];
  durationMinutes?: number;
}): Promise<OutlineResult> {
  await requireUser();

  if (!process.env.GEMINI_API_KEY) {
    return {
      ok: false,
      error: "The assistant is not configured on this server (no API key).",
    };
  }
  if (!input.classId || !input.moduleId) {
    return { ok: false, error: "Choose a class and a module first." };
  }

  const supabase = await createClient();

  const [{ data: cls }, { data: mod }] = await Promise.all([
    supabase
      .from("classes")
      .select("name, subject, grade_level")
      .eq("id", input.classId)
      .maybeSingle(),
    supabase
      .from("curriculum_modules")
      .select("title, subject, source, term, sequence_order")
      .eq("id", input.moduleId)
      .maybeSingle(),
  ]);

  if (!cls || !mod) return { ok: false, error: "That class or module is no longer available." };

  if (!cls.subject || !SUPPORTED_SUBJECTS.includes(cls.subject)) {
    return {
      ok: false,
      error: `Outline drafting is available for ${SUPPORTED_SUBJECTS.join(", ")} only. ${
        cls.subject ?? "This subject"
      } has no loaded standards to plan against, so anything generated would cite nothing.`,
    };
  }

  // Ground on the standards the teacher actually ticked. If they ticked none,
  // fall back to the grade's codes for this subject so the outline still cites
  // something real rather than inventing an objective.
  let standards: { code: string; description: string | null }[] = [];

  if (input.standardCodes.length > 0) {
    const { data } = await supabase
      .from("curriculum_standards")
      .select("code, description")
      .in("code", input.standardCodes)
      .limit(20);
    standards = data ?? [];
  }

  if (standards.length === 0) {
    const framework =
      cls.subject === "Mathematics"
        ? "CCSS-M"
        : cls.subject === "English Language Arts"
          ? "CCSS-ELA"
          : "Utah SEEd";
    const { data } = await supabase
      .from("curriculum_standards")
      .select("code, description")
      .eq("grade_level", cls.grade_level ?? "")
      .eq("framework", framework)
      .order("code")
      .limit(12);
    standards = data ?? [];
  }

  if (standards.length === 0) {
    return {
      ok: false,
      error: `No standards are loaded for ${cls.subject} at ${cls.grade_level ?? "this grade"}, so there is nothing to plan against.`,
    };
  }

  const standardBlock = standards
    .map((s) => `- ${s.code}: ${s.description ?? "(no description recorded)"}`)
    .join("\n");

  const prompt = `Draft a lesson outline for a teacher at Swakopmund Christian Academy.

CLASS: ${cls.name} (${cls.subject}, ${cls.grade_level ?? "grade not recorded"})
MODULE: ${mod.title}${mod.source ? ` — from ${mod.source}` : ""}${
    mod.term ? ` (${mod.term})` : ""
  }
LESSON LENGTH: ${input.durationMinutes ?? 45} minutes

STANDARDS THIS LESSON MUST ADDRESS:
${standardBlock}

Return ONLY a JSON object with exactly these string keys:
objective, warm_up, direct_instruction, guided_practice, independent_practice,
assessment_strategy, differentiation.

Rules:
- Write what the teacher DOES and what the learners DO, minute by minute where
  it helps. Concrete moves, not descriptions of good teaching.
- Cite the standard codes above inside the text where they are addressed.
- Name NO resources, worksheets, textbooks, videos or links. The school's
  materials live in a separate e-learning platform and the teacher selects them
  there. Refer to "the module materials" generically if you must refer at all.
- Differentiation must name a concrete adjustment for learners who are behind
  AND one for learners who are ahead.
- assessment_strategy must be checkable within the lesson, and must say what
  evidence tells the teacher the standard was met.
- Plain text only. No markdown, no bullets with asterisks, no headings.
- Keep each field under 150 words.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Streamed and accumulated: the same call shape the Assistant route uses,
    // so there is one proven way of talking to this SDK in the codebase.
    const stream = await ai.interactions.create({
      model: MODEL,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: [{ type: "user_input", content: [{ type: "text", text: prompt }] }] as any,
      system_instruction:
        "You write practical lesson outlines for primary and middle school teachers. You are precise about standards and never invent teaching resources.",
      store: false,
      stream: true,
    });

    let text = "";
    for await (const raw of stream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = raw as any;
      if (event.event_type === "step.delta" && event.delta?.type === "text") {
        text += String(event.delta.text ?? "");
      }
    }

    const outline = parseOutline(text);
    if (!outline) {
      return {
        ok: false,
        error:
          "The assistant returned something this form could not read. Try again — and if it keeps happening, write the outline by hand rather than waiting on it.",
      };
    }

    return { ok: true, outline, grounding: standards.map((s) => s.code) };
  } catch (e) {
    return {
      ok: false,
      error: `The assistant could not be reached: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}
