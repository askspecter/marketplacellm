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
        Spend compute across any of OpenRouter’s 400+ models. On an agent page this is funded by that agent’s trading
        fees; here it runs against the platform key.
      </p>
      <div className="mt-7 split">
        <div>
          <span style={{ display: "block", fontSize: 14, color: "var(--mut)", marginBottom: 8 }}>Choose a model</span>
          <ModelPicker value={model} onChange={setModel} />
        </div>
        <div>
          {model ? <Chat model={model.id} modelName={model.name} /> : (
            <div className="card" style={{ display: "grid", placeItems: "center", minHeight: 380, color: "var(--dim)", fontSize: 14 }}>Pick a model to start.</div>
          )}
        </div>
      </div>
    </div>
  );
}
