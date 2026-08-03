"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";

export type SettingState = { error?: string; ok?: string } | undefined;

/**
 * Update one platform setting.
 *
 * Superadmin only at the UI gate; `system_settings_superadmin_write` is the
 * boundary that actually enforces it, so a forged request still fails at the
 * database.
 */
export async function updateSetting(
  _prev: SettingState,
  formData: FormData,
): Promise<SettingState> {
  const user = await requireSuperadmin();
  const supabase = await createClient();

  const key = String(formData.get("key") ?? "").trim();
  const raw = String(formData.get("value") ?? "").trim();

  if (!key) return { error: "Missing setting key." };
  if (!raw) return { error: "Value cannot be empty." };

  // Values are jsonb, so text must be quoted. Say so plainly rather than
  // letting Postgres return a parse error the reader has to decode.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      error:
        'Not valid JSON. Quote text ("Term 3 2026"), and write numbers and true/false bare.',
    };
  }

  const { data: before } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .single();

  const { error } = await supabase
    .from("system_settings")
    .update({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: parsed as any,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (error) return { error: error.message };

  await recordAudit(supabase, {
    actorId: user.id,
    action: "setting.updated",
    entity: "system_settings",
    entityId: key,
    detail: { from: before?.value ?? null, to: parsed },
  });

  revalidatePath("/admin/settings");
  return { ok: "Saved." };
}
