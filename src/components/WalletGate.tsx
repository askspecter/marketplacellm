"use client";

import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { SITE } from "@/lib/site";

/**
 * First-connect terms gate. The very first time a given wallet connects, the
 * user must accept the Terms of Use and Privacy Policy (and confirm they are
 * not in a restricted jurisdiction) before using the app. The acceptance is
 * remembered per wallet address in localStorage, so a returning wallet is
 * never asked again.
 */
const KEY = "neuma.accepted.v1";

function loadAccepted(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map((a) => String(a).toLowerCase()) : []);
  } catch {
    return new Set();
  }
}

export function WalletGate() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (isConnected && address && !loadAccepted().has(address.toLowerCase())) {
      setTerms(false);
      setPrivacy(false);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [mounted, isConnected, address]);

  // Lock page scroll while the gate is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!mounted || !open || !address) return null;

  function accept() {
    try {
      const accepted = loadAccepted();
      accepted.add(address!.toLowerCase());
      localStorage.setItem(KEY, JSON.stringify([...accepted]));
    } catch {
      /* ignore — worst case they see the gate again next time */
    }
    setOpen(false);
  }

  function decline() {
    try { disconnect(); } catch { /* ignore */ }
    setOpen(false);
  }

  const canContinue = terms && privacy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review and accept"
      style={{
        position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "end center",
        background: "color-mix(in srgb, var(--bg) 62%, transparent)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        padding: "0 12px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%", maxWidth: 460, overflow: "hidden", marginBottom: "clamp(12px, 6vh, 64px)",
          animation: "rise .28s ease", boxShadow: "0 24px 80px -30px rgba(0,0,0,.8)",
        }}
      >
        {/* Hero */}
        <div style={{ position: "relative", height: 150, display: "grid", placeItems: "center", background: "radial-gradient(120% 130% at 50% 8%, rgba(146,224,31,.28), transparent 62%)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--card-2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/neuma.png" alt={SITE.name} width={40} height={40} style={{ borderRadius: 10, objectFit: "cover", display: "block" }} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 22 }}>
          <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Review and accept</h2>
            <span style={{ background: "var(--cream)", color: "var(--cream-ink)", fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 999 }}>Required</span>
          </div>
          <p style={{ marginTop: 12, color: "var(--mut)", fontSize: 15, lineHeight: 1.55 }}>
            Before using {SITE.name} with this wallet, you must review and accept the current Terms of
            Use and Privacy Policy. You also confirm that you are not located in a restricted
            jurisdiction.
          </p>

          <div className="flex flex-col" style={{ gap: 10, marginTop: 20 }}>
            <CheckRow checked={terms} onToggle={() => setTerms((v) => !v)} href="/terms" label="Terms of Use" />
            <CheckRow checked={privacy} onToggle={() => setPrivacy((v) => !v)} href="/privacy" label="Privacy Policy" />
          </div>

          <div className="flex items-center gap-3" style={{ marginTop: 22, flexWrap: "wrap" }}>
            <button className="btn btn-cream" onClick={accept} disabled={!canContinue} style={{ flex: 1, minWidth: 190, padding: 15 }}>
              Accept and continue
            </button>
            <button onClick={decline} style={{ background: "none", border: "none", color: "var(--mut)", fontSize: 15, fontWeight: 600, cursor: "pointer", padding: "12px 8px" }}>
              Disconnect wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ checked, onToggle, href, label }: { checked: boolean; onToggle: () => void; href: string; label: string }) {
  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(); } }}
      className="flex items-center gap-3"
      style={{
        cursor: "pointer", padding: "14px 16px", borderRadius: 14,
        border: `1px solid ${checked ? "var(--border-2)" : "var(--border)"}`,
        background: checked ? "var(--cream-soft)" : "var(--bg-soft)",
        transition: "background .15s, border-color .15s",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center",
          border: `1.5px solid ${checked ? "var(--cream)" : "var(--border-2)"}`,
          background: checked ? "var(--cream)" : "transparent",
          color: "var(--cream-ink)", fontSize: 13, fontWeight: 800,
        }}
      >
      </span>
      <span style={{ fontSize: 14.5, color: "var(--text)" }}>
        I have read and accept the{" "}
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: "var(--text)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600 }}
        >
          {label}
        </a>.
      </span>
    </div>
  );
}
