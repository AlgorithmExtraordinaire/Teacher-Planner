"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar link.
 *
 * Colours come from --sidebar-* rather than the general text tokens, because
 * the sidebar is dark in two themes and light in one. Active state uses
 * --sidebar-active, which each theme sets to something legible on its own
 * sidebar: gold on navy, deep sage on off-white, cyan on near-black.
 */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{
        color: active ? "var(--sidebar-active)" : "var(--sidebar-fg)",
        opacity: active ? 1 : 0.85,
      }}
      className="text-sm font-medium no-underline transition-opacity hover:opacity-100"
    >
      {label}
    </Link>
  );
}
