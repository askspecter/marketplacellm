"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClaimFees } from "@/components/ClaimFees";
import { shortAddr, usd } from "@/lib/format";
import { SITE } from "@/lib/site";

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
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em" }}>Portfolio</h1>
      <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--mut)" }}>Your launches, holdings, and the compute your tokens have funded.</p>

      {!isConnected ? (
        <div className="card" style={{ marginTop: 30, padding: 40, textAlign: "center" }}>
          <p style={{ marginBottom: 16, color: "var(--mut)" }}>Connect a wallet to see your portfolio.</p>
          <div className="flex justify-center">
            <ConnectButton label="Connect wallet" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 20, marginTop: 30 }}>
          <ClaimFees />

          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <SummaryCard label="Launches" value={String(data?.launched.length ?? (loading ? "…" : 0))} />
            <SummaryCard label="Holdings" value={String(data?.holdings.length ?? (loading ? "…" : 0))} />
            <SummaryCard label="Compute funded (spent)" value={usd(data?.spentUsd ?? 0)} />
          </div>

          <Section title="Your launches">
            {loading && !data ? (
              <Muted>Loading…</Muted>
            ) : data && data.launched.length > 0 ? (
              <div>
                {data.launched.map((l) => (
                  <Row key={l.token} href={`/token/${l.token}`}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        {l.agentName ?? l.modelName}
                        {l.ticker ? <span className="mono" style={{ marginLeft: 6, fontSize: 12, color: "var(--dim)" }}>${l.ticker}</span> : null}
                      </div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>brain: {l.modelName} · {shortAddr(l.token)}</div>
                    </div>
                    <div className="mono" style={{ textAlign: "right", fontSize: 14, color: "var(--mut)", flexShrink: 0 }}>{usd(l.spendUsd)} spent</div>
                  </Row>
                ))}
              </div>
            ) : (
              <Muted>
                No launches yet. <Link href="/create" style={{ color: "var(--cream)", textDecoration: "underline", textUnderlineOffset: 3 }}>Launch one →</Link>
              </Muted>
            )}
          </Section>

          <Section title="Your holdings">
            {loading && !data ? (
              <Muted>Loading…</Muted>
            ) : data && data.holdings.length > 0 ? (
              <div>
                {data.holdings.map((h) => (
                  <Row key={h.token} href={`/token/${h.token}`}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>${h.symbol}</div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>funds {h.modelName}</div>
                    </div>
                    <div className="mono" style={{ textAlign: "right", fontSize: 14, color: "var(--mut)", flexShrink: 0 }}>
                      {Number(formatUnits(BigInt(h.balance), 18)).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </div>
                  </Row>
                ))}
              </div>
            ) : (
              <Muted>No holdings in {SITE.name}-known tokens yet (or the chain is unreachable).</Muted>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-2" style={{ padding: 16 }}>
      <div style={{ fontSize: 13, color: "var(--dim)" }}>{label}</div>
      <div className="num" style={{ marginTop: 4, fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 12, fontSize: 18, fontWeight: 600 }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between" style={{ padding: "12px 0", borderTop: "1px solid var(--border)" }}>
      {children}
    </Link>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p style={{ padding: "16px 0", fontSize: 14, color: "var(--dim)" }}>{children}</p>;
}
