import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import { PageHeader, Card } from "@/components/ui";
import { ResourcePicker } from "@/app/(dashboard)/resources/resource-picker";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; grade?: string; q?: string }>;
}) {
  const { subject, grade, q } = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: collections }, { data: teacher }] = await Promise.all([
    supabase
      .from("resource_collections")
      .select("id, name, subject, grade_level, module_name, depth, path")
      .order("subject")
      .order("depth")
      .order("name"),
    supabase.from("teachers").select("id").eq("profile_id", user.id).maybeSingle(),
  ]);

  const all = collections ?? [];
  const subjects = [...new Set(all.map((c) => c.subject).filter(Boolean))] as string[];
  const grades = [
    ...new Set(
      all
        .filter((c) => (subject ? c.subject === subject : true))
        .map((c) => c.grade_level)
        .filter(Boolean),
    ),
  ] as string[];

  // Collections matching the current filter, and everything nested beneath them.
  const matching = all.filter(
    (c) =>
      (!subject || c.subject === subject) &&
      (!grade || c.grade_level === grade),
  );
  const matchingIds = matching.map((c) => c.id);

  let resources: Awaited<ReturnType<typeof fetchResources>> = [];
  if (matchingIds.length > 0) {
    resources = await fetchResources(supabase, matchingIds, q);
  }

  const folders = teacher
    ? ((
        await supabase
          .from("planner_folders")
          .select("id, name")
          .eq("teacher_id", teacher.id)
          .order("name")
      ).data ?? [])
    : [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Curriculum Resources"
          description="Engage NY Mathematics and English Language Arts, PreK through Grade 8."
        />
        <Link
          href="/resources/folders"
          className="h-fit rounded-md border border-line px-3 py-2 text-sm font-medium text-body hover:bg-[#f1f4f8]"
        >
          My folders
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-body">Subject</label>
          <select
            name="subject"
            defaultValue={subject ?? ""}
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-body">Grade</label>
          <select
            name="grade"
            defaultValue={grade ?? ""}
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">All grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-body">Search</label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Filename or topic…"
            className="rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-crimson px-4 py-2 text-sm font-medium text-white hover:bg-crimson-hover"
        >
          Filter
        </button>
        {(subject || grade || q) && (
          <Link
            href="/resources"
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-body hover:bg-[#f1f4f8]"
          >
            Reset
          </Link>
        )}
      </form>

      {!teacher && (
        <Card className="mb-4 border-amber-200 bg-amber-50 text-sm text-amber-800">
          You can browse the catalogue, but filing resources needs a teacher
          record linked to your account.
        </Card>
      )}

      <p className="mb-3 text-sm text-body">
        {resources.length} file{resources.length === 1 ? "" : "s"} across{" "}
        {matching.length} collection{matching.length === 1 ? "" : "s"}
      </p>

      <ResourcePicker resources={resources} folders={folders} />
    </div>
  );
}

async function fetchResources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  collectionIds: string[],
  q?: string,
) {
  let query = supabase
    .from("resources")
    .select("id, name, doc_role, file_size, file_url, section_name")
    .in("collection_id", collectionIds)
    .order("name")
    .limit(200);

  if (q) query = query.ilike("name", `%${q}%`);

  const { data } = await query;
  return data ?? [];
}
