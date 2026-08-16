"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type PositionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

const STATUSES = ["on_track", "behind", "ahead", "complete"] as const;

/**
 * Record where a class currently is in its curriculum.
 *
 * Writes to pacing_monitor, which has existed since the initial schema with
 * the right shape and the right RLS — teacher writes their own class, everyone
 * reads — and has never held a row. Nothing new was needed; it just had no way
 * in.
 *
 * Select-then-write rather than upsert: pacing_monitor has no unique
 * constraint on (class_id, curriculum_module_id), so there is no on_conflict
 * target to name. Adding one is a migration for another day; this is correct
 * either way.
 */
export async function savePosition(
  _prev: PositionState,
  formData: FormData,
): Promise<PositionState> {
  await requireUser();

  const classId = String(formData.get("class_id") ?? "");
  const moduleId = String(formData.get("curriculum_module_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const plannedRaw = String(formData.get("planned_completion_date") ?? "").trim();
  const planned = plannedRaw || null;

  if (!classId || !moduleId) {
    return { ok: false, error: "Choose a class and the module you are on." };
  }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return { ok: false, error: "Choose a valid pacing status." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("pacing_monitor")
    .select("id")
    .eq("class_id", classId)
    .eq("curriculum_module_id", moduleId)
    .maybeSingle();

  // Marking a module complete stamps the date; anything else clears it, so a
  // module that goes back to "behind" does not keep a completion date that is
  // no longer true.
  const actual = status === "complete" ? new Date().toISOString().slice(0, 10) : null;

  const row = {
    class_id: classId,
    curriculum_module_id: moduleId,
    status,
    notes,
    planned_completion_date: planned,
    actual_completion_date: actual,
  };

  const { error } = existing
    ? await supabase.from("pacing_monitor").update(row).eq("id", existing.id)
    : await supabase.from("pacing_monitor").insert(row);

  if (error) {
    return {
      ok: false,
      error: `${error.message}. If this is not your class, only its teacher or an admin can record its position.`,
    };
  }

  revalidatePath("/curriculum-position");
  return {
    ok: true,
    message: existing ? "Position updated." : "Position recorded.",
  };
}
