"use client";

import { useActionState } from "react";
import { saveRegister, type SaveState } from "./actions";

export type Learner = {
  id: string;
  full_name: string;
  student_number: string | null;
  status: string | null;
};

const OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
] as const;

export function RegisterForm({
  classId,
  date,
  learners,
  canMark,
}: {
  classId: string;
  date: string;
  learners: Learner[];
  canMark: boolean;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveRegister,
    undefined,
  );

  const marked = learners.filter((l) => l.status).length;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="date" value={date} />

      <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-sm">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-line bg-recessed">
            <tr>
              <th className="px-4 py-2.5 font-medium text-body">Learner</th>
              <th className="px-4 py-2.5 font-medium text-body">Number</th>
              {OPTIONS.map((o) => (
                <th
                  key={o.value}
                  className="px-3 py-2.5 text-center font-medium text-body"
                >
                  {o.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {learners.map((l) => (
              <tr key={l.id} className="hover:bg-recessed">
                <td className="px-4 py-2 text-ink">{l.full_name}</td>
                <td className="px-4 py-2 font-mono text-xs text-body">
                  {l.student_number ?? "—"}
                </td>
                {OPTIONS.map((o) => (
                  <td key={o.value} className="px-3 py-2 text-center">
                    <input
                      type="radio"
                      name={`status-${l.id}`}
                      value={o.value}
                      defaultChecked={l.status === o.value}
                      disabled={!canMark}
                      aria-label={`${l.full_name}: ${o.label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state?.ok === false && (
        <p role="alert" className="notice notice--danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="notice notice--success">
          Saved {state.saved} mark{state.saved === 1 ? "" : "s"} for{" "}
          {state.date}.
        </p>
      )}

      {canMark ? (
        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : "Save register"}
          </button>
          <span className="text-xs text-body">
            {marked} of {learners.length} already marked. Unmarked learners stay
            unmarked — nobody is recorded present by default.
          </span>
        </div>
      ) : (
        <p className="text-xs text-body">
          Read-only: only this class&rsquo;s teacher or an admin can mark it.
        </p>
      )}
    </form>
  );
}
