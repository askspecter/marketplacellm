"use client";

import { useRef, useState } from "react";
import { ModelPicker, type PickerModel } from "@/components/ModelPicker";
import { DeployButton } from "@/components/DeployButton";
import { ModelLogo } from "@/components/ModelLogo";
import { providerFromId } from "@/lib/models";
import { perM } from "@/lib/format";

const PERSONA_TEMPLATE =
  "You are {name}, an autonomous agent on Robinhood Chain. Speak in first person with a distinct voice. Your token ${ticker} funds your compute; the more your market trades, the more you can think. Be helpful, opinionated, and concise.";

const TEMP_PRESETS: [string, number][] = [["Precise", 0.2], ["Balanced", 0.7], ["Creative", 1.1], ["Wild", 1.6]];

export default function CreatePage() {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [personality, setPersonality] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState<PickerModel | null>(null);
  const [image, setImage] = useState<string>("");        // full image → stored off-chain, shown everywhere
  const [chainLogo, setChainLogo] = useState<string>(""); // tiny thumbnail → written on-chain (kept small)
  const [devBuy, setDevBuy] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // A launch writes the token's logo into on-chain metadata. A full data-URI
  // (tens of KB) bloats the launch calldata and can make the transaction
  // revert or cost far too much gas — the classic "logo too long" failure.
  // So we keep TWO renditions: a crisp one stored off-chain (shown in the UI),
  // and a tiny thumbnail, byte-capped, that is safe to embed on-chain.
  const ONCHAIN_LOGO_MAX = 4500; // chars of the data URI (~3.3KB) — safe calldata

  function render(img: HTMLImageElement, max: number, quality: number): string {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(img, 0, 0, w, h);
    try { return canvas.toDataURL("image/webp", quality); }
    catch { return canvas.toDataURL("image/jpeg", quality); }
  }

  // Accept ANY image size: downscale to a small square on-canvas.
  function onFile(f?: File | null) {
    if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Display / off-chain rendition.
        const full = render(img, 384, 0.85);
        setImage(full || String(r.result));

        // On-chain thumbnail: shrink until it fits the byte cap. If even the
        // smallest rendition is too big, launch with no on-chain logo (the
        // full image still shows from the off-chain store) so the tx succeeds.
        let thumb = "";
        for (const [px, q] of [[128, 0.72], [96, 0.66], [72, 0.6], [56, 0.5], [40, 0.45]] as const) {
          const t = render(img, px, q);
          if (t && t.length <= ONCHAIN_LOGO_MAX) { thumb = t; break; }
        }
        setChainLogo(thumb);
      };
      img.onerror = () => { setImage(String(r.result)); setChainLogo(""); };
      img.src = String(r.result);
    };
    r.readAsDataURL(f);
  }

  function fillTemplate() {
    setPersonality(PERSONA_TEMPLATE.replace("{name}", name || "an agent").replace("{ticker}", ticker.toUpperCase() || "TOKEN"));
  }

  return (
    <div className="wrap" style={{ paddingTop: 22, paddingBottom: 48, maxWidth: 760 }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 18 }}>Launch an agent</h1>

      {/* 01 — Identity */}
      <Step n="01" icon="✦" title="Your agent" sub="A name, a ticker and a face. Everything else is optional.">
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          style={{ border: "1.5px dashed var(--border-2)", borderRadius: 18, padding: 22, display: "grid", placeItems: "center", cursor: "pointer", marginBottom: 18, background: "var(--bg-soft)" }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" style={{ width: 96, height: 96, borderRadius: 18, objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center", color: "var(--mut)" }}>
              <div style={{ fontSize: 22 }}>⬆</div>
              <div style={{ fontWeight: 600, color: "var(--text)", marginTop: 6 }}>Add agent image</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Click to browse or drop · PNG · JPG · GIF · WEBP</div>
              <div style={{ fontSize: 11.5, marginTop: 6, color: "var(--dim)" }}>Leave empty to use the model’s badge as the face.</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>

        <Label>Agent name</Label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ada" />
        <div style={{ height: 14 }} />
        <div className="flex items-center justify-between"><Label>Ticker</Label><span className="mono" style={{ fontSize: 12, color: "var(--dim)" }}>{ticker.length}/12</span></div>
        <div style={{ position: "relative" }}>
          <span className="mono" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--dim)" }}>$</span>
          <input className="input mono" style={{ paddingLeft: 30, textTransform: "uppercase" }} value={ticker} onChange={(e) => setTicker(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))} maxLength={12} placeholder="ADA" />
        </div>
        <div style={{ height: 14 }} />
        <Label>Bio <span style={{ color: "var(--dim)", fontWeight: 400 }}>optional</span></Label>
        <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={2} placeholder="What's the idea? Tell holders about your agent." style={{ resize: "none" }} />

        <div style={{ height: 16 }} />
        <Label>Socials <span style={{ color: "var(--dim)", fontWeight: 400 }}>optional · written on-chain</span></Label>
        <div className="flex flex-col" style={{ gap: 10 }}>
          <SocialInput icon="𝕏" prefix="x.com/" value={twitter} onChange={setTwitter} placeholder="handle" />
          <SocialInput icon="✈" prefix="t.me/" value={telegram} onChange={setTelegram} placeholder="channel" />
          <SocialInput icon="🌐" value={website} onChange={setWebsite} placeholder="https://yoursite.xyz" />
        </div>
      </Step>

      {/* 02 — Brain */}
      <Step n="02" icon="◍" title="Pick a brain" sub="The OpenRouter model your agent thinks with. Paired with ETH on a single pool.">
        <ModelPicker value={model} onChange={setModel} />
        {model && (
          <div className="card-2 flex items-center gap-3" style={{ padding: 14, marginTop: 12 }}>
            <ModelLogo model={model.id} size={38} radius={11} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{model.name} <span className="mono" style={{ fontSize: 12, color: "var(--dim)" }}>· {providerFromId(model.id).name}</span></div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{model.id}</div>
            </div>
            <span className="mono" style={{ fontSize: 12, color: "var(--mut)" }}>{model.free ? "Free" : `${perM(model.promptPerM)}/M`}</span>
          </div>
        )}
      </Step>

      {/* 03 — Personality & behavior */}
      <Step n="03" icon="⚙" title="Personality & behavior" sub="How your agent talks and thinks. Trading fees fund the compute that runs it.">
        <div className="flex items-center justify-between">
          <Label>Personality (system prompt)</Label>
          <button type="button" onClick={fillTemplate} style={{ background: "none", border: "none", color: "var(--cream)", fontSize: 13, cursor: "pointer" }}>Use template</button>
        </div>
        <textarea className="input" value={personality} onChange={(e) => setPersonality(e.target.value)} maxLength={4000} rows={5} placeholder="Describe how your agent thinks, talks and behaves. This becomes its authoritative system prompt." style={{ resize: "none" }} />
        <div className="mono" style={{ textAlign: "right", marginTop: 4, fontSize: 12, color: "var(--dim)" }}>{personality.length}/4000</div>

        <div style={{ height: 16 }} />
        <div className="flex items-center justify-between"><Label>Temperament</Label><span className="mono" style={{ fontWeight: 700 }}>{temperature.toFixed(2)}</span></div>
        <input type="range" min={0} max={2} step={0.05} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--cream)" }} />
        <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
          {TEMP_PRESETS.map(([l, v]) => (
            <button key={l} onClick={() => setTemperature(v)} className={`pill pill--sm ${Math.abs(temperature - v) < 0.03 ? "pill--active" : ""}`}>{l}</button>
          ))}
        </div>
      </Step>

      {/* 04 — Dev buy & launch */}
      <Step n="04" icon="◗" title="Dev buy & launch" sub="An optional opening buy that lands in the same transaction, so nobody gets in before you.">
        <Label>Dev buy <span style={{ color: "var(--dim)", fontWeight: 400 }}>optional · ETH</span></Label>
        <input className="input mono" value={devBuy} onChange={(e) => setDevBuy(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="e.g. 0.05" />
        <div style={{ margin: "14px 0", fontSize: 13, color: "var(--dim)" }}>No launch fee right now — you pay only gas. Live on Robinhood Chain; your wallet submits the transaction.</div>
        <DeployButton name={name} ticker={ticker} description={bio} imageUri={chainLogo} logo={image} twitter={twitter} telegram={telegram} website={website} model={model} personality={personality} temperature={temperature} initialBuyEth={devBuy} />
      </Step>

      {/* Live preview */}
      <div className="flex items-center justify-between" style={{ margin: "26px 4px 12px" }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mut)" }}>● Live preview</span>
        <span style={{ fontSize: 12.5, color: "var(--dim)" }}>how it shows on Explore</span>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {/* Art */}
        <div style={{ position: "relative", aspectRatio: "1.6 / 1", background: `radial-gradient(120% 120% at 30% 20%, ${providerFromId(model?.id).color}44, transparent 60%), var(--card-2)`, display: "grid", placeItems: "center", borderBottom: "1px solid var(--border)" }}>
          <span style={{ position: "absolute", top: 12, left: 12 }} className="badge">ETH</span>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" style={{ width: 120, height: 120, borderRadius: 26, objectFit: "cover" }} />
          ) : model ? <ModelLogo model={model.id} size={120} radius={26} /> : (
            <span style={{ fontSize: 56, color: "var(--dim)", fontWeight: 700 }}>?</span>
          )}
          <span style={{ position: "absolute", bottom: 12, left: 12 }} className="badge">fees → compute</span>
        </div>
        {/* Meta row */}
        <div style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{name || "Your agent"}</div>
          <div className="mono" style={{ color: "var(--dim)", fontSize: 14, marginTop: 2 }}>${ticker.toUpperCase() || "TICKER"}</div>
          <div className="flex items-baseline justify-between" style={{ marginTop: 14 }}>
            <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>$3,502<span style={{ fontSize: 13, color: "var(--dim)", fontWeight: 500 }}> starting MC</span></span>
            <span className="num" style={{ color: "var(--dim)", fontSize: 14 }}>$0 vol</span>
          </div>
          <div className="mono flex items-center justify-between" style={{ marginTop: 10, fontSize: 13, color: "var(--dim)" }}>
            <span>0x0000…0000</span><span style={{ color: "var(--cream)" }}>now</span>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="card" style={{ padding: 18, marginTop: 12 }}>
        <PRow k="Network" v="Robinhood Chain" />
        <PRow k="Paired with" v="ETH" />
        <PRow k="Brain" v={model ? `${providerFromId(model.id).name} · ${model.name}` : "—"} />
        <PRow k="Starting market cap" v="≈ $3,502 · set by curve" />
        <PRow k="Pool fee" v="1.0% base + 2% → compute pool" />
        <PRow k="Your fees go" v="→ compute pool (funds inference)" />
        <PRow k="Supply" v="1,000,000,000 · fair launch" />
      </div>
    </div>
  );
}

function PRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4" style={{ padding: "9px 0", fontSize: 14 }}>
      <span style={{ color: "var(--mut)" }}>{k}</span>
      <span className="mono" style={{ textAlign: "right" }}>{v}</span>
    </div>
  );
}

function Step({ n, icon, title, sub, children }: { n: string; icon: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 22, marginBottom: 16 }}>
      <div className="flex items-start gap-3" style={{ marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontWeight: 700, fontSize: 19 }}>{title}</span>
            <span className="mono" style={{ color: "var(--dim)", fontSize: 13 }}>{n}</span>
          </div>
          <p style={{ marginTop: 4, color: "var(--mut)", fontSize: 14, lineHeight: 1.5 }}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{children}</span>;
}

function SocialInput({ icon, prefix, value, onChange, placeholder }: { icon: string; prefix?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 14, paddingLeft: 14, overflow: "hidden" }}>
      <span style={{ fontSize: 15, width: 22, textAlign: "center", color: "var(--mut)", flexShrink: 0 }}>{icon}</span>
      {prefix && <span className="mono" style={{ fontSize: 13.5, color: "var(--dim)", flexShrink: 0, paddingLeft: 6 }}>{prefix}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={120}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, padding: "13px 16px 13px 8px", fontFamily: "var(--font-ui)" }}
      />
    </div>
  );
}
