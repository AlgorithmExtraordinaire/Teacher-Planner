"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";

/**
 * Folders belong to a teacher record, not a profile. Staff without a linked
 * teacher row can browse the catalogue but can't file anything yet.
 */
async function currentTeacherId() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  return data?.id ?? null;
}

export type FolderState = { error?: string; ok?: string } | undefined;

export async function createFolder(
  _prev: FolderState,
  formData: FormData,
): Promise<FolderState> {
  const teacherId = await currentTeacherId();
  if (!teacherId) {
    return { error: "No teacher record is linked to your account yet." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the folder a name." };

  const parentId = String(formData.get("parent_id") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase.from("planner_folders").insert({
    teacher_id: teacherId,
    parent_id: parentId,
    name,
    colour: String(formData.get("colour") ?? "") || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/resources/folders");
  return { ok: `Created "${name}".` };
}

export async function addToFolder(formData: FormData) {
  const teacherId = await currentTeacherId();
  if (!teacherId) return;

  const folderId = String(formData.get("folder_id") ?? "");
  const resourceIds = formData.getAll("resource_id").map(String).filter(Boolean);
  if (!folderId || resourceIds.length === 0) return;

  const supabase = await createClient();
  // Ignore duplicates rather than erroring — filing the same PDF twice is a
  // no-op from the teacher's point of view.
  await supabase.from("planner_folder_items").upsert(
    resourceIds.map((resource_id, i) => ({
      folder_id: folderId,
      resource_id,
      sort_order: i,
    })),
    { onConflict: "folder_id,resource_id", ignoreDuplicates: true },
  );

  revalidatePath("/resources/folders");
  revalidatePath("/resources");
}

export async function removeFromFolder(formData: FormData) {
  const teacherId = await currentTeacherId();
  if (!teacherId) return;

  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  await supabase.from("planner_folder_items").delete().eq("id", itemId);

  revalidatePath("/resources/folders");
}

export async function deleteFolder(formData: FormData) {
  const teacherId = await currentTeacherId();
  if (!teacherId) return;

  const folderId = String(formData.get("folder_id") ?? "");
  if (!folderId) return;

  const supabase = await createClient();
  // RLS already scopes this to the caller's own folders; the eq is belt and
  // braces so a stray id can't touch someone else's row.
  await supabase
    .from("planner_folders")
    .delete()
    .eq("id", folderId)
    .eq("teacher_id", teacherId);

  revalidatePath("/resources/folders");
}
