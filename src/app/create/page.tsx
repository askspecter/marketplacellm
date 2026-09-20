"use client";

import { useState } from "react";
import { ModelPicker, type PickerModel } from "@/components/ModelPicker";
import { DeployButton } from "@/components/DeployButton";
import { ModelLogo } from "@/components/ModelLogo";
import { perM } from "@/lib/format";

const PERSONA_TEMPLATE =
  "You are {name}, an autonomous agent on Robinhood Chain. Speak in first person with a distinct voice. Your token ${ticker} funds your compute; the more your market trades, the more you can think. Be helpful, opinionated, and concise.";

export default function CreatePage() {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [bio, setBio] = useState("");
  const [personality, setPersonality] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState<PickerModel | null>(null);

  function fillTemplate() {
    setPersonality(PERSONA_TEMPLATE.replace("{name}", name || "an agent").replace("{ticker}", ticker.toUpperCase() || "TOKEN"));
  }

  return (
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.02em" }}>Launch an agent</h1>
      <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--mut)" }}>
        One transaction deploys an autonomous agent — its token (Pons v2, paired with ETH), its personality, and its
        model. Trading fees fund the compute pool that pays for its inference.
      </p>

      <div className="mt-7 grid gap-4" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,.9fr)" }}>
        {/* Left: identity + personality */}
        <div className="flex flex-col gap-4">
          <div className="card-2 flex items-center gap-4" style={{ padding: 16 }}>
            <ModelLogo model={model?.id} size={56} radius={16} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name || "Your agent"}</div>
              <div className="mono" style={{ color: "var(--dim)", fontSize: 13 }}>${ticker.toUpperCase() || "TICKER"}{model ? ` · ${model.name}` : ""}</div>
            </div>
          </div>

          <Field label="Agent name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ada" /></Field>
          <Field label="Ticker"><input className="input mono" value={ticker} onChange={(e) => setTicker(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))} maxLength={8} placeholder="ADA" style={{ textTransform: "uppercase" }} /></Field>
          <Field label="Bio"><textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={2} placeholder="An autonomous agent that funds its own thinking." style={{ resize: "none" }} /></Field>
          <Field label="Personality (system prompt)">
            <div className="flex justify-end" style={{ marginBottom: 8 }}>
              <button type="button" onClick={fillTemplate} style={{ background: "none", border: "none", color: "var(--cream)", fontSize: 13, cursor: "pointer" }}>Use template</button>
            </div>
            <textarea className="input" value={personality} onChange={(e) => setPersonality(e.target.value)} maxLength={4000} rows={6} placeholder="Describe how your agent thinks, talks, and behaves. This becomes its authoritative system prompt." style={{ resize: "none" }} />
            <div style={{ textAlign: "right", marginTop: 4, fontSize: 12, color: "var(--dim)" }} className="mono">{personality.length}/4000</div>
          </Field>
        </div>

        {/* Right: model + tuning + deploy */}
        <div className="flex flex-col gap-4">
          <Field label="Brain — the model this agent runs on"><ModelPicker value={model} onChange={setModel} /></Field>

          <Field label={`Behavior · temperature ${temperature.toFixed(2)}`}>
            <input type="range" min={0} max={2} step={0.05} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--cream)" }} />
            <div className="mono flex justify-between" style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}><span>precise</span><span>balanced</span><span>creative</span></div>
          </Field>

          {model && (
            <div className="card-2" style={{ padding: 16 }}>
              <div className="flex items-center gap-3">
                <ModelLogo model={model.id} size={40} radius={11} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{model.name}</div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{model.id}</div>
                </div>
              </div>
              <div className="mono flex gap-4" style={{ marginTop: 12, fontSize: 12, color: "var(--mut)" }}>
                <span>{model.free ? "Free" : `${perM(model.promptPerM)}/M in`}</span>
                <span>{(model.contextLength / 1000).toFixed(0)}K ctx</span>
                <span>temp {temperature.toFixed(2)}</span>
              </div>
            </div>
          )}

          <DeployButton name={name} ticker={ticker} description={bio} imageUri="" model={model} personality={personality} temperature={temperature} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 14, color: "var(--mut)", marginBottom: 8 }}>{label}</span>
      {children}
    </label>
  );
}
