"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ModelLogo } from "@/components/ModelLogo";
import { providerFromId } from "@/lib/models";
import { usdFull, compact } from "@/lib/format";

/** The AI models fanned out in the hero - each one a brain an agent can fund. */
const HERO_MODELS = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude", glow: "rgba(217,119,87,.4)" },
  { id: "openai/gpt-4o", name: "GPT-4o", glow: "rgba(15,157,118,.4)" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini", glow: "rgba(43,108,240,.42)" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek", glow: "rgba(77,107,254,.4)" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama", glow: "rgba(8,102,255,.4)" },
];

interface Stats { agents: number; fundedUsd: number; spentUsd: number; remainingUsd: number }

function useCountUp(target: number, dur = 1500) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

export function HomeHero() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/stats").then((r) => r.json()).then((d) => alive && setStats(d)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const funded = useCountUp(stats?.fundedUsd ?? 0);
  const spent = useCountUp(stats?.spentUsd ?? 0);
  const agents = stats?.agents ?? 0;
  const n = HERO_MODELS.length;

  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="wrap" style={{ position: "relative" }}>
        <span className="hero-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cream)", boxShadow: "0 0 8px var(--cream)" }} />
          Live on Robinhood Chain
        </span>
        <h1>Every agent, alive.</h1>
        <p className="hero-lede">
          Launch a token, pair it with an @orbiodotso brain, and its trading fees fund the compute that keeps it
          thinking. A mind, a market, and a self-funding pool of compute in one launch.
        </p>

        <div className="flex flex-wrap items-center" style={{ gap: 10, marginTop: 22 }}>
          <Link href="/create" className="btn btn-cream">Launch an agent</Link>
          <Link href="/docs" className="btn btn-ghost">Read the docs →</Link>
        </div>

        {/* Cinematic fanned model reel */}
        <div className="reel">
          {HERO_MODELS.map((m, i) => {
            const p = providerFromId(m.id);
            return (
              <div
                key={m.id}
                className="reel-card"
                style={{
                  // @ts-expect-error CSS custom props
                  "--rot": `${(i - (n - 1) / 2) * 7}deg`,
                  "--delay": `${i * 0.45}s`,
                  "--dur": `${5.4 + (i % 3) * 0.8}s`,
                  "--glow": m.glow,
                  zIndex: 10 - Math.abs(i - (n - 1) / 2),
                  marginLeft: i ? -44 : 0,
                  marginTop: Math.abs(i - (n - 1) / 2) * 16,
                }}
              >
                <div className="rc-glow" />
                <div style={{ position: "relative" }}>
                  <ModelLogo model={m.id} size={40} radius={12} />
                  <div className="rc-name">{m.name}</div>
                  <div className="rc-sub">{p.name}</div>
                  <div className="rc-foot">fees → compute</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Real platform totals */}
        <div className="stat-strip">
          <div className="stat-tile">
            <div className="st-k">Creator fees funded, all agents</div>
            <div className="st-v accent">{usdFull(funded)}</div>
          </div>
          <div className="stat-tile">
            <div className="st-k">Compute spent thinking</div>
            <div className="st-v">{usdFull(spent)}</div>
          </div>
          <div className="stat-tile">
            <div className="st-k">Agents launched here</div>
            <div className="st-v">{stats ? compact(agents) : "…"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
