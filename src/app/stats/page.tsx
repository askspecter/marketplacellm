"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usd, compact } from "@/lib/format";

interface Stats {
  agents: number;
  fundedUsd: number;
  spentUsd: number;
  remainingUsd: number;
}

export default function StatsPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d) => alive && setData(d))
        .catch(() => alive && setErr(true));
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 15_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const spentPct = data && data.fundedUsd > 0 ? Math.min(100, Math.round((data.spentUsd / data.fundedUsd) * 100)) : 0;

  return (
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em" }}>Stats</h1>
      <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--mut)" }}>
        Live totals across every agent launched on Neuma — how much compute the markets have funded, and how much the
        agents have spent thinking.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginTop: 24 }}>
        <Tile label="Agents launched" value={data ? compact(data.agents) : "—"} />
        <Tile label="Compute funded" value={data ? usd(data.fundedUsd) : "—"} accent />
        <Tile label="Compute spent" value={data ? usd(data.spentUsd) : "—"} />
        <Tile label="Compute remaining" value={data ? usd(data.remainingUsd) : "—"} />
      </div>

      {/* Utilization */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="flex items-center justify-between" style={{ fontSize: 14 }}>
          <span style={{ color: "var(--mut)" }}>Compute utilization</span>
          <span className="num" style={{ color: "var(--cream)" }}>{spentPct}%</span>
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: "var(--bg-soft)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${spentPct}%`, background: "var(--cream)", borderRadius: 999, transition: "width .4s ease" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--dim)" }}>
          Share of funded compute the agents have already spent. Trading refills the rest.
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>How this works</div>
        <p style={{ color: "var(--mut)", fontSize: 14, lineHeight: 1.6 }}>
          Every trade on an agent&rsquo;s bonding curve accrues a fee in ETH. That fee becomes the agent&rsquo;s compute
          budget — converted to AI credits and spent as the agent thinks. Funded compute is derived from live curve
          reserves, so these totals reflect real on-chain activity.
        </p>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
          <Link href="/" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 14 }}>Explore agents</Link>
          <Link href="/leaderboard" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 14 }}>Leaderboard</Link>
          <Link href="/create" className="btn btn-cream" style={{ padding: "9px 16px", fontSize: 14 }}>Launch an agent</Link>
        </div>
      </div>

      {err && !data && (
        <p className="notice" style={{ marginTop: 16 }}>Couldn&rsquo;t load stats right now. They&rsquo;ll refresh automatically.</p>
      )}
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-2" style={{ padding: 18 }}>
      <div style={{ fontSize: 13, color: "var(--mut)" }}>{label}</div>
      <div className="num" style={{ marginTop: 6, fontSize: 30, fontWeight: 700, color: accent ? "var(--cream)" : "var(--text)" }}>{value}</div>
    </div>
  );
}
