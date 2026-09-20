import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)" }}>
      <div className="wrap flex flex-wrap items-end justify-between gap-6 py-12">
        <div>
          <div className="display text-4xl">{SITE.name}<span style={{ color: "var(--accent)" }}>.</span></div>
          <p className="mt-3 max-w-md text-sm" style={{ color: "var(--mut)" }}>
            A third-party interface to the Pons v2 protocol on Robinhood Chain. Not affiliated with Pons or OpenRouter.
            Non-custodial. Not financial advice.
          </p>
        </div>
        <div className="flex gap-7" style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mut)" }}>
          <Link href="/create" className="transition hover:text-[var(--ink)]">Launch</Link>
          <Link href="/compute" className="transition hover:text-[var(--ink)]">Compute</Link>
          <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="transition hover:text-[var(--ink)]">OpenRouter</a>
        </div>
      </div>
      <div className="wrap flex justify-between pb-8" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--dim)" }}>
        <span>© MMXXVI — {SITE.name} Atelier</span>
        <span>Robinhood Chain · Non-custodial</span>
      </div>
    </footer>
  );
}
