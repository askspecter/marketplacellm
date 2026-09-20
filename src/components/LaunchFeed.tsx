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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
      {items.map((it) => (
        <Link key={it.token} href={`/token/${it.token}`} data-hover className="feedcard" style={{ background: "var(--bg)", padding: "24px 22px", display: "block" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <span className="display" style={{ fontSize: 24 }}>
              {it.agentName ?? "Unnamed"}
              {it.ticker ? <span className="mono" style={{ marginLeft: 8, fontSize: 12, color: "var(--dim)" }}>${it.ticker}</span> : null}
            </span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent)" }}>agent</span>
          </div>
          {it.bio && <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55, color: "var(--mut)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.bio}</p>}
          <div className="mono" style={{ marginTop: 18, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--dim)" }}>brain</div>
          <div className="mono" style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.modelName ?? "— unlinked —"}</div>
          <div className="mono" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--dim)" }}>
            <span>by {shortAddr(it.deployer)}</span><span>open →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: "var(--bg)", height: 150 }} />
      ))}
    </div>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px dashed var(--line)", padding: 48, textAlign: "center", color: "var(--mut)", fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: ".06em" }}>
      {children}
    </div>
  );
}
