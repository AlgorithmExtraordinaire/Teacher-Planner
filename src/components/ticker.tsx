/**
 * Scrolling figure strip — the template's ticker bar.
 *
 * In the template this carried instrument prices. Here it carries school
 * figures, and they are real: the caller passes counts read from the
 * database. Nothing on this strip is invented, because a fabricated number
 * in a chrome position is the kind that gets quoted in a meeting.
 *
 * The strip is decorative in the sense that every figure it shows is also
 * available on a page — so the whole thing is aria-hidden and the animation
 * respects prefers-reduced-motion (see globals.css). Screen-reader users
 * lose nothing; they would otherwise get a stream of numbers with no
 * context, read twice, because the track is duplicated to loop seamlessly.
 */

export type TickerItem = {
  /** Short mono label, e.g. "LEARNERS". */
  symbol: string;
  /** The figure itself. */
  value: string;
  /** Optional movement or qualifier, e.g. "3 unstaffed". */
  delta?: string;
  /** Colours the delta. Omit when the figure is neutral. */
  direction?: "up" | "down";
};

export function Ticker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;

  const row = (keyPrefix: string) =>
    items.map((it) => (
      <span className="ticker__item" key={`${keyPrefix}-${it.symbol}`}>
        <span className="ticker__sym">{it.symbol}</span>
        <span className="ticker__val">{it.value}</span>
        {it.delta && (
          <span
            className={
              it.direction === "up"
                ? "ticker__delta--up"
                : it.direction === "down"
                  ? "ticker__delta--down"
                  : "ticker__val"
            }
          >
            {it.delta}
          </span>
        )}
      </span>
    ));

  return (
    <div className="ticker" aria-hidden="true">
      {/* The track holds the list twice and translates by -50%, which is what
          makes the loop seamless. The copy is in markup rather than CSS
          because there is no way to duplicate content in CSS that also
          animates as one rigid track. */}
      <div className="ticker__track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
