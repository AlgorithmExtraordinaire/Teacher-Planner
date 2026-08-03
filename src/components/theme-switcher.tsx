"use client";

import { useEffect, useRef } from "react";

const THEMES = [
  { id: "lean-academy", label: "Lean Academy", hint: "Institutional" },
  { id: "zen-workspace", label: "Zen Workspace", hint: "Minimalist" },
  { id: "deep-work", label: "Deep Work", hint: "Dark" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "tp-theme";
const DEFAULT_THEME: ThemeId = "lean-academy";

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/**
 * Theme selector.
 *
 * Writes `data-theme` on <html>; every colour resolves through CSS variables
 * scoped to that attribute, so no other component needs to know a theme
 * exists. The choice is per-browser (localStorage) rather than per-account —
 * it is a viewing preference, not school data.
 *
 * Deliberately uncontrolled: the true value lives on <html>, set before first
 * paint by the bootstrap script in the root layout. Mirroring it into React
 * state would mean writing state from an effect, which causes a cascading
 * re-render and would briefly disagree with what is already on screen.
 */
export function ThemeSwitcher() {
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    // Sync the control to whatever the bootstrap script already applied.
    const current = document.documentElement.getAttribute("data-theme");
    if (ref.current && isThemeId(current)) {
      ref.current.value = current;
    }
  }, []);

  function apply(next: string) {
    if (!isThemeId(next)) return;
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing or storage disabled: the theme still applies for
      // this session, it just will not be remembered.
    }
  }

  return (
    <>
      <label htmlFor="theme-select" className="sr-only">
        Interface theme
      </label>
      <select
        id="theme-select"
        ref={ref}
        defaultValue={DEFAULT_THEME}
        onChange={(e) => apply(e.target.value)}
        className="rounded-[var(--radius-btn)] px-2 py-1.5 text-sm"
        style={{
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-surface)",
          color: "var(--text-main)",
        }}
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label} · {t.hint}
          </option>
        ))}
      </select>
    </>
  );
}
