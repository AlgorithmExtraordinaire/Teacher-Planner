"use client";

import { useActionState } from "react";
import { updateSetting, type SettingState } from "./actions";

export function SettingRow({
  settingKey,
  value,
  description,
  updatedAt,
}: {
  settingKey: string;
  value: string;
  description: string | null;
  updatedAt: string | null;
}) {
  const [state, action, pending] = useActionState<SettingState, FormData>(
    updateSetting,
    undefined,
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-2 border-b border-slate-100 py-4 last:border-b-0"
    >
      <input type="hidden" name="key" value={settingKey} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <code className="font-mono text-sm font-medium text-slate-900">
          {settingKey}
        </code>
        {updatedAt && (
          <span className="text-xs text-slate-400">
            updated {new Date(updatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-slate-500">{description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          name="value"
          defaultValue={value}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
    </form>
  );
}
