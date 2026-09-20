"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SITE } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40" style={{ background: "rgba(10,10,11,.72)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
      <div className="wrap flex items-center gap-8 py-4">
        <Link href="/" className="display text-2xl" data-hover>
          {SITE.name.slice(0, 3)}<span style={{ color: "var(--accent)" }}>{SITE.name.slice(3)}</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-7 sm:flex" style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>
          <Link href="/create" style={{ color: "var(--mut)" }} className="transition hover:!text-[var(--ink)]">Launch</Link>
          <Link href="/#agents" style={{ color: "var(--mut)" }} className="transition hover:!text-[var(--ink)]">Agents</Link>
          <Link href="/compute" style={{ color: "var(--mut)" }} className="transition hover:!text-[var(--ink)]">Compute</Link>
          <Link href="/portfolio" style={{ color: "var(--mut)" }} className="transition hover:!text-[var(--ink)]">Portfolio</Link>
        </nav>
        <div className="ml-auto">
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} label="Connect" />
        </div>
      </div>
    </header>
  );
}
