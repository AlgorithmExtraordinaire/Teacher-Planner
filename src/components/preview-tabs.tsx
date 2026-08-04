"use client";

import { useRef, useState } from "react";

const TABS = [
  { id: "analytics", label: "Analytics" },
  { id: "planning", label: "Lesson planning" },
  { id: "approvals", label: "Approvals" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Tabbed dashboard preview for the public landing page.
 *
 * Implements the WAI-ARIA tabs pattern including roving tabindex and
 * arrow-key navigation — a tab strip that only responds to clicks is not
 * usable from a keyboard.
 *
 * Figures below are illustrative. This component is public and unauthenticated,
 * so it must never read real school data.
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
    <div className="lp-mockup">
      <div className="lp-chrome">
        <span className="lp-dots" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="lp-url">planner.elearning-swakopca.edu.na</span>
      </div>

      <div className="lp-tabs" role="tablist" aria-label="Dashboard preview">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
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

      <div style={{ padding: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.25rem",
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: ".8125rem", color: "var(--text-muted)" }}
          >
            SAMPLE WORKSPACE · ILLUSTRATIVE DATA
          </span>
          <span className="badge badge-success">Live collaboration active</span>
        </div>

        {/* Analytics */}
        <section
          role="tabpanel"
          id="lp-panel-analytics"
          aria-labelledby="lp-tab-analytics"
          hidden={active !== "analytics"}
        >
          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            {[
              { k: "Curriculum coverage", v: "94.2%", s: "+4.1 pts after the last review cycle", c: "var(--color-primary)" },
              { k: "Learners tracked", v: "312", s: "Across 8 grade levels", c: "var(--text-main)" },
              { k: "Flagged for intervention", v: "7", s: "Surfaced before term-end reporting", c: "var(--color-alert)" },
            ].map((m) => (
              <article key={m.k} className="card" style={{ padding: "1.25rem" }}>
                <h4 style={{ fontSize: ".8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  {m.k}
                </h4>
                <p
                  className="font-mono"
                  style={{ fontSize: "2rem", fontWeight: 700, margin: ".35rem 0 .2rem", color: m.c }}
                >
                  {m.v}
                </p>
                <small style={{ fontSize: ".8125rem", color: "var(--text-muted)" }}>{m.s}</small>
              </article>
            ))}
          </div>

          <div className="card" style={{ marginTop: "1rem" }}>
            <h4 style={{ fontSize: ".8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
              Mastery trend · last 10 assessments
            </h4>
            <div
              className="lp-spark"
              role="img"
              aria-label="Upward mastery trend across the last ten assessments"
            >
              {[38, 45, 41, 52, 58, 55, 67, 72, 79, 92].map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </section>

        {/* Lesson planning */}
        <section
          role="tabpanel"
          id="lp-panel-planning"
          aria-labelledby="lp-tab-planning"
          hidden={active !== "planning"}
        >
          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {[
              { t: "Draft", m: "kanban-head--todo", items: [["Grade 6 — Fractions, Module 3", "Ms Nangolo · due Friday"], ["Grade 4 — Persuasive writing", "Unassigned"]] },
              { t: "Submitted", m: "kanban-head--progress", items: [["Grade 8 — Forces & motion", "Awaiting H.O.D. review"]] },
              { t: "Approved", m: "kanban-head--review", items: [["Grade 3 — Reading comprehension", "Signed off 2 days ago"], ["Grade 7 — Civics unit opener", "Signed off last week"]] },
            ].map((col) => (
              <div key={col.t}>
                <h4 className={`kanban-head ${col.m}`}>{col.t}</h4>
                {col.items.map(([title, meta]) => (
                  <div key={title} className="kanban-item">
                    <span style={{ fontWeight: 500 }}>{title}</span>
                    <small style={{ display: "block", color: "var(--text-muted)", fontSize: ".75rem", marginTop: ".2rem" }}>
                      {meta}
                    </small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Approvals */}
        <section
          role="tabpanel"
          id="lp-panel-approvals"
          aria-labelledby="lp-tab-approvals"
          hidden={active !== "approvals"}
        >
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: 520 }}>
              <caption className="sr-only">Recent departmental authorisations</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Description</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono">#1042</td>
                  <td>Elementary policy index revision</td>
                  <td>Governance</td>
                  <td><span className="badge badge-success">Approved</span></td>
                </tr>
                <tr>
                  <td className="font-mono">#1043</td>
                  <td>Departmental resource requisition</td>
                  <td>Financial</td>
                  <td><span className="badge badge-warning">Awaiting H.O.D.</span></td>
                </tr>
                <tr>
                  <td className="font-mono">#1044</td>
                  <td>Term 3 scheme of work — Science</td>
                  <td>Curriculum</td>
                  <td><span className="badge badge-danger">Returned</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
