"use client";

import { useEffect, useMemo, useState } from "react";
import { perM } from "@/lib/format";

export interface PickerModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  promptPerM: number;
  completionPerM: number;
  modalities: string[];
  free: boolean;
}

export function ModelPicker({
  value,
  onChange,
}: {
  value: PickerModel | null;
  onChange: (m: PickerModel) => void;
}) {
  const [models, setModels] = useState<PickerModel[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.error) setError(d.error);
        setModels(d.models ?? []);
      })
      .catch(() => alive && setError("Couldn't reach OpenRouter."));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!models) return [];
    const s = q.trim().toLowerCase();
    const list = s
      ? models.filter((m) => m.id.toLowerCase().includes(s) || m.name.toLowerCase().includes(s))
      : models;
    return list.slice(0, 60);
  }, [models, q]);

  return (
    <div className="rounded-xl2 border border-bg-line bg-bg-soft p-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={models ? `Search ${models.length} models…` : "Loading models…"}
        className="w-full rounded-lg border border-bg-line bg-bg-panel px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-cyan/50"
      />
      {error && <div className="mt-2 text-xs text-ember">{error}</div>}

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
        {models === null && <div className="p-4 text-center text-sm text-white/40">Loading OpenRouter catalog…</div>}
        {filtered.map((m) => {
          const active = value?.id === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                active ? "border-cyan/60 bg-signature-soft" : "border-transparent hover:border-bg-line hover:bg-bg-panel"
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{m.name}</div>
                <div className="truncate font-mono text-[11px] text-white/40">{m.id}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[11px] text-white/60">
                  {m.free ? <span className="text-lime">Free</span> : `${perM(m.promptPerM)}/M in`}
                </div>
                <div className="font-mono text-[10px] text-white/30">{(m.contextLength / 1000).toFixed(0)}K ctx</div>
              </div>
            </button>
          );
        })}
        {models && filtered.length === 0 && (
          <div className="p-4 text-center text-sm text-white/40">No models match “{q}”.</div>
        )}
      </div>
    </div>
  );
}
