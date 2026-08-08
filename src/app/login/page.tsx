import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

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
        <p className="eyebrow eyebrow--rule mb-3">Staff sign-in</p>
        <h1 className="auth__title">
          Welcome <span className="it">back</span>.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Accounts are issued by IT Operations and scoped to your role.
        </p>

        <div className="mt-6">
          <LoginForm next={next ?? "/"} />
        </div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        By His Power · For His Glory
      </p>
    </div>
  );
}
