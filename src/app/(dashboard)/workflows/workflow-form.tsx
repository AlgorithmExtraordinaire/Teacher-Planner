"use client";

import { useActionState, useState } from "react";
import { createWorkflow } from "@/app/(dashboard)/workflows/actions";
import { RULES } from "@/lib/workflows/definitions";

const input =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export function WorkflowForm() {
  const [state, action, pending] = useActionState(createWorkflow, undefined);
  const [ruleType, setRuleType] = useState(RULES[0].type);
  const [open, setOpen] = useState(false);

  const rule = RULES.find((r) => r.type === ruleType)!;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + New workflow
      </button>
    );
  }

  return (
    <form
      action={action}
      className="flex max-w-2xl flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Name</label>
        <input name="name" required className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Rule</label>
        <select
          name="rule_type"
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value as typeof ruleType)}
          className={input}
        >
          {RULES.map((r) => (
            <option key={r.type} value={r.type}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">{rule.description}</p>
      </div>

      {rule.params.length > 0 && (
        <div className="grid grid-cols-2 gap-4 rounded-md bg-slate-50 p-3">
          {rule.params.map((p) => (
            <div key={p.key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                {p.label}
              </label>
              <input
                name={`param_${p.key}`}
                type={p.type === "number" ? "number" : "text"}
                defaultValue={p.default}
                className={input}
              />
              {p.help && <p className="text-xs text-slate-500">{p.help}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Cadence</label>
          <select name="cadence" defaultValue="daily" className={input}>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Severity</label>
          <select name="severity" defaultValue="info" className={input}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Notify role
          </label>
          <select name="recipient_role" defaultValue="" className={input}>
            <option value="">Everyone</option>
            <option value="teacher">Teachers</option>
            <option value="grade_lead">Grade leads</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea name="description" rows={2} className={input} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">{state.ok}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create workflow"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
