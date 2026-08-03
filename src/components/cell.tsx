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

  // Failure states use the brand crimson rather than a generic red, so the
  // one alarming colour in the product is the same everywhere.
  error: "bg-[#f6e7ec] text-crimson ring-crimson/25",
  failed: "bg-[#f6e7ec] text-crimson ring-crimson/25",
  rejected: "bg-[#f6e7ec] text-crimson ring-crimson/25",
  urgent: "bg-[#f6e7ec] text-crimson ring-crimson/25",

  open: "bg-[#eaf0f8] text-navy ring-navy/20",
  info: "bg-[#eaf0f8] text-navy ring-navy/20",
  submitted: "bg-[#eaf0f8] text-navy ring-navy/20",
  school_day: "bg-[#eaf0f8] text-navy ring-navy/20",

  holiday: "bg-violet-50 text-violet-700 ring-violet-600/20",
  inactive: "bg-[#f1f4f8] text-body ring-body/20",
  weekend: "bg-[#f1f4f8] text-body ring-body/20",
};

const DEFAULT_TONE = "bg-[#f1f4f8] text-body ring-body/20";

export function Badge({ value }: { value: string }) {
  const tone = BADGE_TONES[value.toLowerCase()] ?? DEFAULT_TONE;
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${tone}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function formatCell(value: unknown, kind: ColumnKind = "text") {
  if (value === null || value === undefined || value === "") {
    // This dash means "no value recorded", which is information, so it uses
    // the body colour (7.53:1) rather than a near-invisible tint.
    return <span className="text-body">—</span>;
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
