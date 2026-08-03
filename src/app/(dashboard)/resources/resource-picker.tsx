"use client";

import { useState } from "react";
import { addToFolder } from "@/app/(dashboard)/resources/actions";

type Resource = {
  id: string;
  name: string;
  doc_role: string | null;
  file_size: number | null;
  file_url: string | null;
  section_name: string | null;
};

type Folder = { id: string; name: string };

const ROLE_LABEL: Record<string, string> = {
  student_workbook: "Student workbook",
  teacher_edition: "Teacher edition",
  additional_materials: "Additional materials",
  full_module: "Full module",
  curriculum_outline: "Curriculum outline",
  other: "Other",
};

const ROLE_TONE: Record<string, string> = {
  student_workbook: "bg-blue-50 text-blue-700 ring-blue-600/20",
  teacher_edition: "bg-violet-50 text-violet-700 ring-violet-600/20",
  additional_materials: "bg-amber-50 text-amber-700 ring-amber-600/20",
  full_module: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

function mb(bytes: number | null) {
  if (!bytes) return "—";
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Multi-select over the catalogue. Selection is client state; filing is a
 * server action, so the whole thing works without optimistic bookkeeping.
 */
export function ResourcePicker({
  resources,
  folders,
}: {
  resources: Resource[];
  folders: Folder[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (resources.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No files indexed here yet. The Drive crawler populates these as it runs.
      </div>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        <form
          action={addToFolder}
          className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-900 bg-slate-900 px-4 py-3 text-sm text-white"
        >
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="resource_id" value={id} />
          ))}
          <span className="font-medium">
            {selected.size} selected
          </span>
          {folders.length === 0 ? (
            <span className="text-slate-300">
              Create a folder first to file these.
            </span>
          ) : (
            <>
              <select
                name="folder_id"
                required
                className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                Add to folder
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-slate-300 hover:text-white"
          >
            Clear
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {resources.map((r) => {
            const isOn = selected.has(r.id);
            return (
              <li
                key={r.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  isOn ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(r.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300"
                  aria-label={`Select ${r.name}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-500">
                    {r.section_name ? `${r.section_name} · ` : ""}
                    {mb(r.file_size)}
                  </p>
                </div>
                {r.doc_role && (
                  <span
                    className={`hidden shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset sm:inline ${
                      ROLE_TONE[r.doc_role] ??
                      "bg-slate-100 text-slate-700 ring-slate-500/20"
                    }`}
                  >
                    {ROLE_LABEL[r.doc_role] ?? r.doc_role}
                  </span>
                )}
                {r.file_url && (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    Open
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
