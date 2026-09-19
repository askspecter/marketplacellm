"use client";

import { useMemo, useState } from "react";
import { ModelPicker, type PickerModel } from "@/components/ModelPicker";
import { DeployButton } from "@/components/DeployButton";
import { perM } from "@/lib/format";

/** Deterministic on-brand SVG mark from the ticker — no external AI. */
function makeAvatar(ticker: string): string {
  const t = (ticker || "LLM").slice(0, 4).toUpperCase();
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
  const c1 = `hsl(${h}, 85%, 55%)`;
  const c2 = `hsl(${(h + 60) % 360}, 85%, 55%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="#0d0f14"/><rect x="8" y="8" width="104" height="104" rx="22" fill="url(#g)" opacity="0.18"/><text x="60" y="74" font-family="JetBrains Mono, monospace" font-size="34" font-weight="700" fill="url(#g)" text-anchor="middle">${t}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function CreatePage() {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState<PickerModel | null>(null);

  const imageUri = useMemo(() => makeAvatar(ticker), [ticker]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Launch a token</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Your token launches on the Pons v2 bonding curve, paired with ETH. Pick the OpenRouter model it funds — trading
        fees become compute for that model.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: form */}
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl2 border border-bg-line bg-bg-panel p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUri} alt="" className="h-16 w-16 rounded-2xl" />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{name || "Your token"}</div>
              <div className="font-mono text-sm text-white/40">${ticker.toUpperCase() || "TICKER"}</div>
            </div>
          </div>

          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              placeholder="Claude Compute"
              className="input"
            />
          </Field>
          <Field label="Ticker">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
              maxLength={8}
              placeholder="CLDC"
              className="input font-mono uppercase"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="A token that funds always-on Claude compute for its holders."
              className="input resize-none"
            />
          </Field>
        </div>

        {/* Right: model + deploy */}
        <div className="space-y-5">
          <Field label="Model this token funds">
            <ModelPicker value={model} onChange={setModel} />
          </Field>

          {model && (
            <div className="rounded-xl2 border border-cyan/30 bg-signature-soft p-4">
              <div className="text-xs uppercase tracking-widest text-cyan-soft">Funds</div>
              <div className="mt-1 font-semibold text-white">{model.name}</div>
              <div className="font-mono text-xs text-white/50">{model.id}</div>
              <div className="mt-3 flex gap-4 font-mono text-xs text-white/60">
                <span>{model.free ? "Free" : `${perM(model.promptPerM)}/M in`}</span>
                <span>{model.free ? "" : `${perM(model.completionPerM)}/M out`}</span>
                <span>{(model.contextLength / 1000).toFixed(0)}K ctx</span>
              </div>
            </div>
          )}

          <DeployButton
            name={name}
            ticker={ticker}
            description={description}
            imageUri={imageUri}
            model={model}
          />
        </div>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #0d0f14;
          padding: 0.75rem 0.9rem;
          font-size: 0.95rem;
          color: #f5f7fa;
          outline: none;
        }
        :global(.input:focus) {
          border-color: rgba(34, 211, 238, 0.5);
        }
        :global(.input::placeholder) {
          color: rgba(255, 255, 255, 0.28);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
