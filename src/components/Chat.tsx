"use client";

import { useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function Chat({ model, modelName, token }: { model: string; modelName?: string; token?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy || !model) return;
    setInput("");
    setNotice(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, token, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Chat failed.");
        setMessages(messages); // roll back the optimistic user msg context
        return;
      }
      setMessages([...next, { role: "assistant", content: data.content || "(empty response)" }]);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
    } catch {
      setNotice("Network error talking to compute.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-xl2 border border-bg-line bg-bg-panel">
      <div className="flex items-center justify-between border-b border-bg-line px-4 py-3">
        <div className="text-sm">
          <span className="text-white/50">Talking to </span>
          <span className="font-semibold text-white">{modelName ?? model}</span>
        </div>
        <span className="rounded-full bg-signature-soft px-2 py-0.5 font-mono text-[10px] text-cyan-soft">compute</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-white/40">
            Spend this token’s compute. Ask {modelName ?? "the model"} anything.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-signature text-black" : "border border-bg-line bg-bg-soft text-white/90"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-white/40">thinking…</div>}
      </div>

      {notice && (
        <div className="mx-4 mb-2 rounded-lg border border-ember/30 bg-ember/10 p-2 text-xs text-ember">{notice}</div>
      )}

      <div className="flex gap-2 border-t border-bg-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message…"
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
