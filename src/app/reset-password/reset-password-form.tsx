"use client";

import { useActionState } from "react";
import { setNewPassword } from "@/app/reset-password/actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="password" className="field__label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="confirm" className="field__label">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
      </div>

      {state?.error && (
        <p role="alert" className="notice notice--danger">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Set password and sign in"}
      </button>
    </form>
  );
}
