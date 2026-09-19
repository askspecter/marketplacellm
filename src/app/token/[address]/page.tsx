"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { TradeWidget, type CurveInputsSerialized } from "@/components/TradeWidget";
import { PriceChart } from "@/components/PriceChart";
import { Chat } from "@/components/Chat";
import { shortAddr, usd } from "@/lib/format";

interface TokenData {
  token: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  description: string;
  deployer: string;
  curveAddress: string;
  pairToken: string;
  phase: number;
  phaseLabel: string;
  curve: {
    quoteReserve: string;
    tokenReserve: string;
    realQuoteReserve: string;
    graduationThreshold: string;
    sellableTokens: string;
    graduated: boolean;
    progress: number;
    spotPrice: number;
    feeBps: string;
    creatorTaxBps: string;
  } | null;
  error?: string;
}

interface PoolData {
  link: {
    model: string;
    modelName: string;
    promptPerM: number;
    completionPerM: number;
    agentName?: string;
    ticker?: string;
    bio?: string;
    personality?: string;
    temperature?: number;
  } | null;
  spendUsd: number;
  creditedUsd: number;
  remainingUsd: number;
}

export default function TokenPage({ params }: { params: { address: string } }) {
  const address = params.address;
  const [data, setData] = useState<TokenData | null>(null);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAddress(address)) {
      setLoading(false);
      return;
    }
    let alive = true;
    const load = () =>
      Promise.all([
        fetch(`/api/v2/token?address=${address}`).then((r) => r.json()),
        fetch(`/api/pool?token=${address}`).then((r) => r.json()),
      ])
        .then(([t, p]) => {
          if (!alive) return;
          setData(t);
          setPool(p);
        })
        .catch(() => {})
        .finally(() => alive && setLoading(false));

    load();
    // Live: refresh curve state + pool every 12s (pauses in a hidden tab).
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, 12_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [address]);

  if (!isAddress(address)) return <Shell>Invalid token address.</Shell>;
  if (loading) return <Shell>Loading token…</Shell>;

  const model = pool?.link ?? null;
  const agentName = model?.agentName || data?.name || "Agent";
  const bio = model?.bio || data?.description || "";
  const curve = data?.curve ?? null;
  const isNative = !data?.pairToken || data.pairToken === "0x0000000000000000000000000000000000000000";
  const progressPct = curve ? Math.min(100, Math.round(curve.progress * 100)) : 0;

  const serialized: CurveInputsSerialized | null = curve
    ? {
        quoteReserve: curve.quoteReserve,
        tokenReserve: curve.tokenReserve,
        sellableTokens: curve.sellableTokens,
        feeBps: curve.feeBps,
        creatorTaxBps: curve.creatorTaxBps,
        graduated: curve.graduated,
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/#feed" className="text-sm text-white/40 hover:text-white">
        ← All agents
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-xl2 border border-bg-line bg-bg-panel p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data?.logo || ""}
              alt=""
              className="h-16 w-16 rounded-2xl bg-bg-soft object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{agentName}</h1>
              <div className="font-mono text-sm text-white/40">
                ${data?.symbol ?? model?.ticker} · {shortAddr(address)}
              </div>
            </div>
            <span className="ml-auto rounded-full bg-signature-soft px-3 py-1 text-xs font-semibold text-cyan-soft">
              agent
            </span>
          </div>

          {bio && <p className="text-white/70">{bio}</p>}

          {/* Brain + personality */}
          {model && (
            <div className="rounded-xl2 border border-bg-line bg-bg-panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/40">Brain</div>
                  <div className="mt-1 font-semibold text-white">{model.modelName}</div>
                  <div className="font-mono text-xs text-white/40">{model.model}</div>
                </div>
                {model.temperature != null && (
                  <span className="ml-auto rounded-full border border-bg-line px-3 py-1 font-mono text-xs text-white/60">
                    temp {model.temperature.toFixed(2)}
                  </span>
                )}
              </div>
              {model.personality && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs font-medium text-cyan-soft hover:text-cyan">
                    Personality (system prompt)
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border border-bg-line bg-bg-soft p-3 text-xs text-white/60">
                    {model.personality}
                  </p>
                </details>
              )}
            </div>
          )}

          {/* Price chart */}
          <PriceChart token={address} quoteSymbol={isNative ? "ETH" : "quote"} />

          {/* Curve progress */}
          {curve && !curve.graduated && (
            <div className="rounded-xl2 border border-bg-line bg-bg-panel p-5">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Bonding-curve progress</span>
                <span className="font-mono text-cyan-soft">{progressPct}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-bg-soft">
                <div className="h-full rounded-full bg-signature" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-2 text-xs text-white/40">Graduates to Uniswap V4 when the curve fills.</div>
            </div>
          )}

          {/* Compute pool */}
          <div className="rounded-xl2 border border-cyan/30 bg-signature-soft p-5">
            <div className="text-xs uppercase tracking-widest text-cyan-soft">Compute pool</div>
            {model ? (
              <>
                <div className="mt-2 text-lg font-semibold text-white">Powers {agentName}’s inference</div>
                <div className="font-mono text-xs text-white/50">{model.modelName} · {model.model}</div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <Stat label="Funded" value={usd(pool?.creditedUsd ?? 0)} />
                  <Stat label="Spent" value={usd(pool?.spendUsd ?? 0)} />
                  <Stat label="Remaining" value={usd(pool?.remainingUsd ?? 0)} />
                </div>
                <div className="mt-2 text-xs text-white/40">
                  Fees generated:{" "}
                  {curve
                    ? `${((Number(curve.realQuoteReserve) / 1e18) * (Number(curve.feeBps) / 10000)).toFixed(5)} ETH`
                    : "—"}{" "}
                  · funded compute is topped up to OpenRouter by the treasury keeper.
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-white/60">
                This token has no agent profile yet. Agents launched here register their brain automatically.
              </div>
            )}
          </div>

          {data?.error && (
            <p className="rounded-lg border border-ember/30 bg-ember/10 p-3 text-sm text-ember">
              Couldn’t read live chain state: {data.error}
            </p>
          )}
        </div>

        {/* Right column: trade + chat */}
        <div className="space-y-6">
          {serialized && data?.curveAddress ? (
            <TradeWidget
              curve={data.curveAddress as `0x${string}`}
              token={address as `0x${string}`}
              tokenSymbol={data.symbol}
              quoteIsNative={isNative}
              quoteDecimals={18}
              quoteSymbol={isNative ? "ETH" : "quote"}
              state={serialized}
            />
          ) : (
            <div className="rounded-xl2 border border-bg-line bg-bg-panel p-5 text-sm text-white/50">
              Trading isn’t available (token not on an active curve, or chain unreachable).
            </div>
          )}

          {model && <Chat model={model.model} modelName={agentName} token={address} />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bg-line bg-bg-soft p-3">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 font-mono font-semibold text-white">{value}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-white/50">{children}</div>;
}
