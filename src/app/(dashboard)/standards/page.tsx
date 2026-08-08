import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, KpiCard } from "@/components/ui";
import { Badge } from "@/components/cell";

const PAGE_SIZE = 100;

/**
 * Standards library.
 *
 * There are over a thousand standards, so this page never renders the whole
 * set: PostgREST caps a response at 1,000 rows, which would silently truncate
 * and look like the library was incomplete. Filters narrow first, then a
 * bounded page renders — the count always reflects the full match, not the
 * page.
 */
export default async function StandardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    framework?: string;
    grade?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { framework, grade, q, page } = await searchParams;
  const supabase = await createClient();
  const pageNum = Math.max(1, Number(page) || 1);
  const from = (pageNum - 1) * PAGE_SIZE;

  let query = supabase
    .from("curriculum_standards")
    .select("id, code, framework, subject, grade_level, domain, description", {
      count: "exact",
    });

  if (framework) query = query.eq("framework", framework);
  if (grade) query = query.eq("grade_level", grade);
  if (q) query = query.or(`code.ilike.%${q}%,description.ilike.%${q}%`);

  const [{ data: standards, count }, { data: frameworks }, { data: grades }] =
    await Promise.all([
      query.order("framework").order("code").range(from, from + PAGE_SIZE - 1),
      supabase.from("curriculum_standards").select("framework"),
      supabase.from("curriculum_standards").select("grade_level"),
    ]);

  const frameworkOptions = [
    ...new Set((frameworks ?? []).map((f) => f.framework)),
  ].sort();

  // Order grades the way a school reads them, not alphabetically.
  const gradeOptions = [
    ...new Set((grades ?? []).map((g) => g.grade_level).filter(Boolean)),
  ].sort((a, b) => {
    const rank = (v: string | null) => {
      if (!v) return 99;
      if (v === "Anchor standard") return -1;
      if (v === "Kindergarten") return 0;
      const n = Number(v.replace(/\D/g, ""));
      return Number.isFinite(n) && n ? n : 50;
    };
    return rank(a) - rank(b);
  });

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { framework, grade, q, page: undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/standards?${s}` : "/standards";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Curriculum Standards"
        description="CCSS for Mathematics and English Language Arts; Utah SEEd for Science. Codes are the ones cited in lesson plans."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Standards in library" value={total} tone="accent" />
        <KpiCard label="Frameworks" value={frameworkOptions.length} />
        <KpiCard
          label="Showing"
          value={`${standards?.length ?? 0} of ${total}`}
        />
      </div>

      {/* Filters are plain links, so the page stays a server component and
          every filtered view is shareable as a URL. */}
      <Card>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <label htmlFor="q" className="field__label">
              Search code or description
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q ?? ""}
              placeholder="e.g. 4.NF or fractions"
              className="input"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="framework" className="field__label">
              Framework
            </label>
            <select
              id="framework"
              name="framework"
              defaultValue={framework ?? ""}
              className="select"
            >
              <option value="">All frameworks</option>
              {frameworkOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="grade" className="field__label">
              Grade
            </label>
            <select
              id="grade"
              name="grade"
              defaultValue={grade ?? ""}
              className="select"
            >
              <option value="">All grades</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g!}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Apply
          </button>
          {(framework || grade || q) && (
            <Link href="/standards" className="btn-ghost">
              Clear
            </Link>
          )}
        </form>
      </Card>

      {!standards || standards.length === 0 ? (
        <EmptyState message="No standards match those filters." />
      ) : (
        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Framework</th>
                <th scope="col">Grade</th>
                <th scope="col">Domain</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {standards.map((s) => (
                <tr key={s.id}>
                  <td className="cell-num whitespace-nowrap">{s.code}</td>
                  <td>
                    <Badge value={s.framework} />
                  </td>
                  <td className="whitespace-nowrap">{s.grade_level ?? "—"}</td>
                  <td>{s.domain ?? "—"}</td>
                  <td style={{ minWidth: 320 }}>{s.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
            Page {pageNum} of {lastPage}
          </span>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link className="btn-ghost" href={link({ page: String(pageNum - 1) })}>
                Previous
              </Link>
            )}
            {pageNum < lastPage && (
              <Link className="btn-ghost" href={link({ page: String(pageNum + 1) })}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
