export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
      {description && (
        <p className="mt-1 max-w-3xl text-sm text-body">{description}</p>
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
  // Flat: a hairline border rather than a shadow. Institutional, not app-store.
  return (
    <div className={`rounded-sm border border-line bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Metric tile. The number is the content, so it carries the weight and the
 * navy; the label stays quiet above it.
 */
export function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-sm border border-line bg-white px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-body">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-sm border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-body">
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
    <div className="overflow-x-auto rounded-sm border border-line bg-white">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="border-b border-line bg-white">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-body"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-[#f7f9fc]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-body">
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
