"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { TradeWidget, type CurveInputsSerialized } from "@/components/TradeWidget";
import { PriceChart } from "@/components/PriceChart";
import { AgentConsole } from "@/components/AgentConsole";
import { ClaimFees } from "@/components/ClaimFees";
import { OrbioCredits } from "@/components/OrbioCredits";
import { CopyButton } from "@/components/CopyButton";
import { ModelLogo } from "@/components/ModelLogo";
import { RhBadge } from "@/components/RhBadge";
import { providerFromId } from "@/lib/models";
import { shortAddr, usd, usdPrice, usdFull, smallNum } from "@/lib/format";

interface TokenData {
  token: string; name: string; symbol: string; decimals: number; logo: string; description: string;
  totalSupply?: string | null; ethUsd?: number | null;
  deployer: string; creatorFeeRecipient?: string; curveAddress: string; pairToken: string; phase: number; phaseLabel: string;
  curve: { quoteReserve: string; tokenReserve: string; realQuoteReserve: string; graduationThreshold: string; sellableTokens: string; graduated: boolean; progress: number; spotPrice: number; feeBps: string; creatorTaxBps: string; } | null;
  error?: string;
}
interface PoolData {
  link: { model: string; modelName: string; agentName?: string; ticker?: string; bio?: string; logo?: string; personality?: string; temperature?: number } | null;
  spendUsd: number; creditedUsd: number; remainingUsd: number;
}

