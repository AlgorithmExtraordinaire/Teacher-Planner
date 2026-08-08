/**
 * Shared UI primitives.
 *
 * Every visual decision resolves to a class in globals.css rather than an
 * inline colour, so the template is applied in one place and these
 * components cannot drift from it. Pages that already use these primitives
 * (which is most of them) inherit the design system without individual
 * edits.
 */

/**
 * Page heading. The title is the display serif; the optional eyebrow is the
 * template's mono micro-label, which is how a section announces itself
 * before the eye reaches the heading.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="eyebrow eyebrow--rule mb-3">{eyebrow}</p>
        )}
        <h1 className="page-head__title">{title}</h1>
        {description && <p className="page-head__desc">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}

/** A section label inside a page — mono, so it does not compete with the
 *  serif page title above it. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="section-label">{children}</h2>;
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

/**
 * Panel with a ruled header — the template's dashboard block. Used where a
 * card needs a title and an action on the same line.
 */
export function Panel({
  title,
  meta,
  actions,
  children,
  raised = false,
  className = "",
}: {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  raised?: boolean;
  className?: string;
}) {
  return (
    <section className={`panel ${raised ? "panel--raised" : ""} ${className}`}>
      {(title || actions) && (
        <div className="panel__head">
          <div>
            {title && <h2 className="panel__title">{title}</h2>}
            {meta && (
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                {meta}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Metric tile.
 *
 * `tone` says what the figure means, not what colour to paint it:
 *   accent — the figure the reader came for, set in italic serif amber
 *   danger — a figure that needs a decision
 *   neutral — context
 *
 * Direction is carried by `note` + `trend` so a movement is never conveyed
 * by colour alone; the note text says which way it went.
 */
export function KpiCard({
  label,
  value,
  tone = "neutral",
  note,
  trend,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "accent" | "danger";
  note?: string;
  trend?: "up" | "down";
}) {
  const valueClass =
    tone === "accent"
      ? "kpi__value kpi__value--accent"
      : tone === "danger"
        ? "kpi__value kpi__value--danger"
        : "kpi__value";

  const noteClass =
    trend === "up"
      ? "kpi__note kpi__note--up"
      : trend === "down"
        ? "kpi__note kpi__note--down"
        : "kpi__note";

  return (
    <div className="kpi">
      <h3 className="kpi__label">{label}</h3>
      <p className={valueClass}>{value}</p>
      {note && <p className={noteClass}>{note}</p>}
    </div>
  );
}

/** Retained for pages that only need a label and a figure. */
export function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return <KpiCard label={label} value={value} />;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}

/**
 * Notice band. `tone` is severity, and each tone also changes the left rule,
 * so the three are distinguishable without relying on hue.
 */
export function Notice({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const cls =
    tone === "neutral" ? "notice" : `notice notice--${tone}`;
  return <div className={cls}>{children}</div>;
}

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records yet.",
}: {
  columns: string[];
  rows: (string | number | null)[][];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table min-w-max">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} scope="col">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  /* The first column identifies the row, so it gets the
                     serif treatment; the rest stay in the interface face.
                     A null renders as an em dash in the muted colour —
                     "not recorded" is information, not an absence. */
                  className={j === 0 ? "cell-name" : undefined}
                >
                  {cell ?? <span className="text-muted">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
