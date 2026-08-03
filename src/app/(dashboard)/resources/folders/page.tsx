import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Badge } from "@/components/cell";
import { FolderForm } from "@/app/(dashboard)/resources/folders/folder-form";
import {
  deleteFolder,
  removeFromFolder,
} from "@/app/(dashboard)/resources/actions";

type Item = {
  id: string;
  note: string | null;
  resources: {
    name: string;
    doc_role: string | null;
    file_url: string | null;
    file_size: number | null;
  } | null;
};

function mb(bytes: number | null | undefined) {
  if (!bytes) return "—";
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default async function FoldersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!teacher) {
    return (
      <div>
        <PageHeader
          title="My Folders"
          description="Your own organisation of the curriculum catalogue."
        />
        <Card className="border-amber-200 bg-amber-50 text-sm text-amber-800">
          Folders belong to a teacher record, and your account isn&apos;t linked
          to one yet. Ask an admin to link it, then this page will work.
        </Card>
      </div>
    );
  }

  const [{ data: folders }, { data: items }] = await Promise.all([
    supabase
      .from("planner_folders")
      .select("id, name, parent_id, colour, is_ai_generated, created_at")
      .eq("teacher_id", teacher.id)
      .order("name"),
    supabase
      .from("planner_folder_items")
      .select(
        "id, folder_id, note, resources(name, doc_role, file_url, file_size)",
      )
      .order("sort_order"),
  ]);

  const list = folders ?? [];
  const byFolder = new Map<string, Item[]>();
  for (const it of items ?? []) {
    const arr = byFolder.get(it.folder_id) ?? [];
    arr.push(it as unknown as Item);
    byFolder.set(it.folder_id, arr);
  }

  const roots = list.filter((f) => !f.parent_id);
  const childrenOf = (id: string) => list.filter((f) => f.parent_id === id);

  const renderFolder = (f: (typeof list)[number], depth = 0) => {
    const contents = byFolder.get(f.id) ?? [];
    const kids = childrenOf(f.id);

    return (
      <div key={f.id} style={{ marginLeft: depth * 20 }}>
        <Card className="mb-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-900">{f.name}</p>
              {f.is_ai_generated && <Badge value="ai suggested" />}
              <span className="text-xs text-slate-500">
                {contents.length} item{contents.length === 1 ? "" : "s"}
              </span>
            </div>
            <form action={deleteFolder}>
              <input type="hidden" name="folder_id" value={f.id} />
              <button
                type="submit"
                className="text-xs font-medium text-slate-500 hover:text-red-600"
              >
                Delete
              </button>
            </form>
          </div>

          {contents.length === 0 ? (
            <p className="text-xs text-slate-500">
              Empty — add files from the{" "}
              <Link href="/resources" className="underline">
                catalogue
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {contents.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">
                      {it.resources?.name ?? "(missing file)"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {it.resources?.doc_role
                        ? `${it.resources.doc_role.replace(/_/g, " ")} · `
                        : ""}
                      {mb(it.resources?.file_size)}
                    </p>
                  </div>
                  {it.resources?.file_url && (
                    <a
                      href={it.resources.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900"
                    >
                      Open
                    </a>
                  )}
                  <form action={removeFromFolder}>
                    <input type="hidden" name="item_id" value={it.id} />
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-slate-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {kids.map((k) => renderFolder(k, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="My Folders"
          description="Hanging folders — your own organisation of the curriculum catalogue."
        />
        <Link
          href="/resources"
          className="h-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Browse catalogue
        </Link>
      </div>

      <div className="mb-6">
        <FolderForm parents={list.map((f) => ({ id: f.id, name: f.name }))} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No folders yet. Create one above, then file resources into it from the catalogue." />
      ) : (
        <div>{roots.map((f) => renderFolder(f))}</div>
      )}
    </div>
  );
}
