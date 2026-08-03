"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar link with an active state.
 *
 * The active marker is a gold rail on navy — 5.76:1, comfortably legible.
 * Gold is confined to this dark surface; on white it measures 2.10:1 and
 * would fail, so it never leaves the sidebar.
 */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "relative rounded-sm py-2 pl-4 pr-2 text-sm transition-colors",
        active
          ? "bg-navy-hover font-semibold text-white"
          : "font-medium text-navy-fg hover:bg-navy-hover hover:text-white",
      ].join(" ")}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-gold"
        />
      )}
      {label}
    </Link>
  );
}
