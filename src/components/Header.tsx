"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SITE } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40" style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      <div className="wrap flex items-center" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <Link href="/" className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/neuma.png" alt="Neuma" width={28} height={28} style={{ borderRadius: 8, display: "block", objectFit: "cover", border: "1px solid var(--border)" }} />
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-.02em" }}>{SITE.name}</span>
        </Link>
        <div className="ml-auto" style={{ flexShrink: 0 }}>
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} label="Connect" />
        </div>
      </div>
    </header>
  );
}
