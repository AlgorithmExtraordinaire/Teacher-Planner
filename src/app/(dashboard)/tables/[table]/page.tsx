import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, Card } from "@/components/ui";
import { formatCell } from "@/components/cell";
import { getTable } from "@/lib/tables/registry";

const PAGE_SIZE = 50;

export default async function TableBrowserPage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { table } = await params;
  const spec = getTable(table);
  if (!spec) notFound();

  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? "1") || 1);
  const from = (pageNum - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const select = spec.columns.map((c) => c.key).join(", ");

  const { data, count, error } = await supabase
    .from(spec.name)
    .select(select, { count: "exact" })
    .order(spec.orderBy.column, { ascending: spec.orderBy.ascending })
    .range(from, from + PAGE_SIZE - 1);

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/tables"
          className="text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          ← All tables
        </Link>
      </div>

      <PageHeader
        title={spec.label}
        description={`${spec.description} · ${total} row${total === 1 ? "" : "s"}`}
      />

      {error ? (
        <Card className="border-red-200 bg-red-50 text-sm text-red-700">
          Could not load this table: {error.message}
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState message="No rows yet." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {spec.columns.map((c) => (
                    <th
                      key={c.key}
                      className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-600"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {spec.columns.map((c) => (
                      <td key={c.key} className="px-4 py-2.5 text-slate-700">
                        {formatCell(row[c.key], c.kind)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-slate-500">
                Page {pageNum} of {lastPage}
              </p>
              <div className="flex gap-2">
                {pageNum > 1 && (
                  <Link
                    href={`/tables/${spec.name}?page=${pageNum - 1}`}
                    className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Previous
                  </Link>
                )}
                {pageNum < lastPage && (
                  <Link
                    href={`/tables/${spec.name}?page=${pageNum + 1}`}
                    className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
