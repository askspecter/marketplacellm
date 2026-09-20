"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** App-style bottom tab bar (mobile only; hidden on desktop via CSS). */
const TABS: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: "/",
    label: "Explore",
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></svg>
    ),
  },
  {
    href: "/create",
    label: "Create",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
    ),
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14h2" /></svg>
    ),
  },
  {
    href: "/compute",
    label: "Compute",
    icon: (
      <svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" /></svg>
    ),
  },
  {
    href: "/docs",
    label: "Docs",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M6 4h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /><path d="M14 4v5h5M8.5 13h7M8.5 16.5h5" /></svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname() || "/";
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            {t.icon}
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
