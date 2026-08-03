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
      className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex flex-1 flex-col gap-1">
        <label className="text-xs font-medium text-body">
          New folder
        </label>
        <input
          name="name"
          required
          placeholder="e.g. Term 3 — Multiplication"
          className="rounded-md border border-line px-3 py-2 text-sm focus:border-crimson focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-body">Inside</label>
        <select
          name="parent_id"
          defaultValue=""
          className="rounded-md border border-line px-3 py-2 text-sm"
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
        className="rounded-md bg-crimson px-4 py-2 text-sm font-medium text-white hover:bg-crimson-hover disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create"}
      </button>

      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="w-full text-sm text-emerald-600">{state.ok}</p>
      )}
    </form>
  );
}
