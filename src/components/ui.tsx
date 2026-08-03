export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-main">{title}</h1>
      {description && (
        <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // `.card` is defined in globals.css so hand-written and Tailwind styles
  // share one definition of what a surface looks like.
  return <div className={`card ${className}`}>{children}</div>;
}

const KPI_TONES = {
  navy: "text-navy",
  crimson: "text-crimson",
  gold: "text-gold",
  main: "text-main",
} as const;

/**
 * Metric tile: muted label, large figure in a tone that says whether it needs
 * attention. Gold and crimson are reserved for figures that do.
 */
export function KpiCard({
  label,
  value,
  tone = "navy",
  note,
}: {
  label: string;
  value: string | number;
  tone?: keyof typeof KPI_TONES;
  note?: string;
}) {
  return (
    <div className="card">
      <h3 className="text-sm text-muted">{label}</h3>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${KPI_TONES[tone]}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

/** Retained for pages that use the simpler tile. */
export function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return <KpiCard label={label} value={value} tone="navy" />;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-muted">
      {message}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number | null)[][];
}) {
  if (rows.length === 0) {
    return <EmptyState message="No data yet." />;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-line bg-white">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap border-b border-line px-4 py-2 font-semibold text-muted"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-surface">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-line px-4 py-2 text-main"
                >
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
