import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PreviewTabs } from "@/components/preview-tabs";
import { ThemeSwitcher } from "@/components/theme-switcher";

/**
 * Public landing page — the root of planner.elearning-swakopca.edu.na.
 *
 * Deliberately unauthenticated and free of any database call: it is the first
 * thing an anonymous visitor sees, so it must render without a session and
 * must never expose school data. `lib/supabase/proxy.ts` exempts "/" from the
 * login redirect for exactly this reason.
 *
 * Styling comes from the shared theme tokens in globals.css, so the landing
 * page and the signed-in application cannot drift apart.
 */
export const metadata: Metadata = {
  title: "Teacher & Departmental Planner — Swakopmund Christian Academy",
  description:
    "The academic operations platform of Swakopmund Christian Academy: co-planned lessons, learning analytics, and departmental governance in one workspace.",
};

const COLLABORATION = [
  {
    icon: "◫",
    title: "Co-planned lessons",
    body: "Two teachers can build the same scheme of work without emailing versions back and forth. Changes are attributed, so it is always clear who wrote what.",
  },
  {
    icon: "▤",
    title: "Shared curriculum drive",
    body: "Textbooks, teacher guides and module materials indexed by subject, grade and teaching role — filed once, found by everyone.",
  },
  {
    icon: "✓",
    title: "Departmental approvals",
    body: "Submit a plan, a head of department signs it off, and the decision is recorded. No more “I thought you had approved it”.",
  },
  {
    icon: "❝",
    title: "Inline feedback",
    body: "Comment on the differentiation section rather than the whole document. Mentoring happens where the work is.",
  },
];

const ANALYTICS = [
  {
    icon: "◗",
    title: "Student progress trends",
    body: "Standards-based mastery per learner, per subject, over time — so a slide shows as a slope, not a surprise.",
  },
  {
    icon: "≡",
    title: "Curriculum pacing",
    body: "Planned against actual module completion by class. Falling behind becomes visible in week three, not week ten.",
  },
  {
    icon: "◎",
    title: "Quality cycles",
    body: "Define a measure, track it across a term, and keep the evidence of whether the intervention actually moved it.",
  },
  {
    icon: "▦",
    title: "Attendance analytics",
    body: "Attendance beside attainment, because the two explain each other more often than either explains itself.",
  },
];

const GOVERNANCE = [
  {
    icon: "§",
    title: "Master policy index",
    body: "Every policy in one register with an owner and a review date, so nothing quietly goes stale for three years.",
  },
  {
    icon: "⧉",
    title: "Append-only audit trail",
    body: "Approvals, role changes and configuration edits are written to a log with no update or delete path. Records cannot be quietly rewritten.",
  },
  {
    icon: "⚿",
    title: "Authorisation workflows",
    body: "Role-scoped sign-off with a genuine ceiling: only a platform owner can change who holds which role.",
  },
  {
    icon: "⛨",
    title: "Row-level security",
    body: "Permissions live in the database, not the interface. A hidden button is not a control; a policy is.",
  },
];

