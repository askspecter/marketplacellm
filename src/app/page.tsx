"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ModelLogo } from "@/components/ModelLogo";
import { RhBadge } from "@/components/RhBadge";
import { providerFromId, modelTail } from "@/lib/models";
import { shortAddr } from "@/lib/format";

interface Item {
  token: string;
  deployer: string;
  model: string | null;
  modelName: string | null;
  agentName: string | null;
  ticker: string | null;
  bio: string | null;
  logo: string | null;
}

type Tab = "trending" | "new";

export default function ExplorePage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("trending");

  useEffect(() => {
    let alive = true;
    fetch("/api/launches")
      .then((r) => r.json())
      .then((d) => alive && setItems(d.launches ?? []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    let l = items ?? [];
    const s = q.trim().toLowerCase();
    if (s) l = l.filter((it) => `${it.agentName} ${it.ticker} ${it.modelName}`.toLowerCase().includes(s));
    return l;
  }, [items, q, tab]);

  return (
    <div className="wrap" style={{ paddingTop: 22, paddingBottom: 40 }}>
      {/* Search + create */}
      <div className="flex gap-3" style={{ marginBottom: 26 }}>
        <input className="input" placeholder="Search agents by name, ticker or model…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Link href="/create" className="btn btn-cream" style={{ whiteSpace: "nowrap" }}>+ Launch</Link>
      </div>

      {/* Heading + count */}
      <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.02em" }}>Explore</h1>
        <span className="pill pill--sm">{items ? items.length : "—"} launched</span>
      </div>

      {/* Tabs + chain filter */}
      <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 22 }}>
        <button className={`pill ${tab === "trending" ? "pill--active" : ""}`} onClick={() => setTab("trending")}>Trending</button>
        <button className={`pill ${tab === "new" ? "pill--active" : ""}`} onClick={() => setTab("new")}>New</button>
        <span style={{ width: 12 }} />
        <RhBadge label="Robinhood" />
      </div>

      {/* Grid */}
      {items === null ? (
        <Grid>{Array.from({ length: 8 }).map((_, i) => <div key={i} className="agent-card" style={{ height: 232, opacity: 0.45 }} />)}</Grid>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--mut)" }}>
          No agents yet. <Link href="/create" style={{ color: "var(--text)", textDecoration: "underline" }}>Launch the first →</Link>
        </div>
      ) : (
        <Grid>{list.map((it) => <AgentCard key={it.token} it={it} />)}</Grid>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(178px, 1fr))", gap: 12 }}>{children}</div>;
}

function initials(s?: string | null): string {
  return (s || "?").replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
}
function hashHsl(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}, 46%, 40%)`;
}

function AgentCard({ it }: { it: Item }) {
  const p = providerFromId(it.model ?? undefined);
  const hasModel = !!it.model;
  const [imgOk, setImgOk] = useState(true);
  const mono = initials(it.ticker ?? it.agentName);
  return (
    <Link href={`/token/${it.token}`} className="agent-card">
      {/* Art */}
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: `radial-gradient(120% 120% at 30% 12%, ${p.color}2e, transparent 60%), var(--card-2)`, display: "grid", placeItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}><RhBadge /></div>
        {hasModel && <span className="badge" style={{ position: "absolute", top: 8, right: 8, zIndex: 2, padding: "3px 7px", fontSize: 10 }}>{p.name}</span>}
        {it.logo && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgOk(false)} />
        ) : hasModel ? (
          <ModelLogo model={it.model ?? undefined} size={78} radius={20} />
        ) : (
          <div style={{ width: "52%", aspectRatio: "1", borderRadius: 18, background: hashHsl(mono), display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 30 }}>{mono}</div>
        )}
      </div>
      {/* Meta */}
      <div style={{ padding: "11px 12px 12px" }}>
        <div className="flex items-baseline justify-between gap-2">
          <span style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.agentName ?? "Agent"}</span>
          <span className="mono" style={{ color: "var(--dim)", fontSize: 11.5, flexShrink: 0 }}>${it.ticker ?? "—"}</span>
        </div>
        {it.model ? (
          <div className="mono flex items-center gap-1.5" style={{ marginTop: 7, color: "var(--mut)", fontSize: 11 }}>
            <ModelLogo model={it.model} size={14} radius={4} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.modelName ?? modelTail(it.model)}</span>
          </div>
        ) : (
          <div className="mono" style={{ marginTop: 7, color: "var(--dim)", fontSize: 11 }}>Robinhood Chain token</div>
        )}
        <div className="flex items-center justify-between" style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".03em", textTransform: "uppercase", color: "var(--cream)" }}>fees → compute</span>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--dim)" }}>{shortAddr(it.token)}</span>
        </div>
      </div>
    </Link>
  );
}
