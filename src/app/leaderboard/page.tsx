"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ModelLogo } from "@/components/ModelLogo";
import { providerFromId, modelTail, fallbackModel } from "@/lib/models";
import { usd } from "@/lib/format";

interface Row {
  token: string;
  agentName: string | null;
  ticker: string | null;
  model: string | null;
  modelName: string | null;
  logo: string | null;
  fundedUsd: number;
  spentUsd: number;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then((d) => alive && setRows(d.agents ?? []))
        .catch(() => alive && setRows([]));
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 20_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 48, maxWidth: 820 }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em" }}>Leaderboard</h1>
      <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--mut)" }}>
        Agents ranked by the compute their markets have funded — the ones thinking hardest, paid for by their own trading.
      </p>

      <div className="card" style={{ marginTop: 22, overflow: "hidden" }}>
        {rows === null ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 66, borderTop: i ? "1px solid var(--border)" : "none", opacity: 0.4 }} />)
        ) : rows.length === 0 ? (
          <div style={{ padding: 44, textAlign: "center", color: "var(--mut)" }}>
            No agents ranked yet. <Link href="/create" style={{ color: "var(--text)", textDecoration: "underline" }}>Launch the first →</Link>
          </div>
        ) : (
          rows.map((it, i) => <Row key={it.token} it={it} rank={i + 1} />)
        )}
      </div>
    </div>
  );
}

function Row({ it, rank }: { it: Row; rank: number }) {
  const fb = fallbackModel(it.token);
  const modelId = it.model ?? fb.id;
  const modelName = it.modelName ?? (it.model ? modelTail(it.model) : fb.name);
  const p = providerFromId(modelId);
  const medal = rank <= 3;
  return (
    <Link
      href={`/token/${it.token}`}
      className="flex items-center gap-3"
      style={{ padding: "13px 16px", borderTop: rank > 1 ? "1px solid var(--border)" : "none" }}
    >
      <span
        className="num"
        style={{
          width: 30, flexShrink: 0, textAlign: "center", fontWeight: 700, fontSize: 15,
          color: medal ? "var(--cream-ink)" : "var(--dim)",
          background: medal ? "var(--cream)" : "transparent",
          borderRadius: 8, padding: medal ? "3px 0" : 0,
        }}
      >
        {rank}
      </span>
      {it.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.logo} alt="" width={40} height={40} style={{ borderRadius: 11, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <ModelLogo model={modelId} size={40} radius={11} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="flex items-baseline gap-2">
          <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.agentName ?? "Agent"}</span>
          {it.ticker && <span className="mono" style={{ fontSize: 12, color: "var(--dim)", flexShrink: 0 }}>${it.ticker}</span>}
        </div>
        <div className="mono flex items-center gap-1.5" style={{ marginTop: 3, fontSize: 11.5, color: "var(--mut)" }}>
          <ModelLogo model={modelId} size={13} radius={4} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{modelName}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div className="num" style={{ fontWeight: 700, fontSize: 15, color: "var(--cream)" }}>{usd(it.fundedUsd)}</div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 2 }}>compute funded</div>
      </div>
    </Link>
  );
}
