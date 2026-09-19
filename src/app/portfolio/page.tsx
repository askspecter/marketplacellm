"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClaimFees } from "@/components/ClaimFees";
import { shortAddr, usd } from "@/lib/format";

interface Launched {
  token: string;
  model: string;
  modelName: string;
  agentName: string | null;
  ticker: string | null;
  spendUsd: number;
}
interface Holding {
  token: string;
  symbol: string;
  modelName: string;
  balance: string;
}
interface Portfolio {
  launched: Launched[];
  holdings: Holding[];
  spentUsd: number;
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setData(null);
      return;
    }
    let alive = true;
    setLoading(true);
    fetch(`/api/portfolio?address=${address}`)
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [address]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
      <p className="mt-2 text-white/60">Your launches, holdings, and the compute your tokens have funded.</p>

      {!isConnected ? (
        <div className="mt-8 rounded-xl2 border border-bg-line bg-bg-panel p-10 text-center">
          <p className="mb-4 text-white/60">Connect a wallet to see your portfolio.</p>
          <div className="flex justify-center">
            <ConnectButton label="Connect wallet" />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <ClaimFees />

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Launches" value={String(data?.launched.length ?? (loading ? "…" : 0))} />
            <SummaryCard label="Holdings" value={String(data?.holdings.length ?? (loading ? "…" : 0))} />
            <SummaryCard label="Compute funded (spent)" value={usd(data?.spentUsd ?? 0)} />
          </div>

          <Section title="Your launches">
            {loading && !data ? (
              <Muted>Loading…</Muted>
            ) : data && data.launched.length > 0 ? (
              <div className="divide-y divide-bg-line">
                {data.launched.map((l) => (
                  <Row key={l.token} href={`/token/${l.token}`}>
                    <div>
                      <div className="font-medium text-white">
                        {l.agentName ?? l.modelName}
                        {l.ticker ? <span className="ml-1 font-mono text-xs text-white/40">${l.ticker}</span> : null}
                      </div>
                      <div className="font-mono text-xs text-white/40">brain: {l.modelName} · {shortAddr(l.token)}</div>
                    </div>
                    <div className="text-right font-mono text-sm text-white/70">{usd(l.spendUsd)} spent</div>
                  </Row>
                ))}
              </div>
            ) : (
              <Muted>
                No launches yet. <Link href="/create" className="text-cyan-soft hover:text-cyan">Launch one →</Link>
              </Muted>
            )}
          </Section>

          <Section title="Your holdings">
            {loading && !data ? (
              <Muted>Loading…</Muted>
            ) : data && data.holdings.length > 0 ? (
              <div className="divide-y divide-bg-line">
                {data.holdings.map((h) => (
                  <Row key={h.token} href={`/token/${h.token}`}>
                    <div>
                      <div className="font-medium text-white">${h.symbol}</div>
                      <div className="font-mono text-xs text-white/40">funds {h.modelName}</div>
                    </div>
                    <div className="text-right font-mono text-sm text-white/70">
                      {Number(formatUnits(BigInt(h.balance), 18)).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </div>
                  </Row>
                ))}
              </div>
            ) : (
              <Muted>No holdings in LLMPad-known tokens (or chain unreachable).</Muted>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-bg-line bg-bg-panel p-4">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 font-mono text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 border border-bg-line bg-bg-panel p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between py-3 transition hover:opacity-80">
      {children}
    </Link>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-white/40">{children}</p>;
}
