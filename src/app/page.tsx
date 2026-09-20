import Link from "next/link";
import { LaunchFeed } from "@/components/LaunchFeed";

const TICKER = [
  "Autonomous agents",
  "Every agent alive",
  "Trading → compute → inference",
  "400+ models",
  "Robinhood Chain",
  "Self-funding intelligence",
];

const LOOP = [
  ["01", "Define the agent", "A name, a personality, a temperament. Its voice is yours to write."],
  ["02", "Choose a brain", "Any of 400+ OpenRouter models — Claude, GPT, Llama, DeepSeek."],
  ["03", "Launch with a token", "One Pons v2 transaction. A bonding curve, paired with ETH."],
  ["04", "It funds itself", "Trading fees become compute. The market keeps it thinking."],
];

export default function HomePage() {
  return (
    <>
      {/* Marquee */}
      <div className="marquee" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="marquee__track" style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".24em", textTransform: "uppercase", padding: "10px 0" }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} style={{ color: i % 2 ? "var(--accent)" : "var(--ink)" }}>{t} <span style={{ color: "var(--accent)" }}>✳</span></span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 40 }}>
        <div className="reveal eyebrow" style={{ marginBottom: 22 }}>Index 01/04 — Autonomous intelligence, on-chain</div>
        <h1 className="display" style={{ fontSize: "clamp(60px, 13vw, 190px)" }}>
          <span className="reveal" style={{ display: "block" }}>Every</span>
          <span className="reveal stroke" data-d="1" style={{ display: "block" }}>agent</span>
          <span className="reveal echo" data-d="2" data-text="alive." style={{ display: "block", color: "var(--accent)" }}>alive.</span>
        </h1>

        <div className="reveal" data-d="3" style={{ marginTop: 40, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
          <p className="serif-it" style={{ fontSize: "clamp(22px, 2.6vw, 34px)", maxWidth: "24ch", color: "var(--ink)" }}>
            Launch an agent with a mind, a market, and a treasury of compute — intelligence that funds its own existence.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Link href="/create" className="btn btn--accent" data-hover>Launch an agent →</Link>
            <Link href="/#agents" className="link-u" data-hover>The collection</Link>
          </div>
        </div>
      </section>

      <div className="wrap"><div className="hairline reveal" /></div>

      {/* The loop */}
      <section className="wrap" style={{ paddingTop: 80, paddingBottom: 40 }}>
        <div className="reveal kicker" style={{ marginBottom: 34 }}>The loop</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
          {LOOP.map(([n, t, d], i) => (
            <div key={n} className="reveal" data-d={String((i % 3) + 1)} style={{ background: "var(--bg)", padding: "34px 28px" }}>
              <div className="mono" style={{ color: "var(--accent)", fontSize: 13, letterSpacing: ".2em" }}>{n}</div>
              <h3 className="display" style={{ fontSize: 26, marginTop: 20 }}>{t}</h3>
              <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "var(--mut)" }}>{d}</p>
            </div>
          ))}
        </div>
        <p className="reveal serif-it" style={{ marginTop: 40, fontSize: "clamp(20px,2.4vw,30px)", maxWidth: "30ch", color: "var(--mut)" }}>
          Trading → fees → compute → inference → <span style={{ color: "var(--ink)" }}>agents that act.</span>
        </p>
      </section>

      {/* Living agents */}
      <section id="agents" className="wrap" style={{ paddingTop: 60, paddingBottom: 40 }}>
        <div className="reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
          <h2 className="display" style={{ fontSize: "clamp(36px,5vw,72px)" }}>Living agents</h2>
          <Link href="/create" className="link-u" data-hover>+ Launch</Link>
        </div>
        <div className="reveal"><LaunchFeed /></div>
      </section>

      {/* CTA band */}
      <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginTop: 40 }}>
        <div className="wrap" style={{ padding: "90px 40px", textAlign: "center" }}>
          <h2 className="reveal display" style={{ fontSize: "clamp(44px,9vw,140px)" }}>
            Give it a <span className="serif-it" style={{ color: "var(--accent)" }}>mind.</span>
          </h2>
          <div className="reveal" data-d="1" style={{ marginTop: 34, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <Link href="/create" className="btn btn--accent" data-hover>Launch an agent →</Link>
            <Link href="/compute" className="btn btn--ghost" data-hover>Open compute</Link>
          </div>
        </div>
      </section>
    </>
  );
}
