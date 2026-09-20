import Link from "next/link";
import { SITE } from "@/lib/site";

const PRODUCT: [string, string][] = [
  ["Explore", "/"],
  ["Create", "/create"],
  ["Portfolio", "/portfolio"],
  ["Compute", "/compute"],
  ["Docs", "/#"],
];
const LEGAL: [string, string][] = [
  ["Privacy Policy", "/#"],
  ["Terms of Use", "/#"],
];

export function Footer() {
  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <footer className="card" style={{ padding: 32 }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 40, lineHeight: 1, letterSpacing: "-.01em" }}>{SITE.name.toLowerCase()}</div>
        <p style={{ marginTop: 18, maxWidth: "52ch", color: "var(--mut)", fontSize: 15.5, lineHeight: 1.6 }}>
          Launch and explore autonomous agents on Robinhood Chain, each paired with ETH and powered by an OpenRouter
          model. Your wallet submits every transaction. {SITE.name} does not custody assets.
        </p>

        <FSection title="Product">
          {PRODUCT.map(([l, h]) => (
            <Link key={l} href={h} style={{ color: "var(--text)", fontSize: 17 }} className="hover:opacity-70">{l}</Link>
          ))}
        </FSection>

        <FSection title="Legal">
          {LEGAL.map(([l, h]) => (
            <Link key={l} href={h} style={{ color: "var(--text)", fontSize: 17 }} className="hover:opacity-70">{l}</Link>
          ))}
        </FSection>

        <div style={{ marginTop: 34 }}>
          <div style={{ color: "var(--dim)", fontSize: 14, marginBottom: 12 }}>Risk notice</div>
          <p style={{ maxWidth: "62ch", color: "var(--mut)", fontSize: 15, lineHeight: 1.6 }}>
            Transactions are submitted through your wallet and may be irreversible. Tokens can be volatile or lose all
            value. {SITE.name} does not provide custody, warranties, or financial advice.
          </p>
        </div>

        <div className="hairline" style={{ margin: "30px 0 20px" }} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span style={{ color: "var(--dim)", fontSize: 15 }}>© MMXXVI {SITE.name} Labs</span>
          <div className="flex items-center gap-4">
            <a href="https://x.com/neumadotfamily" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 3, fontSize: 15 }}>@neumadotfamily</a>
            <a href="https://x.com/neumadotfamily" target="_blank" rel="noreferrer" aria-label="X"
              style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700 }}>𝕏</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 34 }}>
      <div style={{ color: "var(--dim)", fontSize: 14, marginBottom: 14 }}>{title}</div>
      <div className="flex flex-wrap items-center" style={{ gap: 26 }}>{children}</div>
    </div>
  );
}
