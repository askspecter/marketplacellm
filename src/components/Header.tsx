"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SITE } from "@/lib/site";

const NAV: [string, string][] = [
  ["Explore", "/"],
  ["Create", "/create"],
  ["Portfolio", "/portfolio"],
  ["Compute", "/compute"],
];

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40" style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <div className="wrap flex items-center gap-3 py-3">
        <Link href="/" className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/neuma.png" alt="Neuma" width={30} height={30} style={{ borderRadius: 8, display: "block", objectFit: "cover" }} />
          <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.02em" }}>{SITE.name}</span>
        </Link>

        {/* Pill nav — desktop/tablet only (mobile navigates via footer + Launch) */}
        <nav className="hidden items-center md:flex" style={{ gap: 4, padding: 4, borderRadius: 999, background: "var(--card-2)", border: "1px solid var(--border)" }}>
          {NAV.map(([l, h]) => {
            const active = isActive(h);
            return (
              <Link key={l} href={h} style={{
                padding: "7px 15px", borderRadius: 999, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap",
                color: active ? "var(--cream-ink)" : "var(--mut)",
                background: active ? "var(--cream)" : "transparent",
              }}>{l}</Link>
            );
          })}
        </nav>

        <div className="ml-auto" style={{ flexShrink: 0 }}>
          <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} label="Connect" />
        </div>
      </div>
    </header>
  );
}
