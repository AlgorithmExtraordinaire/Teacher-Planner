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
      className="flex flex-col gap-2 border-b border-line py-4 last:border-b-0"
    >
      <input type="hidden" name="key" value={settingKey} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <code className="font-mono text-sm font-medium text-ink">
          {settingKey}
        </code>
        {updatedAt && (
          <span className="text-xs text-body">
            updated {new Date(updatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-body">{description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          name="value"
          defaultValue={value}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-md border border-line px-3 py-1.5 font-mono text-sm text-ink focus:border-crimson focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-body hover:bg-[#f1f4f8] disabled:opacity-50"
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
