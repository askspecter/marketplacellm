"use client";

import { useState } from "react";

/**
 * Small "copy to clipboard" button. Used for the token contract address (CA) on
 * the token page. Falls back to a hidden textarea when the async clipboard API
 * isn't available (older mobile browsers / insecure contexts).
 */
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  compact = false,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const value = text;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch { /* ignore */ }
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${text}`}
      title="Copy contract address"
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: compact ? "3px 8px" : "5px 10px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: copied ? "var(--cream-soft)" : "var(--card-2)",
        color: copied ? "var(--cream)" : "var(--mut)",
        fontSize: compact ? 11 : 12,
        cursor: "pointer",
        transition: "color .15s, background .15s, border-color .15s",
        flexShrink: 0,
      }}
    >
      <span aria-hidden style={{ fontSize: compact ? 11 : 12 }}>{copied ? "✓" : "⧉"}</span>
      {copied ? copiedLabel : label}
    </button>
  );
}
