"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shortAddr } from "@/lib/format";

interface FeedItem {
  token: string;
  curve: string;
  deployer: string;
  model: string | null;
  modelName: string | null;
  agentName: string | null;
  ticker: string | null;
  bio: string | null;
  txHash: string;
}

export function LaunchFeed() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/launches")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setItems(d.launches ?? []);
      })
      .catch(() => alive && setError("Couldn't load the feed."));
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <EmptyCard>{error}</EmptyCard>;
  if (items === null) return <SkeletonGrid />;
  if (items.length === 0)
    return (
      <EmptyCard>
        No launches indexed yet. <Link href="/create" className="text-cyan-soft hover:text-cyan">Be the first →</Link>
      </EmptyCard>
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Link
          key={it.token}
          href={`/token/${it.token}`}
          className="group rounded-xl2 border border-bg-line bg-bg-panel p-4 transition hover:border-cyan/40 hover:shadow-glow"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white group-hover:text-cyan-soft">
              {it.agentName ?? "Unnamed agent"}
              {it.ticker ? <span className="ml-1 font-mono text-xs text-white/40">${it.ticker}</span> : null}
            </span>
            <span className="rounded-full bg-signature-soft px-2 py-0.5 text-[10px] font-semibold text-cyan-soft">
              agent
            </span>
          </div>
          {it.bio && <p className="mt-2 line-clamp-2 text-xs text-white/50">{it.bio}</p>}
          <div className="mt-3 text-xs text-white/40">brain</div>
          <div className="truncate font-mono text-sm text-white/80">{it.modelName ?? "— unlinked —"}</div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/40">
            <span>by {shortAddr(it.deployer)}</span>
            <span className="text-cyan-soft opacity-0 transition group-hover:opacity-100">open →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl2 border border-bg-line bg-bg-panel/60" />
      ))}
    </div>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 border border-dashed border-bg-line bg-bg-panel/50 p-10 text-center text-white/50">
      {children}
    </div>
  );
}
