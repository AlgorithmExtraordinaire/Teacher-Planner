import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";

/**
 * Landing page for the emailed recovery link.
 *
 * Supabase sends the browser here with `?code=…`. Exchanging that code is what
 * creates the short-lived session the password update runs under, so it has to
 * happen before the form renders — not when the form submits.
 *
 * The exchange needs the PKCE verifier cookie set when the reset was
 * requested, which is why the link must be opened in the same browser. Opening
 * it elsewhere fails here, with an explanation, rather than at submit time.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error_description?: string }>;
}) {
  const { code, error_description } = await searchParams;

  let problem: string | null = error_description ?? null;

  if (!problem && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      problem =
        "This link could not be verified. It may have expired, already been used, or been opened in a different browser from the one that requested it.";
    }
  } else if (!problem && !code) {
    // No code at all: someone navigated here directly. Only a signed-in user
    // has any business on this page in that state.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      problem =
        "Open this page from the reset link in your email, or request a new link.";
    }
  }

  return (
    <div className="auth">
      <Link className="lp-brand" href="/">
        <Image
          src="/sca-logo.png"
          alt="Swakopmund Christian Academy crest"
          width={44}
          height={37}
          priority
          style={{ height: "auto" }}
        />
        <span>
          <span className="lp-brand__name">Swakopmund Christian Academy</span>
          <span className="lp-brand__sub">
            Teacher &amp; Departmental Planner
          </span>
        </span>
      </Link>

      <div className="auth__card">
        <p className="eyebrow eyebrow--rule mb-3">Account recovery</p>
        <h1 className="auth__title">
          Choose a new <span className="it">password</span>.
        </h1>

        {problem ? (
          <div className="mt-6 flex flex-col gap-4">
            <p role="alert" className="notice notice--danger">
              {problem}
            </p>
            <Link href="/forgot-password" className="btn-primary text-center">
              Request a new link
            </Link>
            <p className="text-sm text-muted">
              Still stuck? IT Operations can issue a temporary password without
              email.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              At least 8 characters. You will be signed in once it is saved.
            </p>
            <div className="mt-6">
              <ResetPasswordForm />
            </div>
          </>
        )}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        By His Power · For His Glory
      </p>
    </div>
  );
}
