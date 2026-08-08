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

/**
 * Document role → badge tone, using the design system's four tones rather
 * than a colour per role. The distinction that matters to a teacher is
 * "is this the pupil's copy or mine", so the two teaching-facing roles take
 * the accent and the pupil-facing one is informational.
 */
const ROLE_TONE: Record<string, string> = {
  student_workbook: "badge-info",
  teacher_edition: "badge-warning",
  additional_materials: "badge-neutral",
  full_module: "badge-success",
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
      <p className="empty-state">
        No files indexed here yet. The Drive crawler populates these as it runs.
      </p>
    );
  }

  return (
    <div>
      {selected.size > 0 && (
        // Selection bar. Sits on the raised panel with an accent rule rather
        // than a filled band: the page ground is already navy, so a navy bar
        // would disappear into it.
        <form
          action={addToFolder}
          className="mb-3 flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 text-sm shadow-[inset_2px_0_0_var(--amber)]"
        >
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="resource_id" value={id} />
          ))}
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-gold">
            {selected.size} selected
          </span>
          {folders.length === 0 ? (
            <span className="text-muted">
              Create a folder first to file these.
            </span>
          ) : (
            <>
              <label htmlFor="folder_id" className="sr-only">
                Destination folder
              </label>
              <select
                id="folder_id"
                name="folder_id"
                required
                className="select w-auto"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary btn-sm">
                Add to folder
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="btn-ghost btn-sm ml-auto"
          >
            Clear
          </button>
        </form>
      )}

      <div className="table-wrap">
        <ul className="divide-y divide-line">
          {resources.map((r) => {
            const isOn = selected.has(r.id);
            return (
              <li
                key={r.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  isOn ? "bg-recessed" : "hover:bg-recessed"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(r.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--amber)]"
                  aria-label={`Select ${r.name}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-main">{r.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
                    {r.section_name ? `${r.section_name} · ` : ""}
                    {mb(r.file_size)}
                  </p>
                </div>
                {r.doc_role && (
                  <span
                    className={`badge hidden shrink-0 sm:inline-flex ${
                      ROLE_TONE[r.doc_role] ?? "badge-neutral"
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
                    className="btn-ghost btn-sm shrink-0"
                  >
                    Open ↗
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
