"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar link.
 *
 * The active state is set with `aria-current="page"` and styled from that
 * attribute in globals.css, so the accessible state and the visible state
 * are the same fact — they cannot disagree. It carries an amber label, a
 * tinted ground and an inset left rule, so the current page is identifiable
 * without relying on colour alone.
 */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();

  // `/dashboard` must match exactly. Every other route is a prefix match so
  // that a detail page (e.g. /agent/<id>) still lights up its section, but
  // the boundary is checked to stop /resources highlighting for
  // /resources-archive.
  const active =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="side__link"
    >
      {label}
    </Link>
  );
}
