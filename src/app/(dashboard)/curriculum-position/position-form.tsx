"use client";

import { useActionState } from "react";
import { savePosition, type PositionState } from "./actions";

export type ModuleOption = {
  id: string;
  title: string;
  sequence_order: number | null;
};

const STATUSES = [
  { value: "on_track", label: "On track" },
  { value: "behind", label: "Behind" },
  { value: "ahead", label: "Ahead" },
  { value: "complete", label: "Complete" },
];

export function PositionForm({
  classId,
  modules,
  currentModuleId,
  currentStatus,
  currentNotes,
}: {
  classId: string;
  modules: ModuleOption[];
  currentModuleId: string | null;
  currentStatus: string | null;
  currentNotes: string | null;
}) {
  const [state, action, pending] = useActionState<PositionState, FormData>(
    savePosition,
    undefined,
  );

  const inputClass =
    "rounded-md border border-line px-3 py-2 text-sm focus:border-crimson focus:outline-none";

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="class_id" value={classId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-body">Currently on</span>
          <select
            name="curriculum_module_id"
            defaultValue={currentModuleId ?? ""}
            className={inputClass}
            required
          >
            <option value="">— Select a module —</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.sequence_order ? `${m.sequence_order}. ` : ""}
                {m.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-body">Pacing</span>
          <select
            name="status"
            defaultValue={currentStatus ?? "on_track"}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-body">
            Expect to finish
          </span>
          <input
            type="date"
            name="planned_completion_date"
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-body">
          Note for the grade lead (optional)
        </span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={currentNotes ?? ""}
          placeholder="Anything slowing you down, or anything you skipped and why."
          className={inputClass}
        />
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-outline btn-sm">
          {pending ? "Saving…" : "Record position"}
        </button>
        {state?.ok && (
          <span role="status" className="text-xs text-body">
            {state.message}
          </span>
        )}
        {state?.ok === false && (
          <span role="alert" className="text-xs text-danger">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
