"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  createLessonPlan,
  standardsForModule,
  type StandardOption,
} from "@/app/(dashboard)/lesson-plans/new/actions";
import {
  buildPlan,
  suggestedDomains,
  hasUnresolvedPrompts,
  type CurriculumModule,
  type PlanTier,
} from "@/lib/curriculum/autofill";

type ClassOption = {
  id: string;
  name: string;
  subject: string | null;
  grade_level: string | null;
};

const TIERS = ["annual", "term", "monthly", "weekly", "daily"] as const;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-body">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

const inputClass =
  "rounded-md border border-line px-3 py-2 text-sm focus:border-crimson focus:outline-none";

const EMPTY = {
  title: "",
  objective: "",
  materials: "",
  warm_up: "",
  direct_instruction: "",
  guided_practice: "",
  independent_practice: "",
  assessment_strategy: "",
  differentiation: "",
};

export function LessonPlanForm({
  classes,
  modules,
}: {
  classes: ClassOption[];
  modules: CurriculumModule[];
}) {
  const [state, action, pending] = useActionState(createLessonPlan, undefined);

  const [classId, setClassId] = useState("");
  const [tier, setTier] = useState<PlanTier>("daily");
  const [moduleId, setModuleId] = useState("");
  const [fields, setFields] = useState(EMPTY);
  const [standards, setStandards] = useState<StandardOption[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loadingStandards, startLoading] = useTransition();

  const selectedClass = classes.find((c) => c.id === classId) ?? null;

  // Modules are filtered by the class's subject AND grade. Before a class is
  // chosen there is nothing sensible to offer, so the control stays disabled
  // rather than listing all 71 modules across every grade.
  const availableModules = useMemo(() => {
    if (!selectedClass) return [];
    return modules
      .filter(
        (m) =>
          m.subject === selectedClass.subject &&
          m.grade_level === selectedClass.grade_level,
      )
      .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0));
  }, [modules, selectedClass]);

  const set = (k: keyof typeof EMPTY, v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  function applyModule(id: string) {
    setModuleId(id);
    setPicked(new Set());
    setStandards([]);

    const m = availableModules.find((x) => x.id === id);
    if (!m) {
      setFields(EMPTY);
      return;
    }

    setFields(buildPlan(m, tier));

    const domains = suggestedDomains(m.title, m.subject);
    startLoading(async () => {
      const rows = await standardsForModule(m.subject, m.grade_level, domains);
      setStandards(rows);
      // Suggestions are surfaced, not applied. Nothing is ticked for the
      // teacher — attaching standards from a keyword guess would fabricate
      // curriculum alignment.
      setPicked(new Set());
    });
  }

  function onTierChange(next: PlanTier) {
    setTier(next);
    const m = availableModules.find((x) => x.id === moduleId);
    // Pacing wording differs between a daily lesson and a whole module, so
    // regenerate — but only while the text is still untouched scaffolding.
    if (m && hasUnresolvedPrompts(fields.objective)) setFields(buildPlan(m, next));
  }

  const toggle = (code: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const suggestedCount = standards.filter((s) => s.suggested).length;
  const noModules = Boolean(selectedClass) && availableModules.length === 0;

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      {/* ---------------------------------------------- 1. what is being planned */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Class">
          <select
            name="class_id"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setModuleId("");
              setStandards([]);
              setPicked(new Set());
              setFields(EMPTY);
            }}
            className={inputClass}
          >
            <option value="">— Select a class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Planning tier">
          <select
            name="tier"
            required
            value={tier}
            onChange={(e) => onTierChange(e.target.value as PlanTier)}
            className={inputClass}
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Curriculum module"
        hint={
          !selectedClass
            ? "Choose a class first — modules are filtered to its subject and grade."
            : noModules
              ? undefined
              : "Selecting a module fills the title, materials and lesson structure below, and loads the standards for this grade."
        }
      >
        <select
          name="curriculum_module_id"
          value={moduleId}
          disabled={!selectedClass || noModules}
          onChange={(e) => applyModule(e.target.value)}
          className={`${inputClass} disabled:opacity-50`}
        >
          <option value="">
            {selectedClass ? "— Select a module —" : "— Select a class first —"}
          </option>
          {availableModules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.sequence_order ? `Module ${m.sequence_order}: ` : ""}
              {m.title}
              {m.planned_days ? ` (${m.planned_days}d)` : ""}
            </option>
          ))}
        </select>
      </Field>

      {/* The Knowledge Base has Eureka modules for Mathematics across every
          grade, but ELA only for Kindergarten and Grade 3, and none at all for
          Science or Social Studies. Saying so is better than an empty dropdown
          that reads as a broken feature. */}
      {noModules && (
        <p className="notice">
          No curriculum modules are loaded for {selectedClass?.grade_level}{" "}
          {selectedClass?.subject} yet, so autofill is unavailable for this
          class. The fields below still work — fill them in directly, and
          standards can be added by code.
        </p>
      )}

      {/* ---------------------------------------------------- 2. the plan itself */}
      <Field label="Title">
        <input
          name="title"
          required
          value={fields.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Lesson date">
        <input type="date" name="lesson_date" className={inputClass} />
      </Field>

      <Field
        label="Objective"
        hint="Replace the bracketed prompt — this is the one field autofill cannot write for you."
      >
        <textarea
          name="objective"
          rows={2}
          value={fields.objective}
          onChange={(e) => set("objective", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Materials">
        <textarea
          name="materials"
          rows={3}
          value={fields.materials}
          onChange={(e) => set("materials", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Warm-up">
        <textarea
          name="warm_up"
          rows={2}
          value={fields.warm_up}
          onChange={(e) => set("warm_up", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Direct instruction">
        <textarea
          name="direct_instruction"
          rows={3}
          value={fields.direct_instruction}
          onChange={(e) => set("direct_instruction", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Guided practice">
        <textarea
          name="guided_practice"
          rows={3}
          value={fields.guided_practice}
          onChange={(e) => set("guided_practice", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Independent practice">
        <textarea
          name="independent_practice"
          rows={3}
          value={fields.independent_practice}
          onChange={(e) => set("independent_practice", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Assessment strategy">
        <textarea
          name="assessment_strategy"
          rows={2}
          value={fields.assessment_strategy}
          onChange={(e) => set("assessment_strategy", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Differentiation">
        <textarea
          name="differentiation"
          rows={3}
          value={fields.differentiation}
          onChange={(e) => set("differentiation", e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* ------------------------------------------------------- 3. standards */}
      <Field label="Standards addressed">
        {loadingStandards && (
          <p className="text-xs text-muted">Loading standards…</p>
        )}

        {!loadingStandards && standards.length === 0 && (
          <input
            name="standards"
            placeholder="e.g. 4.NF.A.1, RL.4.2"
            spellCheck={false}
            className={`${inputClass} font-mono`}
          />
        )}

        {standards.length > 0 && (
          <>
            <p className="text-xs text-muted">
              {suggestedCount > 0 ? (
                <>
                  <strong>{suggestedCount}</strong> standard
                  {suggestedCount === 1 ? " is" : "s are"} marked{" "}
                  <em>suggested</em> because the module title matches their
                  domain. That is a keyword guess, not a published mapping —
                  tick what this lesson actually covers.
                </>
              ) : (
                <>
                  Showing every {selectedClass?.grade_level} standard for this
                  subject. Tick what this lesson covers.
                </>
              )}
            </p>

            <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-line">
              {standards.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-start gap-3 border-b border-line px-3 py-2 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    name="standards"
                    value={s.code}
                    checked={picked.has(s.code)}
                    onChange={() => toggle(s.code)}
                    className="mt-1"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <code className="font-mono text-xs font-semibold">
                        {s.code}
                      </code>
                      {s.suggested && (
                        <span className="badge badge--amber text-[10px]">
                          suggested
                        </span>
                      )}
                    </span>
                    {s.description && (
                      <span className="text-xs text-muted">
                        {s.description}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-1 text-xs text-muted">
              {picked.size} selected. Codes are re-checked against the library
              on save.
            </p>
          </>
        )}
      </Field>

      {state?.error && <p className="notice notice--danger">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-fit">
        {pending ? "Saving…" : "Save lesson plan"}
      </button>
    </form>
  );
}
