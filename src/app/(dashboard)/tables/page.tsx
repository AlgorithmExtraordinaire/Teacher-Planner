import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { tablesByGroup, TABLES } from "@/lib/tables/registry";

export default async function TablesIndexPage() {
  const supabase = await createClient();

  // Row counts, one HEAD request per table — cheap, and it makes the index
  // useful at a glance rather than a bare list of names.
  const counts = await Promise.all(
    TABLES.map(async (t) => {
      const { count } = await supabase
        .from(t.name)
        .select("*", { count: "exact", head: true });
      return [t.name, count ?? 0] as const;
    }),
  );
  const countMap = new Map(counts);

  return (
    <div>
      <PageHeader
        title="Tables"
        description="Every table in the system, browsable directly."
      />

      <div className="flex flex-col gap-8">
        {tablesByGroup().map(({ group, tables }) => (
          <section key={group}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-body">
              {group}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((t) => (
                <Link key={t.name} href={`/tables/${t.name}`}>
                  <Card className="h-full transition hover:border-navy">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink">
                        {t.label}
                      </p>
                      <span className="shrink-0 rounded-md bg-[#f1f4f8] px-2 py-0.5 text-xs font-medium tabular-nums text-body">
                        {countMap.get(t.name)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-body">
                      {t.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
