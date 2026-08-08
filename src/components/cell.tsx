import type { ColumnKind } from "@/lib/tables/registry";

/**
 * Status vocabulary → badge tone.
 *
 * The design system has four tones, not a colour per status. Mapping many
 * statuses onto few tones is deliberate: a reader learns "green means
 * settled, amber means in flight, red means it failed, blue means it is
 * open" once, and then reads every table in the product without a legend.
 *
 * Tones are the template accents at 15% fill with a full-strength label —
 * never a saturated fill behind small text.
 */
const BADGE_TONES: Record<string, string> = {
  // Settled — the work is done and needs nothing.
  active: "badge-success",
  approved: "badge-success",
  applied: "badge-success",
  success: "badge-success",
  on_track: "badge-success",
  complete: "badge-success",
  resolved: "badge-success",
  yes: "badge-success",

  // In flight — someone owes this an action.
  pending: "badge-warning",
  running: "badge-warning",
  draft: "badge-warning",
  warning: "badge-warning",
  monitoring: "badge-warning",
  behind: "badge-warning",
  in_review: "badge-warning",

  // Failed or refused.
  error: "badge-danger",
  failed: "badge-danger",
  rejected: "badge-danger",
  urgent: "badge-danger",

  // Open / informational.
  open: "badge-info",
  info: "badge-info",
  submitted: "badge-info",
  school_day: "badge-info",
  holiday: "badge-info",

  // No state worth colouring.
  inactive: "badge-neutral",
  weekend: "badge-neutral",
  no: "badge-neutral",
};

const DEFAULT_TONE = "badge-neutral";

export function Badge({ value }: { value: string }) {
  const tone = BADGE_TONES[value.toLowerCase()] ?? DEFAULT_TONE;
  return <span className={`badge ${tone}`}>{value.replace(/_/g, " ")}</span>;
}

export function formatCell(value: unknown, kind: ColumnKind = "text") {
  if (value === null || value === undefined || value === "") {
    // "No value recorded" is information, so it renders in the muted
    // foreground (5.19:1 on a panel) rather than a near-invisible tint.
    return <span className="text-muted">—</span>;
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
      return <span className="cell-num">{iso.slice(0, 10)}</span>;
    }
    case "number":
      return <span className="cell-num">{String(value)}</span>;
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
