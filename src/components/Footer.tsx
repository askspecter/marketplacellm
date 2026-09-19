import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-bg-line">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-white/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-white/80">LLMPad — every token funds a model.</div>
            <div className="mt-1 text-xs text-white/40">
              A third-party interface to the Pons v2 protocol on Robinhood Chain. Not affiliated with Pons or OpenRouter.
              Not financial advice.
            </div>
          </div>
          <div className="flex gap-5">
            <Link href="/create" className="hover:text-white">Launch</Link>
            <Link href="/compute" className="hover:text-white">Compute</Link>
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="hover:text-white">OpenRouter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
