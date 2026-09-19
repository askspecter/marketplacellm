"use client";

import { useState } from "react";
import { ModelPicker, type PickerModel } from "@/components/ModelPicker";
import { Chat } from "@/components/Chat";

export default function ComputePage() {
  const [model, setModel] = useState<PickerModel | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Compute</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Spend compute across any of OpenRouter’s 400+ models. On a token page, this is funded by that token’s trading
        fees; here it runs against the platform key.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="mb-2 block text-sm font-medium text-white/70">Choose a model</span>
          <ModelPicker value={model} onChange={setModel} />
        </div>
        <div>
          {model ? (
            <Chat model={model.id} modelName={model.name} />
          ) : (
            <div className="grid h-full min-h-[360px] place-items-center rounded-xl2 border border-dashed border-bg-line bg-bg-panel/50 text-sm text-white/40">
              Pick a model to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
