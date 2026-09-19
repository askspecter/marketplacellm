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

  function scrollDown() {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9 }));
  }

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
        body: JSON.stringify({ model, token, messages: next, stream: true }),
      });

      // Errors (503 no key, 502 upstream) come back as JSON, not a stream.
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !ct.includes("text/event-stream") || !res.body) {
        const data = await res.json().catch(() => ({}));
        setNotice(data.error ?? "Chat failed.");
        setMessages(messages); // roll back optimistic context
        return;
      }

      // Open an empty assistant bubble and fill it as tokens arrive.
      setMessages([...next, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const piece = json.choices?.[0]?.delta?.content;
            if (piece) {
              acc += piece;
              setMessages([...next, { role: "assistant", content: acc }]);
              scrollDown();
            }
          } catch {
            /* keepalive / partial line */
          }
        }
      }
      if (!acc) setMessages([...next, { role: "assistant", content: "(empty response)" }]);
    } catch {
      setNotice("Network error talking to compute.");
      setMessages(messages);
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
