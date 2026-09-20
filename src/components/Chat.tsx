"use client";

import { useRef, useState } from "react";

interface Msg { role: "user" | "assistant"; content: string; }

export function Chat({ model, modelName, token }: { model: string; modelName?: string; token?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const down = () => requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9 }));

  async function send() {
    const text = input.trim();
    if (!text || busy || !model) return;
    setInput(""); setNotice(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, token, messages: next, stream: true }) });
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !ct.includes("text/event-stream") || !res.body) {
        const data = await res.json().catch(() => ({}));
        setNotice(data.error ?? "Chat failed."); setMessages(messages); return;
      }
      setMessages([...next, { role: "assistant", content: "" }]);
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const d = line.slice(5).trim();
          if (d === "[DONE]" || !d) continue;
          try { const j = JSON.parse(d) as { choices?: { delta?: { content?: string } }[] }; const pc = j.choices?.[0]?.delta?.content; if (pc) { acc += pc; setMessages([...next, { role: "assistant", content: acc }]); down(); } } catch { /* */ }
        }
      }
      if (!acc) setMessages([...next, { role: "assistant", content: "(empty response)" }]);
    } catch { setNotice("Network error talking to compute."); setMessages(messages); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 380, overflow: "hidden" }}>
      <div className="flex items-center justify-between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 14 }}><span style={{ color: "var(--mut)" }}>Talking to </span><span style={{ fontWeight: 600 }}>{modelName ?? model}</span></span>
        <span className="badge">compute</span>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && <p style={{ padding: "40px 0", textAlign: "center", color: "var(--dim)", fontSize: 14 }}>Spend compute. Ask {modelName ?? "the model"} anything.</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", whiteSpace: "pre-wrap", borderRadius: 16, padding: "10px 14px", fontSize: 14, lineHeight: 1.5,
              background: m.role === "user" ? "var(--cream)" : "var(--card-2)", color: m.role === "user" ? "var(--cream-ink)" : "var(--text)",
              border: m.role === "user" ? "none" : "1px solid var(--border)" }}>{m.content}</div>
          </div>
        ))}
        {busy && <div style={{ fontSize: 12, color: "var(--dim)" }}>thinking…</div>}
      </div>
      {notice && <div className="notice" style={{ margin: "0 16px 10px", borderColor: "rgba(239,122,124,.35)", background: "rgba(239,122,124,.08)", color: "var(--red)", fontSize: 12.5 }}>{notice}</div>}
      <div className="flex gap-2" style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <input className="input" style={{ borderRadius: 12 }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message…" />
        <button onClick={send} disabled={busy || !input.trim()} className="btn btn-cream" style={{ padding: "0 20px" }}>Send</button>
      </div>
    </div>
  );
}
