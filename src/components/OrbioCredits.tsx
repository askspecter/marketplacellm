"use client";

import { CopyButton } from "@/components/CopyButton";

/**
 * Creator guide: turn claimed ETH fees into Orbio AI credits that power the
 * agent. Orbio (a Pons launch on Robinhood Chain) pays AI credits to ORBIO
 * holders — hold ≥1,000 ORBIO, connect the wallet at Orbio, and it mints an
 * `sk-orbio` key whose balance accrues hourly. ORBIO/CREDIT trade on Uniswap v4,
 * so the swap itself happens in the DEX UI (routing is handled there); this
 * panel just walks the creator through it. No custom contract, non-custodial.
 */
const ORBIO = "0xAa07A0e9209e16aC99708C3EC70159c6eF3128A3";
const ORBIO_MARKET = "https://dexscreener.com/robinhood/0xe7cbe02821304bad9a0d188f7a153a9f89c0c1b42b6b1a9d9951992bd28f479e";
const ORBIO_DASHBOARD = "https://sellers.orbio.so/holders";

export function OrbioCredits() {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="flex items-center justify-between gap-2" style={{ flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Fund this agent with Orbio credits</span>
        <span className="badge">fees → AI credits</span>
      </div>
      <p style={{ marginTop: 8, color: "var(--mut)", fontSize: 13.5, lineHeight: 1.55 }}>
        Turn the ETH you claim above into AI credits that pay for this agent&rsquo;s thinking. Orbio pays
        credits to ORBIO holders on Robinhood Chain — non-custodial, no extra contract.
      </p>

      <ol style={{ margin: "14px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
        <Step n={1} title="Claim your fees">Use “Claim fees” above so the ETH lands in your wallet.</Step>
        <Step n={2} title="Swap ETH → ORBIO">
          On the Robinhood Chain DEX, swap ETH for at least <strong>1,000 ORBIO</strong> and hold it in this
          wallet. Credits accrue hourly, pro-rata to what you hold.
          <div className="flex items-center gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
            <a href={ORBIO_MARKET} target="_blank" rel="noreferrer" className="btn btn-cream" style={{ padding: "8px 14px", fontSize: 13 }}>Buy ORBIO ↗</a>
            <span className="mono" style={{ fontSize: 11.5, color: "var(--dim)" }}>{ORBIO.slice(0, 10)}…{ORBIO.slice(-6)}</span>
            <CopyButton text={ORBIO} label="Copy ORBIO CA" compact />
          </div>
        </Step>
        <Step n={3} title="Get your Orbio key">
          Connect this same wallet at Orbio and generate your <span className="mono">sk-orbio-…</span> key.
          <div style={{ marginTop: 8 }}>
            <a href={ORBIO_DASHBOARD} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }}>Open Orbio dashboard ↗</a>
          </div>
        </Step>
        <Step n={4} title="Power the agent">
          Add that key as the agent&rsquo;s inference key (<span className="mono">INFERENCE_API_KEY</span>) and it
          runs on your accrued credits — fees → compute, closed loop.
        </Step>
      </ol>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mono" style={{ width: 24, height: 24, borderRadius: 8, background: "var(--card-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, color: "var(--cream)" }}>{n}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div style={{ marginTop: 2, color: "var(--mut)", fontSize: 13, lineHeight: 1.5 }}>{children}</div>
      </div>
    </li>
  );
}
