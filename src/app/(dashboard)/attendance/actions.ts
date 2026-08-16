"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type SaveState =
  | { ok: true; saved: number; date: string }
  | { ok: false; error: string }
  | undefined;

const STATUSES = new Set(["present", "absent", "late", "excused"]);

/**
 * Save a day's register for one class.
 *
 * Upserts on (class_id, student_id, date), so re-saving a corrected mark
 * updates it rather than stacking a second contradictory row. RLS decides
 * whether this caller owns the class — the check here is not the boundary,
 * it just produces a better message than a bare policy rejection.
 */
export async function saveRegister(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await requireUser();
  const classId = String(formData.get("class_id") ?? "");
  const date = String(formData.get("date") ?? "");

  if (!classId || !date) {
    return { ok: false, error: "Choose a class and a date first." };
  }

  // Marks arrive as status-<studentId>. Anything unmarked is left alone
  // rather than defaulted to present: an unmarked learner is a register that
  // was not completed, and recording them present would be inventing a fact
  // about a child's day.
  const rows: {
    class_id: string;
    student_id: string;
    date: string;
    status: string;
    recorded_by: string;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status-")) continue;
    const status = String(value);
    if (!STATUSES.has(status)) continue;
    rows.push({
      class_id: classId,
      student_id: key.slice("status-".length),
      date,
      status,
      recorded_by: user.id,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "Nothing marked yet." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "class_id,student_id,date" });

  if (error) {
    // The most likely cause by far is a teacher opening a class that is not
    // theirs, so name that possibility instead of only echoing Postgres.
    return {
      ok: false,
      error: `${error.message}. If this is not your class, only its teacher or an admin can mark it.`,
    };
  }

  revalidatePath("/attendance");
  return { ok: true, saved: rows.length, date };
}
