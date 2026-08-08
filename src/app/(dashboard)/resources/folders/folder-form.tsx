"use client";

import { useActionState } from "react";
import { createFolder } from "@/app/(dashboard)/resources/actions";

export function FolderForm({
  parents,
}: {
  parents: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createFolder, undefined);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm"
    >
      <div className="flex flex-1 flex-col gap-1">
        <label className="field__label">
          New folder
        </label>
        <input
          name="name"
          required
          placeholder="e.g. Term 3 — Multiplication"
          className="input"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="field__label">Inside</label>
        <select
          name="parent_id"
          defaultValue=""
          className="select"
        >
          <option value="">Top level</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
      >
        {pending ? "Creating…" : "Create"}
      </button>

      {state?.error && (
        <p className="notice notice--danger w-full">{state.error}</p>
      )}
      {state?.ok && (
        <p className="notice notice--success w-full">{state.ok}</p>
      )}
    </form>
  );
}
