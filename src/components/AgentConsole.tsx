"use client";

import { useRef, useState } from "react";

interface Step { tool: string; args: Record<string, unknown>; result: Record<string, unknown>; }
interface Turn { role: "user" | "assistant"; content: string; steps?: Step[]; }

const TOOL_LABEL: Record<string, string> = {
  get_market: "checked the market",
  get_compute_pool: "checked its compute pool",
  get_token_info: "read token info",
  propose_trade: "proposed a trade",
};

export function AgentConsole({ token, agentName }: { token: string; agentName: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [agentic, setAgentic] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const down = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput(""); setNotice(null);
    const history = [...turns, { role: "user" as const, content: text }];
    setTurns(history); setBusy(true); down();
    try {
      const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, messages: history.map((t) => ({ role: t.role, content: t.content })) }) });
      const data = await res.json();
      if (!res.ok) { setNotice(data.error ?? "The agent couldn't respond."); setTurns(turns); return; }
      if (typeof data.toolsSupported === "boolean") {
        setAgentic(data.toolsSupported);
        if (!data.toolsSupported) setNotice("This model doesn't support tool calling, so the agent is answering as a plain chat. Pick a tool-capable model to enable market/trade actions.");
      }
      setTurns([...history, { role: "assistant", content: data.reply || "(no answer)", steps: data.steps ?? [] }]); down();
    } catch { setNotice("Network error reaching the agent."); setTurns(turns); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 420, overflow: "hidden" }}>
      <div className="flex items-center justify-between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 14 }}><span style={{ color: "var(--mut)" }}>Console · </span><span style={{ fontWeight: 600 }}>{agentName}</span></span>
        <span className="badge" title={agentic ? "Can read its market & compute pool and propose trades" : "Model without tool calling — plain chat"}>{agentic ? "agentic" : "chat"}</span>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {turns.length === 0 && <p style={{ padding: "40px 0", textAlign: "center", color: "var(--dim)", fontSize: 14 }}>Ask {agentName} about its market, its compute budget, or to propose a trade.</p>}
        {turns.map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: t.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "88%" }}>
              {t.steps && t.steps.length > 0 && (
                <div className="flex flex-wrap gap-1" style={{ marginBottom: 6 }}>
                  {t.steps.map((s, j) => <ToolChip key={j} step={s} token={token} />)}
                </div>
              )}
              <div style={{ whiteSpace: "pre-wrap", borderRadius: 16, padding: "10px 14px", fontSize: 14, lineHeight: 1.5,
                background: t.role === "user" ? "var(--cream)" : "var(--card-2)",
                color: t.role === "user" ? "var(--cream-ink)" : "var(--text)",
                border: t.role === "user" ? "none" : "1px solid var(--border)" }}>{t.content}</div>
            </div>
          </div>
        ))}
        {busy && <div style={{ fontSize: 12, color: "var(--dim)" }}>the agent is thinking &amp; checking on-chain…</div>}
      </div>

      {notice && <div className="notice" style={{ margin: "0 16px 10px", borderColor: "rgba(239,122,124,.35)", background: "rgba(239,122,124,.08)", color: "var(--red)", fontSize: 12.5 }}>{notice}</div>}

      <div className="flex gap-2" style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <input className="input" style={{ borderRadius: 12 }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Message ${agentName}…`} />
        <button onClick={send} disabled={busy || !input.trim()} className="btn btn-cream" style={{ padding: "0 20px" }}>Send</button>
      </div>
    </div>
  );
}

function ToolChip({ step, token }: { step: Step; token: string }) {
  if (step.tool === "propose_trade" && step.result?.proposed) {
    const sideSell = String(step.result.side) === "sell";
    return (
      <a href={`/token/${token}`} className="badge" style={{ color: sideSell ? "var(--red)" : "var(--green)", borderColor: "var(--border-2)" }} title={String(step.result.rationale ?? "")}>
        proposes {String(step.result.side ?? "buy")} {String(step.result.amount ?? "")} →
      </a>
    );
  }
  return <span className="badge" style={{ color: "var(--mut)" }}>🔧 {TOOL_LABEL[step.tool] ?? step.tool}</span>;
}