function FeatureGrid({
  items,
}: {
  items: { icon: string; title: string; body: string }[];
}) {
  return (
    <div className="lp-grid">
      {items.map((f) => (
        <article key={f.title} className="card lp-feature">
          <div className="lp-icon" aria-hidden="true">
            {f.icon}
          </div>
          <h3>{f.title}</h3>
          <p>{f.body}</p>
        </article>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <a className="lp-skip" href="#main">
        Skip to content
      </a>

      <header className="lp-mast">
        <div className="lp-shell lp-mast__inner">
          <Link className="lp-brand" href="/">
            <Image
              className="lp-logo"
              src="/sca-logo.png"
              alt="Swakopmund Christian Academy crest"
              width={42}
              height={35}
              priority
            />
            <span className="lp-brand__name">
              Swakopmund Christian Academy
              <span className="lp-brand__sub">Teacher &amp; Departmental Planner</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
            <ThemeSwitcher />
            <Link className="btn btn-primary" href="/login">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------------- Hero ---------------- */}
        <section className="lp-hero lp-shell" aria-labelledby="hero-title">
          <Image
            src="/sca-logo.png"
            alt=""
            aria-hidden="true"
            width={116}
            height={97}
            priority
            style={{ margin: "0 auto 1.25rem", height: "auto", width: "clamp(84px, 12vw, 116px)" }}
          />
          <p className="lp-motto">By His Power · For His Glory</p>
          <h1 id="hero-title">Our planning, analytics and governance in one place</h1>
          <p className="lp-lede">
            The academic operations platform of Swakopmund Christian Academy — built by
            the Academy, for the Academy. Co-plan lessons across grade levels, see
            learning trends while there is still term left to act, and keep every
            approval on the record.
          </p>

          <div className="lp-ctas">
            <Link className="btn btn-primary btn-lg" href="/login">
              Log in to the planner
            </Link>
            <a className="btn btn-accent btn-lg" href="#access">
              Request staff access
            </a>
          </div>

          <p className="lp-trust">
            <span>
              <span className="lp-tick" aria-hidden="true">✓</span> Row-level security on every record
            </span>
            <span>
              <span className="lp-tick" aria-hidden="true">✓</span> Append-only audit trail
            </span>
            <span>
              <span className="lp-tick" aria-hidden="true">✓</span> Hosted for the Academy alone
            </span>
          </p>

          <PreviewTabs />

          <p className="lp-note">
            The preview above is an illustration with sample figures — not live Academy
            data. Signed in, the planner shows only what the Academy has actually recorded.
          </p>
        </section>

        {/* ---------------- Collaboration ---------------- */}
        <section className="lp-section lp-section--tint" aria-labelledby="collab-title">
          <div className="lp-shell">
            <div className="lp-head">
              <p className="lp-eyebrow">Collaboration</p>
              <h2 id="collab-title">Planning stops being a folder on someone&apos;s laptop</h2>
              <p>
                Departments teach as a team. The planning ought to work that way too —
                shared, reviewable, and never dependent on one person being reachable.
              </p>
            </div>
            <FeatureGrid items={COLLABORATION} />
          </div>
        </section>

        {/* ---------------- Analytics ---------------- */}
        <section className="lp-section" aria-labelledby="analytics-title">
          <div className="lp-shell">
            <div className="lp-head">
              <p className="lp-eyebrow">Analytics</p>
              <h2 id="analytics-title">See the drift while there is still term left to fix it</h2>
              <p>
                Most schools discover a struggling class at reporting time. Continuous
                tracking moves that discovery forward by weeks.
              </p>
            </div>
            <FeatureGrid items={ANALYTICS} />
          </div>
        </section>

        {/* ---------------- Governance ---------------- */}
        <section className="lp-section lp-section--tint" aria-labelledby="gov-title">
          <div className="lp-shell">
            <div className="lp-head">
              <p className="lp-eyebrow">Governance</p>
              <h2 id="gov-title">Compliance you can evidence, not just assert</h2>
              <p>
                When a board, an inspector, or a parent asks how a decision was made,
                the answer should take a minute to find.
              </p>
            </div>
            <FeatureGrid items={GOVERNANCE} />
          </div>
        </section>

        {/* ---------------- Themes ---------------- */}
        <section className="lp-section" aria-labelledby="themes-title">
          <div className="lp-shell">
            <div className="lp-head">
              <p className="lp-eyebrow">Design system</p>
              <h2 id="themes-title">Three interfaces, one platform</h2>
              <p>
                Staff work differently. Switch theme in the header and this page
                re-renders instantly — the same control every member of staff has
                inside the planner.
              </p>
            </div>

            <div className="lp-grid">
              {[
                {
                  name: "Lean Academy",
                  swatches: ["#1B365D", "#D4AF37", "#8A1538", "#F4F7F9"],
                  body: "Institutional and high-contrast. Sharp corners, hairline borders, dense tables. Built for reading a lot of numbers.",
                },
                {
                  name: "Zen Workspace",
                  swatches: ["#8BA89F", "#AEC4D6", "#B06A53", "#F9FAFB"],
                  body: "Calm and generous. Soft corners, borderless cards, muted palette. For a full planning period in one screen.",
                },
                {
                  name: "Deep Work",
                  swatches: ["#B388FF", "#00E5FF", "#FF5252", "#121212"],
                  body: "Low-glare dark mode with vivid active states. For late marking sessions and anyone who finds bright screens tiring.",
                },
              ].map((t) => (
                <article key={t.name} className="card">
                  <div className="lp-swatches" aria-hidden="true">
                    {t.swatches.map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                  </div>
                  <h3>{t.name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: ".875rem" }}>{t.body}</p>
                </article>
              ))}
            </div>

            <p className="lp-note">
              Every theme meets WCAG AA contrast for body text. Colour is a preference;
              legibility is not.
            </p>
          </div>
        </section>

        {/* ---------------- Access ---------------- */}
        <section className="lp-section" id="access" aria-labelledby="access-title">
          <div className="lp-shell">
            <div className="lp-cta">
              <h2 id="access-title">Getting your account</h2>
              <p>
                Every teaching member of staff gets an account scoped to their own
                classes. Heads of department and academic officers get approval and
                oversight rights. Speak to IT Operations to be set up, or book a
                walkthrough for your department.
              </p>
              <div className="lp-ctas">
                <a
                  className="btn btn-accent btn-lg"
                  href="mailto:school.office@swakopca.com?subject=Teacher%20Planner%20access"
                >
                  Request staff access
                </a>
                <Link className="btn btn-ghost btn-lg" href="/login">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer lp-shell">
        <div style={{ display: "flex", gap: ".875rem", alignItems: "flex-start" }}>
          <Image src="/sca-logo.png" alt="" aria-hidden="true" width={44} height={37} style={{ height: "auto" }} />
          <div>
            <p style={{ color: "var(--text-main)", fontWeight: 600, marginBottom: ".15rem" }}>
              Swakopmund Christian Academy
            </p>
            <p style={{ fontStyle: "italic", marginBottom: ".5rem" }}>
              “Train up a child in the way that he should go; and when he is old he will
              not depart from it.” — Proverbs 22:6
            </p>
            <address style={{ fontStyle: "normal", lineHeight: 1.7 }}>
              137 Anton Lubowski Street, PO Box 1777, Swakopmund, Namibia
              <br />
              Tel <a href="tel:+26464404605">+264 64 404 605</a> ·{" "}
              <a href="mailto:school.office@swakopca.com">school.office@swakopca.com</a>
              <br />
              <a href="https://www.swakopca.com" rel="noopener noreferrer" target="_blank">
                www.swakopca.com
              </a>{" "}
              · Reg. CC/99/1262
            </address>
            <p style={{ marginTop: ".75rem" }}>
              © {new Date().getFullYear()} Swakopmund Christian Academy. Built by the
              Academy, for the Academy.
            </p>
          </div>
        </div>

        <nav aria-label="Footer">
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            <Link href="/login">Log in</Link>
            <a href="#themes-title">Design system</a>
            <a href="#access">Request access</a>
            <a href="mailto:school.office@swakopca.com">Contact</a>
          </div>
        </nav>
      </footer>
    </>
  );
}
