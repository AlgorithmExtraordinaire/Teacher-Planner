import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form";

export default function ForgotPasswordPage() {
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
          Forgot your <span className="it">password</span>?
        </h1>
        <p className="mt-2 text-sm text-muted">
          We will email a link that lets you set a new one. Open it on this same
          device — the link is tied to the browser that asked for it.
        </p>

        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        By His Power · For His Glory
      </p>
    </div>
  );
}
