"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ModelLogo } from "@/components/ModelLogo";
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
        <span className="badge"><span className="dot" style={{ background: "#7fd18f", color: "#04140e" }}>◗</span> Robinhood</span>
      </div>

      {/* Grid */}
      {items === null ? (
        <Grid>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ height: 300, opacity: 0.5 }} />)}</Grid>
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
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>{children}</div>;
}

function AgentCard({ it }: { it: Item }) {
  const p = providerFromId(it.model ?? undefined);
  const hasModel = !!it.model;
  return (
    <Link href={`/token/${it.token}`} className="card" style={{ overflow: "hidden", display: "block" }}>
      {/* Art */}
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: `radial-gradient(130% 130% at 30% 15%, ${p.color}33, transparent 62%), var(--card-2)`, display: "grid", placeItems: "center", borderBottom: "1px solid var(--border)" }}>
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
          <span className="badge"><span className="dot" style={{ background: "#7fd18f", color: "#04140e" }}>◗</span> RH</span>
          {hasModel && <span className="badge">{p.name}</span>}
        </div>
        {it.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.logo} alt="" style={{ width: "56%", aspectRatio: "1", borderRadius: 24, objectFit: "cover" }} onError={(e) => ((e.currentTarget.style.display = "none"))} />
        ) : (
          <ModelLogo model={it.model ?? undefined} size={116} radius={26} />
        )}
        <span style={{ position: "absolute", bottom: 12, left: 12 }} className="badge">fees → compute</span>
      </div>
      {/* Meta */}
      <div style={{ padding: 16 }}>
        <div className="flex items-baseline justify-between gap-2">
          <span style={{ fontWeight: 700, fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.agentName ?? "Agent"}</span>
          <span className="mono" style={{ color: "var(--dim)", fontSize: 13, flexShrink: 0 }}>${it.ticker ?? "—"}</span>
        </div>
        <div className="mono flex items-center gap-2" style={{ marginTop: 8, color: "var(--mut)", fontSize: 12.5 }}>
          <ModelLogo model={it.model ?? undefined} size={18} radius={5} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.modelName ?? (it.model ? modelTail(it.model) : "unlinked")}</span>
        </div>
        <div className="mono flex items-center justify-between" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", color: "var(--dim)", fontSize: 12 }}>
          <span>{shortAddr(it.token)}</span>
          <span>by {shortAddr(it.deployer)}</span>
        </div>
      </div>
    </Link>
  );
}
