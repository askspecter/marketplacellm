import Link from "next/link";
import { SITE } from "@/lib/site";

const PRODUCT: [string, string][] = [
  ["Explore", "/"],
  ["Create", "/create"],
  ["Portfolio", "/portfolio"],
  ["Compute", "/compute"],
  ["Leaderboard", "/leaderboard"],
  ["Stats", "/stats"],
];
const RESOURCES: [string, string][] = [
  ["Docs", "/docs"],
  ["Memorandum", "/memo"],
];
const LEGAL: [string, string][] = [
  ["Privacy Policy", "/privacy"],
  ["Terms of Use", "/terms"],
];

export function Footer() {
  return (
    <div className="wrap" style={{ paddingTop: 20, paddingBottom: 28 }}>
      <footer className="card" style={{ padding: 24 }}>
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/neuma.png" alt="Neuma" width={28} height={28} style={{ borderRadius: 8, border: "1px solid var(--border)", display: "block" }} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>{SITE.name}</span>
        </div>
        <p style={{ marginTop: 12, maxWidth: "56ch", color: "var(--mut)", fontSize: 14, lineHeight: 1.55 }}>
          Autonomous agents on Robinhood Chain, paired with ETH and powered by an @orbiodotso model. Your wallet submits
          every transaction. {SITE.name} does not custody assets.
        </p>

        <div className="flex flex-col" style={{ gap: 18, marginTop: 22 }}>
          <FSection title="Product">
            {PRODUCT.map(([l, h]) => (<Link key={l} href={h} style={{ color: "var(--mut)", fontSize: 15 }} className="hover:text-[var(--text)]">{l}</Link>))}
          </FSection>
          <FSection title="Resources">
            {RESOURCES.map(([l, h]) => (<Link key={l} href={h} style={{ color: "var(--mut)", fontSize: 15 }} className="hover:text-[var(--text)]">{l}</Link>))}
          </FSection>
          <FSection title="Legal">
            {LEGAL.map(([l, h]) => (<Link key={l} href={h} style={{ color: "var(--mut)", fontSize: 15 }} className="hover:text-[var(--text)]">{l}</Link>))}
          </FSection>
        </div>

        <div className="hairline" style={{ margin: "22px 0 16px" }} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span style={{ color: "var(--dim)", fontSize: 13 }}>© MMXXVI {SITE.name} Labs · Not financial advice</span>
          <div className="flex items-center gap-3">
            <a href="https://x.com/neumadotfamily" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 3, fontSize: 13.5, color: "var(--mut)" }}>@neumadotfamily</a>
            <a href="https://x.com/neumadotfamily" target="_blank" rel="noreferrer" aria-label="X"
              style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 15, fontWeight: 700 }}>X</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: "var(--dim)", fontSize: 12.5, marginBottom: 10 }}>{title}</div>
      <div className="flex flex-wrap items-center" style={{ gap: 22 }}>{children}</div>
    </div>
  );
}
