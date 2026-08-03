import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/dal";
import { PageHeader, Card, EmptyState, StatTile } from "@/components/ui";
import { Badge } from "@/components/cell";
import { SettingRow } from "./setting-row";

/**
 * Platform console. Superadmin only.
 *
 * `requireSuperadmin()` redirects anyone else, but the real boundary is RLS:
 * `system_settings` and `schools` are superadmin-write, and `audit_log` is
 * superadmin-read. An admin who reached this URL would simply see nothing.
 */
export default async function PlatformSettingsPage() {
  const user = await requireSuperadmin();
  const supabase = await createClient();

  const [{ data: settings }, { data: schools }, { data: audit }] =
    await Promise.all([
      supabase
        .from("system_settings")
        .select("key, value, description, updated_at")
        .order("key"),
      supabase
        .from("schools")
        .select("id, name, code, timezone, is_active")
        .order("name"),
      supabase
        .from("audit_log")
        .select("id, action, entity, entity_id, created_at, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Platform"
        description={`Signed in as ${user.full_name} · superadmin. These controls are not visible to admins or grade leads.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Schools" value={schools?.length ?? 0} />
        <StatTile label="Settings" value={settings?.length ?? 0} />
        <StatTile label="Audit entries shown" value={audit?.length ?? 0} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          System settings
        </h2>
        <Card>
          {settings && settings.length > 0 ? (
            <div className="flex flex-col">
              {settings.map((s) => (
                <SettingRow
                  key={s.key}
                  settingKey={s.key}
                  value={JSON.stringify(s.value)}
                  description={s.description}
                  updatedAt={s.updated_at}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No settings defined.</p>
          )}
        </Card>
        <p className="mt-2 text-xs text-slate-500">
          Values are JSON. Quote text, write numbers and booleans bare.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Schools</h2>
        {schools && schools.length > 0 ? (
          <Card className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-slate-600">
                    Name
                  </th>
                  <th className="px-4 py-2.5 font-medium text-slate-600">
                    Code
                  </th>
                  <th className="px-4 py-2.5 font-medium text-slate-600">
                    Timezone
                  </th>
                  <th className="px-4 py-2.5 font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 text-slate-900">{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {s.code ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{s.timezone}</td>
                    <td className="px-4 py-2.5">
                      <Badge value={s.is_active ? "active" : "inactive"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <EmptyState message="No schools registered." />
        )}
        <p className="mt-2 text-xs text-slate-500">
          Registry only. Tenant isolation is not implemented — every school
          here would share one pool of records until{" "}
          <code className="font-mono">school_id</code> is enforced across all
          tables and policies.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Audit log — 25 most recent
        </h2>
        {audit && audit.length > 0 ? (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 font-medium text-slate-600">
                      When
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-600">
                      Actor
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-600">
                      Action
                    </th>
                    <th className="px-4 py-2.5 font-medium text-slate-600">
                      Entity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audit.map((row) => {
                    const actor = Array.isArray(row.profiles)
                      ? row.profiles[0]
                      : row.profiles;
                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-2.5 text-slate-500">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {actor?.full_name ?? "system"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge value={row.action} />
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                          {row.entity ?? "—"}
                          {row.entity_id ? `:${row.entity_id.slice(0, 8)}` : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState message="Nothing recorded yet. Entries appear when a proposal is reviewed, a workflow is toggled, or a setting changes." />
        )}
        <p className="mt-2 text-xs text-slate-500">
          Append-only: no update or delete policy exists, so entries cannot be
          altered or removed through the API by any role.
        </p>
      </section>
    </div>
  );
}
