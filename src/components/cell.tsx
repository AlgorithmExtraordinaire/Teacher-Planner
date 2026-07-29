import type { ColumnKind } from "@/lib/tables/registry";

const BADGE_TONES: Record<string, string> = {
  // status / lifecycle
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  applied: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  on_track: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  complete: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",

  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  running: "bg-amber-50 text-amber-700 ring-amber-600/20",
  draft: "bg-amber-50 text-amber-700 ring-amber-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  monitoring: "bg-amber-50 text-amber-700 ring-amber-600/20",
  behind: "bg-amber-50 text-amber-700 ring-amber-600/20",
  in_review: "bg-amber-50 text-amber-700 ring-amber-600/20",

  error: "bg-red-50 text-red-700 ring-red-600/20",
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  urgent: "bg-red-50 text-red-700 ring-red-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  open: "bg-blue-50 text-blue-700 ring-blue-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  submitted: "bg-blue-50 text-blue-700 ring-blue-600/20",
  holiday: "bg-violet-50 text-violet-700 ring-violet-600/20",
  weekend: "bg-slate-100 text-slate-600 ring-slate-500/20",
  school_day: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const DEFAULT_TONE = "bg-slate-100 text-slate-700 ring-slate-500/20";

export function Badge({ value }: { value: string }) {
  const tone = BADGE_TONES[value.toLowerCase()] ?? DEFAULT_TONE;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${tone}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function formatCell(value: unknown, kind: ColumnKind = "text") {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-300">—</span>;
  }

  switch (kind) {
    case "badge":
      return <Badge value={String(value)} />;
    case "bool":
      return <Badge value={value ? "yes" : "no"} />;
    case "date": {
      const raw = String(value);
      // Date-only columns must not be pushed through a timezone shift.
      const iso = raw.length <= 10 ? raw : new Date(raw).toISOString();
      return <span className="tabular-nums">{iso.slice(0, 10)}</span>;
    }
    case "number":
      return <span className="tabular-nums">{String(value)}</span>;
    default: {
      const text = String(value);
      return text.length > 90 ? (
        <span title={text}>{text.slice(0, 90)}…</span>
      ) : (
        text
      );
    }
  }
}
