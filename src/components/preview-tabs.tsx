"use client";

import { useRef, useState } from "react";

const TABS = [
  { id: "analytics", label: "Analytics" },
  { id: "planning", label: "Planning" },
  { id: "approvals", label: "Approvals" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Dashboard preview for the public landing page — the template's hero panel.
 *
 * Implements the WAI-ARIA tabs pattern including roving tabindex and
 * arrow-key navigation: a tab strip that only responds to clicks is not
 * usable from a keyboard.
 *
 * EVERY FIGURE BELOW IS ILLUSTRATIVE and the panel says so in its own
 * header. This component is public and unauthenticated, so it must never
 * read real school data — the alternative to sample numbers is an empty
 * panel, not live ones.
 */
export function PreviewTabs() {
  const [active, setActive] = useState<TabId>("analytics");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    let next: number | null = null;

    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;

    if (next !== null) {
      e.preventDefault();
      setActive(TABS[next].id);
      refs.current[next]?.focus();
    }
  }

  return (
    <div className="lp-dash">
      <div className="panel__head">
        <div>
          <div className="panel__title">
            Grade 6 Mathematics, <span className="it">sample workspace</span>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Illustrative figures · not Academy data
          </p>
        </div>
        <div className="lp-dash__tabs" role="tablist" aria-label="Dashboard preview">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`lp-tab-${t.id}`}
              aria-controls={`lp-panel-${t.id}`}
              aria-selected={active === t.id}
              tabIndex={active === t.id ? 0 : -1}
              className="lp-tab"
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Analytics ---------- */}
      <section
        role="tabpanel"
        id="lp-panel-analytics"
        aria-labelledby="lp-tab-analytics"
        hidden={active !== "analytics"}
      >
        <div className="lp-dash__kpis">
          <div className="kpi">
            <div className="kpi__label">Curriculum coverage</div>
            <div className="kpi__value kpi__value--accent">94.2%</div>
            <div className="kpi__note kpi__note--up">+4.1 pts this cycle</div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Mean SBG level</div>
            <div className="kpi__value">3.1</div>
            <div className="kpi__note kpi__note--up">of 4 · +0.3 on term 1</div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Flagged for support</div>
            <div className="kpi__value kpi__value--danger">7</div>
            <div className="kpi__note kpi__note--down">before reporting</div>
          </div>
        </div>

        <div className="mt-2">
          <div className="kpi__label">Mastery trend · last 10 assessments</div>
          <div
            className="lp-spark"
            role="img"
            aria-label="Mastery rising across the last ten assessments, from 38% to 92%"
          >
            {[38, 45, 41, 52, 58, 55, 67, 72, 79, 92].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
            <span>A1</span>
            <span>A5</span>
            <span>A10</span>
          </div>
        </div>
      </section>

      {/* ---------- Planning ---------- */}
      <section
        role="tabpanel"
        id="lp-panel-planning"
        aria-labelledby="lp-tab-planning"
        hidden={active !== "planning"}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              t: "Draft",
              m: "kanban-head--todo",
              items: [
                ["Fractions · Module 3", "Ms Nangolo · due Friday"],
                ["Persuasive writing", "Unassigned"],
              ],
            },
            {
              t: "Submitted",
              m: "kanban-head--progress",
              items: [["Forces & motion", "Awaiting H.O.D. review"]],
            },
            {
              t: "Approved",
              m: "kanban-head--review",
              items: [
                ["Reading comprehension", "Signed off 2 days ago"],
                ["Civics unit opener", "Signed off last week"],
              ],
            },
          ].map((col) => (
            <div key={col.t}>
              <h4 className={`kanban-head ${col.m}`}>
                {col.t}
                <span className="font-normal text-muted">
                  {col.items.length}
                </span>
              </h4>
              {col.items.map(([title, meta]) => (
                <div key={title} className="kanban-item">
                  <p className="font-medium text-main">{title}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
                    {meta}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Approvals ---------- */}
      <section
        role="tabpanel"
        id="lp-panel-approvals"
        aria-labelledby="lp-tab-approvals"
        hidden={active !== "approvals"}
      >
        <div className="kpi__label mb-3">Recent authorisations</div>
        {[
          {
            ico: "b" as const,
            code: "PI",
            name: "Elementary policy index",
            sub: "Governance",
            status: "Approved",
            tone: "badge-success",
          },
          {
            ico: "a" as const,
            code: "RQ",
            name: "Resource requisition",
            sub: "Financial",
            status: "Awaiting H.O.D.",
            tone: "badge-warning",
          },
          {
            ico: "c" as const,
            code: "SW",
            name: "Term 3 scheme of work",
            sub: "Curriculum · Science",
            status: "In review",
            tone: "badge-warning",
          },
          {
            ico: "d" as const,
            code: "AM",
            name: "Assessment moderation",
            sub: "Curriculum · Maths",
            status: "Returned",
            tone: "badge-danger",
          },
        ].map((r) => (
          <div className="lp-row" key={r.name}>
            <span className={`lp-row__ico lp-row__ico--${r.ico}`} aria-hidden="true">
              {r.code}
            </span>
            <span className="lp-row__name">
              {r.name}
              <small>{r.sub}</small>
            </span>
            <span className="lp-row__val">
              <span className={`badge ${r.tone}`}>{r.status}</span>
            </span>
            <span className="lp-row__d">—</span>
          </div>
        ))}
      </section>
    </div>
  );
}
