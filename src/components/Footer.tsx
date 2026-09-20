import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 40 }}>
      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 32 }}>
        <div className="flex items-center gap-2.5">
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--cream)", color: "var(--cream-ink)", display: "grid", placeItems: "center", fontWeight: 800 }}>◗</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{SITE.name}</span>
        </div>
        <p style={{ marginTop: 14, maxWidth: "58ch", color: "var(--mut)", fontSize: 14, lineHeight: 1.6 }}>
          Launch and explore autonomous agents on Robinhood Chain, each paired with ETH and powered by an OpenRouter
          model. Your wallet submits every transaction. {SITE.name} does not custody assets.
        </p>

        <div className="mt-8 grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <div>
            <div style={{ color: "var(--dim)", fontSize: 13, marginBottom: 12 }}>Product</div>
            <div className="flex flex-col gap-2.5" style={{ fontSize: 15 }}>
              <Link href="/" className="hover:text-[var(--text)]" style={{ color: "var(--mut)" }}>Explore</Link>
              <Link href="/create" className="hover:text-[var(--text)]" style={{ color: "var(--mut)" }}>Create</Link>
              <Link href="/portfolio" className="hover:text-[var(--text)]" style={{ color: "var(--mut)" }}>Portfolio</Link>
              <Link href="/compute" className="hover:text-[var(--text)]" style={{ color: "var(--mut)" }}>Compute</Link>
            </div>
          </div>
          <div style={{ maxWidth: "44ch" }}>
            <div style={{ color: "var(--dim)", fontSize: 13, marginBottom: 12 }}>Risk notice</div>
            <p style={{ color: "var(--mut)", fontSize: 13.5, lineHeight: 1.6 }}>
              Transactions are submitted through your wallet and may be irreversible. Tokens can be volatile or lose all
              value. {SITE.name} does not provide custody, warranties, or financial advice.
            </p>
          </div>
        </div>

        <div className="hairline" style={{ margin: "28px 0 18px" }} />
        <div className="flex flex-wrap items-center justify-between gap-3" style={{ color: "var(--dim)", fontSize: 13 }}>
          <span>© MMXXVI {SITE.name} · Built on Robinhood Chain · Not affiliated with Pons or OpenRouter</span>
        </div>
      </div>
    </footer>
  );
}
