import Link from "next/link";
import { LaunchFeed } from "@/components/LaunchFeed";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-bg-line bg-bg-panel px-3 py-1 text-xs font-medium text-cyan-soft">
            <span className="h-1.5 w-1.5 animate-pulseline rounded-full bg-cyan" />
            Pons v2 bonding curve · powered by OpenRouter
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Every token <span className="text-gradient">funds a model.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/60">
            Launch an ETH-paired token on the Pons v2 fair-launch curve. Every trade pays a fee — and that fee becomes
            OpenRouter compute. Anyone who launched can spend it talking to any of 400+ models.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/create"
              className="rounded-full bg-signature px-6 py-3 font-semibold text-black shadow-glow transition hover:brightness-110"
            >
              Launch a token
            </Link>
            <Link
              href="/compute"
              className="rounded-full border border-bg-line px-6 py-3 font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Open compute
            </Link>
          </div>
          <dl className="mt-10 flex gap-8 text-sm">
            <div>
              <dt className="text-white/40">Pair asset</dt>
              <dd className="mt-1 font-mono text-lg font-bold text-white">ETH</dd>
            </div>
            <div>
              <dt className="text-white/40">Models</dt>
              <dd className="mt-1 font-mono text-lg font-bold text-white">400+</dd>
            </div>
            <div>
              <dt className="text-white/40">Graduates to</dt>
              <dd className="mt-1 font-mono text-lg font-bold text-white">Uniswap V4</dd>
            </div>
          </dl>
        </div>

        {/* Flow card */}
        <div className="rounded-xl2 border border-bg-line bg-bg-panel p-6 shadow-panel">
          <div className="text-xs uppercase tracking-widest text-white/40">The loop</div>
          <ol className="mt-4 space-y-3 font-mono text-sm">
            {[
              ["01", "Pick a model", "Any OpenRouter model — Claude, GPT, Llama, DeepSeek…"],
              ["02", "Launch, paired with ETH", "One tx deploys a Pons v2 bonding-curve token."],
              ["03", "Trades pay fees", "Each buy/sell accrues a fee in ETH on the curve."],
              ["04", "Fees → compute", "ETH fees fund OpenRouter credits for that model."],
              ["05", "Spend compute", "Launchers chat with the model the token funds."],
            ].map(([n, t, d]) => (
              <li key={n} className="flex gap-3 rounded-lg border border-bg-line bg-bg-soft p-3">
                <span className="text-gradient font-bold">{n}</span>
                <div>
                  <div className="font-semibold text-white">{t}</div>
                  <div className="mt-0.5 text-xs text-white/50">{d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Feed */}
      <section id="feed" className="pb-24">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent launches</h2>
          <Link href="/create" className="text-sm text-cyan-soft hover:text-cyan">
            + New launch
          </Link>
        </div>
        <LaunchFeed />
      </section>
    </div>
  );
}
