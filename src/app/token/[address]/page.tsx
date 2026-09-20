"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { TradeWidget, type CurveInputsSerialized } from "@/components/TradeWidget";
import { PriceChart } from "@/components/PriceChart";
import { AgentConsole } from "@/components/AgentConsole";
import { ModelLogo } from "@/components/ModelLogo";
import { RhBadge } from "@/components/RhBadge";
import { providerFromId } from "@/lib/models";
import { shortAddr, usd } from "@/lib/format";

interface TokenData {
  token: string; name: string; symbol: string; decimals: number; logo: string; description: string;
  deployer: string; curveAddress: string; pairToken: string; phase: number; phaseLabel: string;
  curve: { quoteReserve: string; tokenReserve: string; realQuoteReserve: string; graduationThreshold: string; sellableTokens: string; graduated: boolean; progress: number; spotPrice: number; feeBps: string; creatorTaxBps: string; } | null;
  error?: string;
}
interface PoolData {
  link: { model: string; modelName: string; agentName?: string; ticker?: string; bio?: string; personality?: string; temperature?: number } | null;
  spendUsd: number; creditedUsd: number; remainingUsd: number;
}

export default function AgentPage({ params }: { params: { address: string } }) {
  const address = params.address;
  const [data, setData] = useState<TokenData | null>(null);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAddress(address)) { setLoading(false); return; }
    let alive = true;
    const load = () => Promise.all([
      fetch(`/api/v2/token?address=${address}`).then((r) => r.json()),
      fetch(`/api/pool?token=${address}`).then((r) => r.json()),
    ]).then(([t, p]) => { if (!alive) return; setData(t); setPool(p); }).catch(() => {}).finally(() => alive && setLoading(false));
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 12_000);
    return () => { alive = false; clearInterval(id); };
  }, [address]);

  if (!isAddress(address)) return <Shell>Invalid address.</Shell>;
  if (loading) return <Shell>Loading agent…</Shell>;

  const model = pool?.link ?? null;
  const agentName = model?.agentName || data?.name || "Agent";
  const bio = model?.bio || data?.description || "";
  const curve = data?.curve ?? null;
  const isNative = !data?.pairToken || data.pairToken === "0x0000000000000000000000000000000000000000";
  const progressPct = curve ? Math.min(100, Math.round(curve.progress * 100)) : 0;
  const p = providerFromId(model?.model);

  const serialized: CurveInputsSerialized | null = curve ? {
    quoteReserve: curve.quoteReserve, tokenReserve: curve.tokenReserve, sellableTokens: curve.sellableTokens,
    feeBps: curve.feeBps, creatorTaxBps: curve.creatorTaxBps, graduated: curve.graduated,
  } : null;

  return (
    <div className="wrap" style={{ paddingTop: 18, paddingBottom: 44 }}>
      <Link href="/" style={{ color: "var(--dim)", fontSize: 14 }}>← Explore</Link>

      <div className="mt-4 split">
        {/* Left */}
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center gap-4">
              <ModelLogo model={model?.model} size={56} radius={16} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 22 }}>{agentName}</span>
                  {model?.ticker && <span className="mono" style={{ color: "var(--dim)" }}>${model.ticker}</span>}
                  <RhBadge />
                </div>
                <div className="mono" style={{ marginTop: 4, fontSize: 12, color: "var(--dim)" }}>{shortAddr(address)} · by {shortAddr(data?.deployer ?? "")}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
              <span className="badge">fees → compute</span>
              <span className="badge"><span className="dot" style={{ background: p.color, color: p.ink }}>{p.short}</span> {p.name} · {model?.modelName ?? "unlinked"}</span>
              <span className="badge">Paired with ETH</span>
            </div>
            {bio && <p style={{ marginTop: 14, color: "var(--mut)", fontSize: 14.5, lineHeight: 1.6 }}>{bio}</p>}
          </div>

          {/* Price + funded */}
          <div className="duo">
            <div className="card-2" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, color: "var(--mut)" }}>Price</div>
              <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{curve ? `${curve.spotPrice.toPrecision(4)}` : "—"}<span style={{ fontSize: 13, color: "var(--dim)" }}> ETH</span></div>
            </div>
            <div className="card-2" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, color: "var(--mut)" }}>Compute funded</div>
              <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--cream)" }}>{usd(pool?.creditedUsd ?? 0)}</div>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}><PriceChart token={address} quoteSymbol={isNative ? "ETH" : "quote"} /></div>

          {/* Curve progress */}
          {curve && !curve.graduated && (
            <div className="card-2" style={{ padding: 18 }}>
              <div className="flex justify-between" style={{ fontSize: 14 }}><span style={{ color: "var(--mut)" }}>Bonding-curve progress</span><span className="num" style={{ color: "var(--cream)" }}>{progressPct}%</span></div>
              <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: "var(--bg-soft)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--cream)", borderRadius: 999 }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--dim)" }}>Graduates to Uniswap V4 when the curve fills.</div>
            </div>
          )}

          {/* About */}
          {(bio || model?.personality) && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>About</div>
              {bio && <p style={{ color: "var(--mut)", fontSize: 14, lineHeight: 1.6 }}>{bio}</p>}
              {model?.personality && (
                <details style={{ marginTop: bio ? 12 : 0 }}>
                  <summary style={{ cursor: "pointer", color: "var(--cream)", fontSize: 13 }}>Personality (system prompt)</summary>
                  <p style={{ marginTop: 8, whiteSpace: "pre-wrap", color: "var(--mut)", fontSize: 13, lineHeight: 1.6 }}>{model.personality}</p>
                </details>
              )}
            </div>
          )}

          {/* Details */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Details</div>
            <Detail k="Contract" v={shortAddr(address)} />
            <Detail k="Bonding curve" v={shortAddr(data?.curveAddress ?? "")} />
            <Detail k="Creator" v={shortAddr(data?.deployer ?? "")} />
            <Detail k="Paired asset" v="ETH (native)" />
            <Detail k="Brain" v={`${p.name} · ${model?.modelName ?? "—"}`} />
            <Detail k="Phase" v={data?.phaseLabel ?? "—"} />
            <Detail k="Compute funded" v={usd(pool?.creditedUsd ?? 0)} />
          </div>

          <p className="notice">This is a demo interface. Agents, markets and compute figures may be simulated; tokens can be volatile or lose all value. You sign every transaction — {"Neuma"} does not custody assets or give financial advice.</p>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {serialized && data?.curveAddress ? (
            <TradeWidget curve={data.curveAddress as `0x${string}`} token={address as `0x${string}`} tokenSymbol={data.symbol || model?.ticker || "TOKEN"} quoteIsNative={isNative} quoteDecimals={18} quoteSymbol={isNative ? "ETH" : "quote"} state={serialized} />
          ) : (
            <div className="card-2" style={{ padding: 18, fontSize: 14, color: "var(--mut)" }}>Trading isn’t available (not on an active curve, or chain unreachable).</div>
          )}

          {/* Compute pool */}
          <div className="card" style={{ padding: 18 }}>
            <div className="flex items-center justify-between"><span style={{ fontWeight: 600 }}>Compute pool</span><span className="badge">fees → inference</span></div>
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 14 }}>
              <Stat label="Funded" value={usd(pool?.creditedUsd ?? 0)} />
              <Stat label="Spent" value={usd(pool?.spendUsd ?? 0)} />
              <Stat label="Left" value={usd(pool?.remainingUsd ?? 0)} />
            </div>
          </div>

          {model && <AgentConsole token={address} agentName={agentName} />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-2" style={{ padding: 12 }}>
      <div style={{ fontSize: 11, color: "var(--dim)" }}>{label}</div>
      <div className="num" style={{ marginTop: 4, fontWeight: 700, fontSize: 15 }}>{value}</div>
    </div>
  );
}
function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: 14 }}>
      <span style={{ color: "var(--mut)" }}>{k}</span>
      <span className="mono">{v}</span>
    </div>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="wrap" style={{ paddingTop: 80, textAlign: "center", color: "var(--mut)" }}>{children}</div>;
}
