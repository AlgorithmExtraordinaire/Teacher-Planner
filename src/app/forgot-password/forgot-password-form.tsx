"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestReset } from "@/app/forgot-password/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);

  if (state?.sent) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="notice notice--success">
          If that address has an account, a reset link is on its way. It expires
          in one hour.
        </p>
        <p className="text-sm text-muted">
          Nothing after a few minutes? Check spam, then ask IT Operations to
          issue a temporary password — that route does not depend on email.
        </p>
        <Link href="/login" className="btn-outline text-center">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="email" className="field__label">
          School email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>

      {state?.error && (
        <p role="alert" className="notice notice--danger">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Sending…" : "Email me a reset link"}
      </button>

      <Link href="/login" className="text-center text-sm text-muted hover:text-ink">
        Back to sign in
      </Link>
    </form>
  );
}