export default function AgentPage({ params }: { params: { address: string } }) {
  const address = params.address;
  const { address: wallet } = useAccount();
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
  const logo = model?.logo || data?.logo || "";
  const curve = data?.curve ?? null;
  const isNative = !data?.pairToken || data.pairToken === "0x0000000000000000000000000000000000000000";
  const progressPct = curve ? Math.min(100, Math.round(curve.progress * 100)) : 0;
  const p = providerFromId(model?.model);

  // Price + market cap (pons-style). Spot price is the curve's marginal price
  // in ETH; USD/market-cap need the live ETH rate and the token's total supply.
  const priceEth = curve?.spotPrice ?? 0;
  const ethUsd = data?.ethUsd ?? null;
  const priceUsd = ethUsd != null && priceEth > 0 ? priceEth * ethUsd : null;
  const decimals = data?.decimals ?? 18;
  const supplyTokens = data?.totalSupply ? Number(data.totalSupply) / 10 ** decimals : 1_000_000_000;
  const marketCapUsd = priceUsd != null ? priceUsd * supplyTokens : null;
  const marketLabel = data ? (data.phase === 0 ? "Bonding curve" : "Uniswap V4") : "—";

  // Is the connected wallet this token's creator? Fees accrue to the creator
  // fee recipient (falls back to the deployer), so only they see the claim card.
  const creatorAddr = (data?.creatorFeeRecipient || data?.deployer || "").toLowerCase();
  const isCreator = !!wallet && !!creatorAddr && wallet.toLowerCase() === creatorAddr;

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
          <div className="card" style={{ padding: 15 }}>
            <div className="flex items-center gap-4">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" width={56} height={56} style={{ borderRadius: 16, objectFit: "cover", flexShrink: 0 }} onError={(e) => ((e.currentTarget.style.display = "none"))} />
              ) : (
                <ModelLogo model={model?.model} size={56} radius={16} />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 22 }}>{agentName}</span>
                  {model?.ticker && <span className="mono" style={{ color: "var(--dim)" }}>${model.ticker}</span>}
                  <RhBadge />
                </div>
                <div className="flex items-center gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--dim)" }}>{shortAddr(address)} · by {shortAddr(data?.deployer ?? "")}</span>
                  <CopyButton text={address} label="Copy CA" compact />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
              <span className="badge">fees → compute</span>
              <span className="badge"><span className="dot" style={{ background: p.color, color: p.ink }}>{p.short}</span> {p.name} · {model?.modelName ?? "unlinked"}</span>
              <span className="badge">Paired with ETH</span>
            </div>
            {bio && <p style={{ marginTop: 14, color: "var(--mut)", fontSize: 14.5, lineHeight: 1.6 }}>{bio}</p>}
          </div>

          {/* Market stats (pons-style grid) */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <MarketCell label="Price" value={priceUsd != null ? usdPrice(priceUsd) : "—"} />
              <MarketCell label="Market cap" value={marketCapUsd != null ? usdFull(marketCapUsd) : "—"} style={{ borderLeft: "1px solid var(--border)" }} />
              <MarketCell label="Price in ETH" value={priceEth > 0 ? `${smallNum(priceEth)} ETH` : "—"} style={{ borderTop: "1px solid var(--border)" }} />
              <MarketCell label="Market" value={marketLabel} style={{ borderTop: "1px solid var(--border)", borderLeft: "1px solid var(--border)" }} />
            </div>
          </div>

          {/* Compute funded — Neuma's signature stat */}
          <div className="card-2" style={{ padding: 15 }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, color: "var(--mut)" }}>Compute funded</span>
              <span className="badge">fees → compute</span>
            </div>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--cream)" }}>{usd(pool?.creditedUsd ?? 0)}</div>
          </div>

          <div className="card" style={{ padding: 15 }}><PriceChart token={address} quoteSymbol={isNative ? "ETH" : "quote"} /></div>

          {/* Curve progress */}
          {curve && !curve.graduated && (
            <div className="card-2" style={{ padding: 15 }}>
              <div className="flex justify-between" style={{ fontSize: 14 }}><span style={{ color: "var(--mut)" }}>Bonding-curve progress</span><span className="num" style={{ color: "var(--cream)" }}>{progressPct}%</span></div>
              <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: "var(--bg-soft)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--cream)", borderRadius: 999 }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--dim)" }}>Graduates to Uniswap V4 when the curve fills.</div>
            </div>
          )}

          {/* About */}
          {(bio || model?.personality) && (
            <div className="card" style={{ padding: 15 }}>
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
          <div className="card" style={{ padding: 15 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Details</div>
            <Detail k="Contract" v={shortAddr(address)} extra={<CopyButton text={address} label="Copy" compact />} />
            <Detail k="Bonding curve" v={shortAddr(data?.curveAddress ?? "")} />
            <Detail k="Creator" v={shortAddr(data?.deployer ?? "")} />
            <Detail k="Paired asset" v="ETH (native)" />
            <Detail k="Brain" v={`${p.name} · ${model?.modelName ?? "—"}`} />
            <Detail k="Phase" v={data?.phaseLabel ?? "—"} />
            <Detail k="Compute funded" v={usd(pool?.creditedUsd ?? 0)} />
          </div>

          <p className="notice">Live on Robinhood Chain — you sign every transaction and Neuma never custodies your assets. Tokens can be volatile and may lose all value; prices and compute figures are estimates. Nothing here is financial advice.</p>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {serialized && data?.curveAddress ? (
            <TradeWidget curve={data.curveAddress as `0x${string}`} token={address as `0x${string}`} tokenSymbol={data.symbol || model?.ticker || "TOKEN"} quoteIsNative={isNative} quoteDecimals={18} quoteSymbol={isNative ? "ETH" : "quote"} state={serialized} />
          ) : (
            <div className="card-2" style={{ padding: 18, fontSize: 14, color: "var(--mut)" }}>Trading isn’t available (not on an active curve, or chain unreachable).</div>
          )}

          {/* Compute pool */}
          <div className="card" style={{ padding: 15 }}>
            <div className="flex items-center justify-between"><span style={{ fontWeight: 600 }}>Compute pool</span><span className="badge">fees → inference</span></div>
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 14 }}>
              <Stat label="Funded" value={usd(pool?.creditedUsd ?? 0)} />
              <Stat label="Spent" value={usd(pool?.spendUsd ?? 0)} />
              <Stat label="Left" value={usd(pool?.remainingUsd ?? 0)} />
            </div>
          </div>

          {/* Creator-only: claim the fees this agent earned + fund it via Orbio */}
          {isCreator && (
            <div className="flex flex-col" style={{ gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--cream)" }}>◆ You created this agent</span>
              <ClaimFees />
              <OrbioCredits />
            </div>
          )}

          {model && <AgentConsole token={address} agentName={agentName} />}
        </div>
      </div>
    </div>
  );
}

function MarketCell({ label, value, style }: { label: string; value: string; style?: React.CSSProperties }) {
  return (
    <div style={{ padding: "14px 16px", minWidth: 0, ...style }}>
      <div style={{ fontSize: 13, color: "var(--mut)" }}>{label}</div>
      <div className="num" style={{ fontSize: 18, fontWeight: 700, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
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
function Detail({ k, v, extra }: { k: string; v: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: 14 }}>
      <span style={{ color: "var(--mut)", flexShrink: 0 }}>{k}</span>
      <span className="flex items-center gap-2" style={{ minWidth: 0 }}><span className="mono" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>{extra}</span>
    </div>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="wrap" style={{ paddingTop: 80, textAlign: "center", color: "var(--mut)" }}>{children}</div>;
}
