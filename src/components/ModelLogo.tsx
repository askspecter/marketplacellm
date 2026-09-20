import { providerFromId } from "@/lib/models";

/**
 * ModelLogo — an ORIGINAL monogram tile for a model's provider (brand-ish color
 * + initial). We do not ship or hand-draw providers' trademarked logos. To use
 * an official, licensed logo, an operator can swap this component to render an
 * asset from `public/models/<key>.svg` (see README).
 */
export function ModelLogo({ model, size = 44, radius = 12 }: { model?: string; size?: number; radius?: number }) {
  const p = providerFromId(model);
  return (
    <div
      aria-label={p.name}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: p.color,
        color: p.ink,
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: size * 0.42,
        lineHeight: 1,
        flexShrink: 0,
        fontFamily: "var(--font-ui)",
      }}
    >
      {p.short}
    </div>
  );
}
