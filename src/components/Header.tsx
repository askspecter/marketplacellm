"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-bg-line">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-signature text-black font-mono text-sm shadow-glow">
            &gt;_
          </span>
          <span className="text-lg">LLMPad</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 text-sm text-white/60 sm:flex">
          <Link href="/create" className="transition hover:text-white">Launch</Link>
          <Link href="/#feed" className="transition hover:text-white">Feed</Link>
          <Link href="/compute" className="transition hover:text-white">Compute</Link>
          <Link href="/portfolio" className="transition hover:text-white">Portfolio</Link>
        </nav>

        <div className="ml-auto">
          <ConnectButton
            accountStatus="address"
            chainStatus="icon"
            showBalance={false}
            label="Connect wallet"
          />
        </div>
      </div>
    </header>
  );
}
