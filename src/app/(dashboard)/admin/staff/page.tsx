import { requireStaffAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, Notice } from "@/components/ui";
import { Badge } from "@/components/cell";
import { ResetButton } from "./reset-button";

/**
 * Staff accounts. Admin, grade lead and superadmin.
 *
 * Deliberately does NOT show last-sign-in: that lives in auth.users, which is
 * only reachable with the service key, and this page is a Server Component
 * rendering under the caller's session. Widening the service-client exception
 * to page reads to display one convenience column is not a trade worth making
 * — `scripts/provision_staff.mjs audit` reports it for whoever needs it.
 */
export default async function StaffAccountsPage() {
  const user = await requireStaffAdmin();
  const supabase = await createClient();

  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, full_name, email, subject, grade_band, status, profile_id")
    .order("full_name");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role");

  const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role]));
  const list = teachers ?? [];
  const unlinked = list.filter((t) => t.status === "active" && !t.profile_id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Staff Accounts"
        description={`Signed in as ${user.full_name}. Issue a temporary password when someone cannot get in and email recovery is not working.`}
      />

      {unlinked.length > 0 && (
        <Notice tone="danger">
          {unlinked.length} active teacher
          {unlinked.length === 1 ? " has" : "s have"} no linked account:{" "}
          {unlinked.map((t) => t.full_name).join(", ")}. They can sign in but
          cannot save a lesson plan — every write policy resolves the teacher
          through this link. Fix with{" "}
          <code className="font-mono text-xs">
            scripts/provision_staff.mjs
          </code>
          .
        </Notice>
      )}

      {list.length === 0 ? (
        <EmptyState message="No teachers on record." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="border-b border-line bg-recessed">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-body">Name</th>
                  <th className="px-4 py-2.5 font-medium text-body">Email</th>
                  <th className="px-4 py-2.5 font-medium text-body">Subject</th>
                  <th className="px-4 py-2.5 font-medium text-body">Role</th>
                  <th className="px-4 py-2.5 text-right font-medium text-body">
                    Password
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2.5 text-ink">{t.full_name}</td>
                    <td className="px-4 py-2.5 text-body">{t.email ?? "—"}</td>
                    <td className="px-4 py-2.5 text-body">
                      {t.subject ?? t.grade_band ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {t.profile_id ? (
                        <Badge value={roleById.get(t.profile_id) ?? "unknown"} />
                      ) : (
                        <Badge value="no account" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {t.profile_id ? (
                        <ResetButton
                          profileId={t.profile_id}
                          name={t.full_name}
                        />
                      ) : (
                        <span className="text-xs text-body">
                          link an account first
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-xs text-body">
        Every reset is written to the audit log — who reset whose account and
        when, never the password itself. Staff can also reset their own password
        from the sign-in page, which depends on email delivery; this page does
        not.
      </p>
    </div>
  );
}
