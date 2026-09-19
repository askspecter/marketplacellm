"use client";

import { useRef, useState } from "react";

interface Step {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}
interface Turn {
  role: "user" | "assistant";
  content: string;
  steps?: Step[];
}

const TOOL_LABEL: Record<string, string> = {
  get_market: "checked the market",
  get_compute_pool: "checked its compute pool",
  get_token_info: "read token info",
  propose_trade: "proposed a trade",
};

/**
 * AgentConsole — an agentic chat for an agent's page. Unlike the plain compute
 * chat, the agent can call read-only tools (market, compute pool, token info)
 * and propose trades; each turn shows the steps it took before answering.
 */
export function AgentConsole({ token, agentName }: { token: string; agentName: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setNotice(null);
    const history = [...turns, { role: "user" as const, content: text }];
    setTurns(history);
    setBusy(true);
    scrollDown();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          messages: history.map((t) => ({ role: t.role, content: t.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "The agent couldn't respond.");
        setTurns(turns);
        return;
      }
      setTurns([...history, { role: "assistant", content: data.reply || "(no answer)", steps: data.steps ?? [] }]);
      scrollDown();
    } catch {
      setNotice("Network error reaching the agent.");
      setTurns(turns);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-xl2 border border-bg-line bg-bg-panel">
      <div className="flex items-center justify-between border-b border-bg-line px-4 py-3">
        <div className="text-sm">
          <span className="text-white/50">Console · </span>
          <span className="font-semibold text-white">{agentName}</span>
        </div>
        <span className="rounded-full bg-signature-soft px-2 py-0.5 font-mono text-[10px] text-cyan-soft">agentic</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {turns.length === 0 && (
          <p className="py-10 text-center text-sm text-white/40">
            Ask {agentName} about its market, its compute budget, or to propose a trade. It can look things up before
            answering.
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[88%]">
              {t.steps && t.steps.length > 0 && (
                <div className="mb-1 flex flex-wrap gap-1">
                  {t.steps.map((s, j) => (
                    <TradeOrTool key={j} step={s} token={token} />
                  ))}
                </div>
              )}
              <div
                className={`whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  t.role === "user" ? "bg-signature text-black" : "border border-bg-line bg-bg-soft text-white/90"
                }`}
              >
                {t.content}
              </div>
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-white/40">the agent is thinking &amp; checking on-chain…</div>}
      </div>

      {notice && (
        <div className="mx-4 mb-2 rounded-lg border border-ember/30 bg-ember/10 p-2 text-xs text-ember">{notice}</div>
      )}

      <div className="flex gap-2 border-t border-bg-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Message ${agentName}…`}
          className="flex-1 rounded-lg border border-bg-line bg-bg-soft px-3 py-2 text-sm outline-none focus:border-cyan/50"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="rounded-lg bg-signature px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function TradeOrTool({ step, token }: { step: Step; token: string }) {
  if (step.tool === "propose_trade" && step.result?.proposed) {
    const side = String(step.result.side ?? "buy");
    const amount = String(step.result.amount ?? "");
    return (
      <a
        href={`/token/${token}#trade`}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          side === "sell" ? "bg-ember/15 text-ember" : "bg-lime/15 text-lime"
        }`}
        title={String(step.result.rationale ?? "")}
      >
        proposes {side} {amount} →
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-bg-line bg-bg-soft px-2 py-0.5 text-[11px] text-white/50">
      🔧 {TOOL_LABEL[step.tool] ?? step.tool}
    </span>
  );
}
