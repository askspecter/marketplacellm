"use client";

import { useEffect, useMemo, useState } from "react";
import { ModelLogo } from "@/components/ModelLogo";
import { perM } from "@/lib/format";

export interface PickerModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  promptPerM: number;
  completionPerM: number;
  modalities: string[];
  priceKnown?: boolean;
  free: boolean;
}

export function ModelPicker({ value, onChange }: { value: PickerModel | null; onChange: (m: PickerModel) => void }) {
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
      .catch(() => alive && setError("Couldn't reach @orbiodotso."));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!models) return [];
    const s = q.trim().toLowerCase();
    const l = s ? models.filter((m) => m.id.toLowerCase().includes(s) || m.name.toLowerCase().includes(s)) : models;
    return l.slice(0, 60);
  }, [models, q]);

  return (
    <div className="card-2" style={{ padding: 12 }}>
      <input className="input" style={{ borderRadius: 12 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={models ? `Search ${models.length} models…` : "Loading models…"} />
      {error && <div style={{ marginTop: 8, fontSize: 12, color: "var(--red)" }}>{error}</div>}
      <div style={{ marginTop: 10, maxHeight: 288, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {models === null && <div style={{ padding: 16, textAlign: "center", color: "var(--dim)", fontSize: 14 }}>Loading catalog…</div>}
        {filtered.map((m) => {
          const active = value?.id === m.id;
          return (
            <button key={m.id} type="button" onClick={() => onChange(m)}
              style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 10, borderRadius: 12, cursor: "pointer",
                background: active ? "rgba(243,234,208,.10)" : "transparent", border: `1px solid ${active ? "var(--border-2)" : "transparent"}` }}>
              <ModelLogo model={m.id} size={34} radius={10} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.id}</div>
              </div>
              <div className="mono" style={{ textAlign: "right", fontSize: 11, color: "var(--mut)", flexShrink: 0 }}>
                {m.free ? <span className="up">Free</span> : m.priceKnown === false ? "n/a" : `${perM(m.promptPerM)}/M`}
              </div>
            </button>
          );
        })}
        {models && filtered.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "var(--dim)", fontSize: 14 }}>No models match “{q}”.</div>}
      </div>
    </div>
  );
}
