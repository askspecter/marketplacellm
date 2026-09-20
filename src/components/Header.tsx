"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SITE } from "@/lib/site";

export function Header() {
  return (
    <header style={{ background: "var(--bg)" }}>
      <div className="wrap flex items-center py-3">
        <Link href="/" className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/neuma.png" alt="Neuma" width={30} height={30} style={{ borderRadius: 8, display: "block", objectFit: "cover" }} />
          <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.02em" }}>{SITE.name}</span>
        </Link>
        <div className="ml-auto" style={{ flexShrink: 0 }}>
          <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} label="Connect" />
        </div>
      </div>
    </header>
  );
}
