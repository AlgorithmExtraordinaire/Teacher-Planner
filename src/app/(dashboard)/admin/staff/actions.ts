"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaffAdmin, isSuperadmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";

export type ResetResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string }
  | undefined;

/**
 * No ambiguous glyphs (0/O, 1/l/I). These are read off a screen and typed by
 * hand by someone who has already failed to log in once; a password that is
 * hard to transcribe turns one support call into two.
 */
function tempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i += 1) out += alphabet[randomInt(alphabet.length)];
  return `Sca-${out}`;
}

/**
 * Issue a temporary password for a member of staff.
 *
 * The email route depends on Supabase's built-in sender, which is rate limited
 * and lands in spam often enough that it cannot be the only way back into an
 * account on a Monday morning. This route depends on nothing but a person.
 */
export async function resetStaffPassword(
  _prev: ResetResult,
  formData: FormData,
): Promise<ResetResult> {
  const actor = await requireStaffAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) return { ok: false, error: "No account selected." };

  const supabase = await createClient();

  // Read the target through the CALLER's session, not the service client, so
  // RLS still decides what this admin may see.
  const { data: target } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", profileId)
    .maybeSingle();

  if (!target) return { ok: false, error: "That account is not visible to you." };

  // An admin resetting a superadmin's password would be a straight privilege
  // escalation: take the account, inherit the platform. Only a superadmin may
  // reset a superadmin.
  if (target.role === "superadmin" && !isSuperadmin(actor)) {
    return {
      ok: false,
      error: "Only a superadmin may reset a superadmin account.",
    };
  }

  const password = tempPassword();
  const service = createServiceClient();

  const { data: updated, error } = await service.auth.admin.updateUserById(
    profileId,
    { password },
  );
  if (error) return { ok: false, error: error.message };

  await recordAudit(supabase, {
    actorId: actor.id,
    action: "staff.password_reset",
    entity: "profiles",
    entityId: profileId,
    // The password itself is never recorded — the audit trail answers who did
    // what to whom, not what the secret was.
    detail: { target_name: target.full_name, target_role: target.role },
  });

  revalidatePath("/admin/staff");
  return {
    ok: true,
    email: updated.user?.email ?? "(unknown address)",
    password,
  };
}
