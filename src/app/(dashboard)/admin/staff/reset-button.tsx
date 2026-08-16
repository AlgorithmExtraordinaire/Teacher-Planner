"use client";

import { useActionState } from "react";
import { resetStaffPassword, type ResetResult } from "./actions";

export function ResetButton({
  profileId,
  name,
}: {
  profileId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState<ResetResult, FormData>(
    resetStaffPassword,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-1">
        {/* Shown once and never stored anywhere readable. Reloading the page
            loses it, which is correct — a temporary password left on screen
            for the rest of the day is a shared password. */}
        <code className="font-mono text-sm font-semibold text-ink">
          {state.password}
        </code>
        <span className="text-xs text-body">
          Give to {name} directly · not recoverable once this page reloads
        </span>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="profile_id" value={profileId} />
      <button type="submit" disabled={pending} className="btn-outline btn-sm">
        {pending ? "Issuing…" : "Issue temp password"}
      </button>
      {state?.ok === false && (
        <span role="alert" className="text-xs text-danger">
          {state.error}
        </span>
      )}
    </form>
  );
}
