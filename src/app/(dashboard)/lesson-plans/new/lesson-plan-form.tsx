"use client";

import { useActionState } from "react";
import { createLessonPlan } from "@/app/(dashboard)/lesson-plans/new/actions";

type ClassOption = { id: string; name: string };

const TIERS = ["annual", "term", "monthly", "weekly", "daily"] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export function LessonPlanForm({ classes }: { classes: ClassOption[] }) {
  const [state, action, pending] = useActionState(createLessonPlan, undefined);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <Field label="Title">
        <input name="title" required className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Planning tier">
          <select name="tier" required defaultValue="daily" className={inputClass}>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Class">
          <select name="class_id" className={inputClass}>
            <option value="">— None —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Lesson date">
        <input type="date" name="lesson_date" className={inputClass} />
      </Field>

      <Field label="Objective">
        <textarea name="objective" rows={2} className={inputClass} />
      </Field>

      <Field label="Materials">
        <textarea name="materials" rows={2} className={inputClass} />
      </Field>

      <Field label="Warm-up">
        <textarea name="warm_up" rows={2} className={inputClass} />
      </Field>

      <Field label="Direct instruction">
        <textarea name="direct_instruction" rows={3} className={inputClass} />
      </Field>

      <Field label="Guided practice">
        <textarea name="guided_practice" rows={3} className={inputClass} />
      </Field>

      <Field label="Independent practice">
        <textarea
          name="independent_practice"
          rows={3}
          className={inputClass}
        />
      </Field>

      <Field label="Assessment strategy">
        <textarea name="assessment_strategy" rows={2} className={inputClass} />
      </Field>

      <Field label="Differentiation">
        <textarea name="differentiation" rows={2} className={inputClass} />
      </Field>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save lesson plan"}
      </button>
    </form>
  );
}
