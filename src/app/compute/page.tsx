"use client";

import { useState } from "react";
import { ModelPicker, type PickerModel } from "@/components/ModelPicker";
import { Chat } from "@/components/Chat";

export default function ComputePage() {
  const [model, setModel] = useState<PickerModel | null>(null);
  return (
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.02em" }}>Compute</h1>
      <p style={{ marginTop: 8, maxWidth: "60ch", color: "var(--mut)" }}>
        Spend compute across any of @orbiodotso’s 400+ models. On an agent page this is funded by that agent’s trading
        fees; here it runs against the platform key.
      </p>
      <div className="mt-7 split">
        <div style={{ minWidth: 0 }}>
          <span className="mono" style={{ display: "block", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mut)", marginBottom: 8 }}>Choose a model</span>
          <ModelPicker value={model} onChange={setModel} />
        </div>
        <div style={{ minWidth: 0 }}>
          {model ? <Chat model={model.id} modelName={model.name} /> : (
            <div className="card" style={{ display: "grid", placeItems: "center", minHeight: 320, textAlign: "center", padding: 28 }}>
              <div>
                <div style={{ width: 52, height: 52, margin: "0 auto 12px", borderRadius: 15, background: "var(--card-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 22 }}>◍</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Pick a model to start</div>
                <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--mut)", maxWidth: "32ch", marginInline: "auto", lineHeight: 1.5 }}>Choose any @orbiodotso model to open a chat. Free models run at no cost.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
