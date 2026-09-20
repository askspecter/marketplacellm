"use client";

import { useState } from "react";
import { providerFromId } from "@/lib/models";

/**
 * ModelLogo — shows a provider's REAL logo, loaded at runtime from its official
 * domain via public icon services (nominative use for identification). If the
 * logo can't be fetched, it falls back to an original monogram tile. We never
 * hand-draw or bundle providers' trademarked logos.
 */
export function ModelLogo({ model, size = 44, radius = 12 }: { model?: string; size?: number; radius?: number }) {
  const p = providerFromId(model);
  const sources = p.domain
    ? [`https://icons.duckduckgo.com/ip3/${p.domain}.ico`, `https://www.google.com/s2/favicons?sz=128&domain=${p.domain}`]
    : [];
  const [idx, setIdx] = useState(0);
  const src = sources[idx];

  if (src) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, background: "#f4f2ec", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={p.name}
          width={Math.round(size * 0.66)}
          height={Math.round(size * 0.66)}
          style={{ objectFit: "contain", display: "block" }}
          onError={() => setIdx((i) => i + 1)}
        />
      </div>
    );
  }

  return (
    <div aria-label={p.name} style={{ width: size, height: size, borderRadius: radius, background: p.color, color: p.ink, display: "grid", placeItems: "center", fontWeight: 800, fontSize: size * 0.42, lineHeight: 1, flexShrink: 0, fontFamily: "var(--font-ui)" }}>
      {p.short}
    </div>
  );
}
