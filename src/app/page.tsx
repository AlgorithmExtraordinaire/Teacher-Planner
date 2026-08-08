import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PreviewTabs } from "@/components/preview-tabs";
import { Ticker } from "@/components/ticker";

/**
 * Public landing page — the root of planner.elearning-swakopca.edu.na.
 *
 * Deliberately unauthenticated and free of any database call: it is the first
 * thing an anonymous visitor sees, so it must render without a session and
 * must never expose school data. `lib/supabase/proxy.ts` exempts "/" from the
 * login redirect for exactly this reason.
 *
 * Structure follows the template one section at a time — ticker, sticky nav,
 * split hero with a dashboard panel, credibility strip, three pillars, a
 * capability table, a pull-quote band, a closing invitation, footer. Styling
 * comes from the shared tokens in globals.css, so this page and the
 * signed-in application cannot drift apart.
 *
 * EVERY FIGURE ON THIS PAGE IS EITHER A VERIFIED SCHOOL FACT OR IS LABELLED
 * AS ILLUSTRATIVE. The template it is based on is a fund-marketing page full
 * of performance claims; the equivalents here are not invented, because an
 * unsourced number on a school's own front page is the kind that gets
 * repeated as if it were audited. Where the template asserted a metric and
 * this project has no verified equivalent, the section describes a capability
 * instead.
 */
export const metadata: Metadata = {
  title: "Teacher & Departmental Planner — Swakopmund Christian Academy",
  description:
    "The academic operations platform of Swakopmund Christian Academy: co-planned lessons, learning analytics, and departmental governance in one workspace.",
};

/**
 * Ticker content for the public page.
 *
 * These are properties of the system rather than counts of school data —
 * this page has no session and must not read the database. They are stated
 * as capabilities ("SBG 1–4", "RLS enabled"), not as quantities, so nothing
 * here can be mistaken for a live figure.
 */
const PUBLIC_TICKER = [
  { symbol: "PLATFORM", value: "Teacher & Departmental Planner" },
  { symbol: "SCOPE", value: "Grades 0–7 · single-campus" },
  { symbol: "GRADING", value: "Standards-based · 1–4" },
  { symbol: "FRAMEWORKS", value: "CCSS · Utah SEEd" },
  { symbol: "SECURITY", value: "Row-level security", delta: "every table", direction: "up" as const },
  { symbol: "AUDIT", value: "Append-only", delta: "no delete path", direction: "up" as const },
  { symbol: "HOSTING", value: "Namibia · Academy-only tenancy" },
];

/** The three disciplines — the template's pillar block. */
const PILLARS = [
  {
    n: "— §01.1 / Planning",
    title: (
      <>
        Lessons planned <span className="it">together</span>, not in parallel.
      </>
    ),
    body: "Two teachers can build the same scheme of work without emailing versions back and forth. Plans cite curriculum standards by code, carry their own resources, and move through draft → submitted → approved with the decision recorded against a name.",
    stat: (
      <>
        <span className="it">3</span>-tier
      </>
    ),
    label: "Daily, weekly and unit plans in one repository",
  },
  {
    n: "— §01.2 / Evidence",
    title: (
      <>
        Drift visible in week <span className="it">three</span>.
      </>
    ),
    body: "Standards-based mastery per learner, per subject, over time, with attendance beside attainment because the two explain each other more often than either explains itself. A slide shows as a slope rather than a surprise at reporting time.",
    stat: (
      <>
        <span className="it">1–4</span>
      </>
    ),
    label: "Standards-based grading levels, not percentages",
  },
  {
    n: "— §01.3 / Governance",
    title: (
      <>
        Permissions in the <span className="it">database</span>.
      </>
    ),
    body: "Row-level security on every table, four roles with a genuine ceiling, and an append-only audit trail with no update or delete path. A hidden button is not a control; a policy is. Records cannot be quietly rewritten.",
    stat: (
      <>
        <span className="it">4</span> roles
      </>
    ),
    label: "Teacher · grade lead · admin · superadmin",
  },
];

/**
 * Capability matrix — the template's performance table, carrying what each
 * role may do rather than fabricated returns.
 */
const CAPABILITIES = [
  {
    name: "Teacher",
    sub: "Classroom",
    cells: ["Own classes", "Plan · submit", "Own learners", "—"],
  },
  {
    name: "Grade lead",
    sub: "Head of department",
    cells: ["Grade band", "Plan · approve", "Grade band", "—"],
  },
  {
    name: "Admin",
    sub: "Academic officer",
    cells: ["School-wide", "Plan · approve", "School-wide", "Read"],
  },
  {
    name: "Superadmin",
    sub: "Platform owner",
    cells: ["School-wide", "Plan · approve", "School-wide", "Write"],
  },
];

