"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/login/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="field">
        <label htmlFor="email" className="field__label">
          Email
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

      <div className="field">
        <label htmlFor="password" className="field__label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>

      {/* role="alert" so a failed sign-in is announced rather than only
          appearing above the button. */}
      {state?.error && (
        <p role="alert" className="notice notice--danger">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <Link
        href="/forgot-password"
        className="text-center text-sm text-muted hover:text-ink"
      >
        Forgot your password?
      </Link>
    </form>
  );
}
