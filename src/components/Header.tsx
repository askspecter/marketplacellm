"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SITE } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40" style={{ background: "rgba(12,12,13,.78)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <div className="wrap flex items-center gap-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/neuma.png" alt="Neuma" width={30} height={30} style={{ borderRadius: 8, display: "block", objectFit: "cover" }} />
          <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.02em" }}>{SITE.name}</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-6 sm:flex" style={{ fontSize: 15 }}>
          {[["Explore", "/"], ["Create", "/create"], ["Portfolio", "/portfolio"], ["Compute", "/compute"]].map(([l, h]) => (
            <Link key={l} href={h} style={{ color: "var(--mut)" }} className="transition-colors hover:text-[var(--text)]">{l}</Link>
          ))}
        </nav>
        <div className="ml-auto">
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} label="Connect" />
        </div>
      </div>
    </header>
  );
}