const FOOTER_LINKS = [
  {
    heading: "Planner",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Lesson planning", href: "#approach" },
      { label: "Analytics", href: "#approach" },
      { label: "Governance", href: "#roles" },
    ],
  },
  {
    heading: "Academy",
    links: [
      { label: "swakopca.com", href: "https://www.swakopca.com" },
      { label: "Contact the office", href: "mailto:school.office@swakopca.com" },
      { label: "Telephone", href: "tel:+26464404605" },
    ],
  },
  {
    heading: "Access",
    links: [
      {
        label: "Request staff access",
        href: "mailto:school.office@swakopca.com?subject=Teacher%20Planner%20access",
      },
      { label: "Report a problem", href: "mailto:school.office@swakopca.com?subject=Teacher%20Planner%20issue" },
    ],
  },
];

export default function LandingPage() {
  return (
    <>
      <a className="lp-skip" href="#main">
        Skip to content
      </a>

      <Ticker items={PUBLIC_TICKER} />

      <nav className="lp-nav" aria-label="Primary">
        <div className="container lp-nav__row">
          <Link className="lp-brand" href="/">
            <Image
              src="/sca-logo.png"
              alt="Swakopmund Christian Academy crest"
              width={36}
              height={30}
              priority
              style={{ height: "auto" }}
            />
            <span>
              <span className="lp-brand__name">
                Swakopmund Christian Academy
              </span>
              <span className="lp-brand__sub">
                Teacher &amp; Departmental Planner
              </span>
            </span>
          </Link>

          <ul className="lp-nav__links">
            <li>
              <a href="#approach">Approach</a>
            </li>
            <li>
              <a href="#roles">Roles</a>
            </li>
            <li>
              <a href="#preview">Preview</a>
            </li>
            <li>
              <a href="#access">Access</a>
            </li>
          </ul>

          <div className="lp-nav__actions">
            <Link className="btn-primary" href="/login">
              Log in
            </Link>
          </div>
        </div>
      </nav>

      <main id="main">
        {/* ---------------- Hero ---------------- */}
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="container lp-hero__grid">
            <div>
              <p className="eyebrow eyebrow--rule">
                By His Power · For His Glory
              </p>
              <h1 id="hero-title">
                Planning, evidence,
                <br />
                <span className="it">governance</span>. One system.
              </h1>
              <p className="lp-lede">
                The academic operations platform of Swakopmund Christian
                Academy — built by the Academy, for the Academy. Co-plan
                lessons across grade levels, see learning trends while there is
                still term left to act, and keep every approval on the record.
              </p>

              <div className="lp-ctas">
                <Link className="btn-primary btn-lg" href="/login">
                  Log in to the planner →
                </Link>
                <a className="btn-outline btn-lg" href="#approach">
                  How it works
                </a>
              </div>

              {/* Facts about the system, not performance claims. */}
              <div className="lp-trust">
                <div>
                  <div className="lp-trust__v">
                    <span className="it">RLS</span>
                  </div>
                  <div className="lp-trust__l">
                    Row-level security
                    <br />
                    on every table
                  </div>
                </div>
                <div>
                  <div className="lp-trust__v">
                    <span className="it">Append</span>-only
                  </div>
                  <div className="lp-trust__l">
                    Audit trail with no
                    <br />
                    update or delete path
                  </div>
                </div>
                <div>
                  <div className="lp-trust__v">
                    <span className="it">One</span> tenant
                  </div>
                  <div className="lp-trust__l">
                    Hosted for the
                    <br />
                    Academy alone
                  </div>
                </div>
              </div>
            </div>

            <div id="preview">
              <PreviewTabs />
            </div>
          </div>
        </section>

        {/* ---------------- Credibility strip ---------------- */}
        <section className="lp-strip" aria-label="What the planner is built on">
          <div className="container">
            <p className="lp-strip__h">— Built on</p>
            <div className="lp-strip__grid">
              <span>Next.js</span>
              <span className="italic">Supabase Postgres</span>
              <span>Common Core</span>
              <span className="italic">Utah SEEd</span>
              <span>Namibian hosting</span>
            </div>
          </div>
        </section>

        {/* ---------------- Approach / pillars ---------------- */}
        <section
          className="lp-section"
          id="approach"
          aria-labelledby="approach-title"
        >
          <div className="container">
            <div className="lp-sect-head">
              <div>
                <span className="eyebrow">§01 — APPROACH</span>
                <h2 id="approach-title">
                  Three <span className="it">disciplines</span>.
                  <br />
                  One record.
                </h2>
              </div>
              <p>
                A planner is only worth using if it survives contact with a
                real term. These three commitments are what the system is
                built to hold: plans that are shared, evidence that arrives
                early enough to act on, and permissions that live in the
                database rather than in the interface.
              </p>
            </div>

            <div className="lp-pillars">
              {PILLARS.map((p) => (
                <article className="lp-pillar" key={p.n}>
                  <div className="lp-pillar__n">{p.n}</div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <div className="lp-pillar__stat">
                    <div className="v">{p.stat}</div>
                    <div className="l">{p.label}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Roles table ---------------- */}
        <section
          className="lp-section lp-section--recessed"
          id="roles"
          aria-labelledby="roles-title"
        >
          <div className="container lp-split">
            <div>
              <span className="eyebrow">§02 — AUTHORISATION</span>
              <h2 id="roles-title">
                Who may do <span className="it">what</span>.
              </h2>
              <p>
                Four roles, each with a real ceiling. The scope column is
                enforced by Postgres row-level security policies, not by
                hiding a button — a teacher requesting another grade&apos;s
                learners receives no rows, whatever the interface shows.
              </p>
              <p>
                Only a platform owner can change who holds which role, and
                that change is itself written to the audit log.
              </p>
              <div className="lp-split__note">
                → Roles are assigned by IT Operations. Ask the school office to
                be set up.
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">
                  Permissions by role: record scope, lesson-plan rights,
                  analytics scope and platform settings access
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Role</th>
                    <th scope="col">Records</th>
                    <th scope="col">Lesson plans</th>
                    <th scope="col">Analytics</th>
                    <th scope="col">Settings</th>
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITIES.map((r) => (
                    <tr key={r.name}>
                      <th scope="row" className="cell-name font-normal">
                        {r.name}
                        <small>{r.sub}</small>
                      </th>
                      {r.cells.map((c, i) => (
                        <td key={i} className="cell-num">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------------- Pull quote ---------------- */}
        <section className="lp-quote" aria-label="Academy motto">
          <div className="container">
            <figure className="lp-quote__inner">
              <blockquote>
                “Train up a child in the way that he should go; and when he is
                old he will not depart from it.”
              </blockquote>
              <figcaption>
                — Proverbs 22:6
                <br />
                Swakopmund, Namibia
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ---------------- Closing invitation ---------------- */}
        <section className="lp-cta" id="access" aria-labelledby="access-title">
          <div className="container">
            <div className="lp-cta__wrap">
              <span className="eyebrow">§03 — ACCESS</span>
              <h2 id="access-title">
                For staff with a term to
                <br />
                <span className="it">plan</span>.
              </h2>
              <p>
                Every teaching member of staff gets an account scoped to their
                own classes. Heads of department and academic officers get
                approval and oversight rights. Speak to the school office to be
                set up, or book a walkthrough for your department.
              </p>
              <div className="lp-cta__actions">
                <a
                  className="btn-primary btn-lg"
                  href="mailto:school.office@swakopca.com?subject=Teacher%20Planner%20access"
                >
                  Request staff access →
                </a>
                <Link className="btn-outline btn-lg" href="/login">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="container">
          <div className="lp-footer__grid">
            <div>
              <Link className="lp-brand" href="/">
                <Image
                  src="/sca-logo.png"
                  alt=""
                  aria-hidden="true"
                  width={36}
                  height={30}
                  style={{ height: "auto" }}
                />
                <span>
                  <span className="lp-brand__name">
                    Swakopmund Christian Academy
                  </span>
                  <span className="lp-brand__sub">
                    Teacher &amp; Departmental Planner
                  </span>
                </span>
              </Link>
              <p className="lp-footer__blurb">
                An independent Christian academy in Swakopmund, Namibia,
                running its own academic operations platform.
              </p>
            </div>

            {FOOTER_LINKS.map((col) => (
              <div key={col.heading}>
                <h5>{col.heading}</h5>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.href.startsWith("/") ? (
                        <Link href={l.href}>{l.label}</Link>
                      ) : (
                        <a
                          href={l.href}
                          {...(l.href.startsWith("http")
                            ? { rel: "noopener noreferrer", target: "_blank" }
                            : {})}
                        >
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lp-footer__disc">
            SWAKOPMUND CHRISTIAN ACADEMY — 137 Anton Lubowski Street, PO Box
            1777, Swakopmund, Namibia. Tel +264 64 404 605 ·
            school.office@swakopca.com · Reg. CC/99/1262. This planner is an
            internal academic system for Academy staff. Access is granted by IT
            Operations; accounts are scoped by role and every record is
            protected by database row-level security. The dashboard preview on
            this page uses illustrative sample figures and does not show
            learner data.
          </div>

          <div className="lp-footer__bot">
            <span>
              © {new Date().getFullYear()} Swakopmund Christian Academy · Built
              by the Academy, for the Academy
            </span>
            <span>By His Power · For His Glory</span>
          </div>
        </div>
      </footer>
    </>
  );
}
