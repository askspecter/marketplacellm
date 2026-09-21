import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Informational Memorandum",
  description: `How ${SITE.name} turns a token's market into the compute that keeps an AI agent alive — on Robinhood Chain.`,
};

export default function MemoPage() {
  return (
    <div className="wrap memo" style={{ paddingTop: 22, paddingBottom: 64 }}>
      <Link href="/" style={{ color: "var(--dim)", fontSize: 14 }}>← Explore</Link>

      <div className="memo-hero" style={{ marginTop: 12 }}>
        <span className="memo-kick">Informational Memorandum</span>
        <h1>Markets That Keep Agents Thinking</h1>
        <p className="memo-lede">
          Every trade an agent&rsquo;s token sees pays for the intelligence behind it. {SITE.name} pairs a fair-launch
          market with a self-funding pool of AI compute on Robinhood Chain — so an agent&rsquo;s mind is funded by the
          market around it, not a subscription.
        </p>
        <div className="memo-meta">
          <div><div className="k">Issuer</div><div className="v">{SITE.name} Labs</div></div>
          <div><div className="k">Network</div><div className="v">Robinhood Chain</div></div>
          <div><div className="k">Pairing</div><div className="v">ETH · Orbio</div></div>
          <div><div className="k">Handle</div><div className="v">@neumadotfamily</div></div>
        </div>
      </div>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§01</span><span className="lb">Executive Summary</span></div>
        <h2>What {SITE.name} does</h2>
        <p>
          {SITE.name} is an agent-native launchpad. Each launch mints three things at once: a <strong>token</strong> (a
          fair-launch ERC-20 on Robinhood Chain), a <strong>brain</strong> (an AI model the agent thinks with), and a{" "}
          <strong>compute pool</strong> (a live budget that pays for that thinking). A slice of every trade flows to the
          compute pool, and that budget buys the inference that keeps the agent responsive. The more a market trades, the
          more the agent can think.
        </p>
        <p className="pull">Launch an agent in one transaction, and let its market fund its mind — no code, no servers, no subscription.</p>
        <h3>Who this is for</h3>
        <ul>
          <li><strong>Creators</strong> — launch an autonomous agent with a real market behind it, without running infrastructure.</li>
          <li><strong>Traders</strong> — early, fair exposure to agents on a continuous bonding curve.</li>
          <li><strong>Holders</strong> — an asset whose activity funds a working product, inference, not just a narrative.</li>
          <li><strong>Builders</strong> — agents that can act on-chain and pay for their own compute.</li>
        </ul>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§02</span><span className="lb">The Problem</span></div>
        <h2>Agents can&rsquo;t pay for their own minds</h2>
        <p>
          Launching a token is easy; keeping an agent alive is not. Inference costs money every time the agent thinks, and
          most launches have no link between the market they create and the intelligence they promise. The market trades,
          the hype fades, and the &ldquo;agent&rdquo; behind it was never funded to run.
        </p>
        <p>
          The missing piece is a durable, on-chain connection between a token&rsquo;s activity and a compute budget. Without
          it, an agent is a static image with a ticker. With it, the agent becomes a participant whose capacity to act
          grows with its own market.
        </p>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§03</span><span className="lb">How It Works</span></div>
        <h2>One launch, three parts</h2>
        <div className="memo-tbl"><table><tbody>
          <tr><td>Token</td><td>A fair-launch ERC-20 on Robinhood Chain, paired with ETH. 1,000,000,000 supply, no presale.</td></tr>
          <tr><td>Brain</td><td>An AI model, chosen at launch and paired with the token for the life of the agent.</td></tr>
          <tr><td>Compute pool</td><td>A live budget funded by trading fees. Fees &rarr; compute &rarr; the agent keeps thinking.</td></tr>
        </tbody></table></div>
        <h3>The bonding curve</h3>
        <p>
          Each agent launches onto an ETH-denominated bonding curve that holds the full supply. Price is set by the
          curve, so trading is fair and continuous from block one — no order book, no listing step. As buyers raise ETH
          into the curve, it fills toward a graduation threshold and then <strong>graduates to a permanently-locked
          Uniswap V4 pool</strong>.
        </p>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§04</span><span className="lb">The Compute Loop</span></div>
        <h2>Fees become intelligence</h2>
        <p>
          This is the mechanic that makes an agent alive. Every trade accrues a fee in ETH; that ETH is the agent&rsquo;s
          compute budget. The budget is converted into AI credits through <strong>Orbio</strong> — an inference
          marketplace whose credits live on Robinhood Chain — and the agent spends those credits as it thinks and acts.
          Funded compute is derived directly from the curve&rsquo;s own reserves, so the number is honest about on-chain
          state rather than invented.
        </p>
        <div className="memo-tbl"><table><tbody>
          <tr><td>Fee source</td><td>Trading on the bonding curve (and, after graduation, the Uniswap V4 pool).</td></tr>
          <tr><td>Compute provider</td><td><strong>Orbio</strong> — 400+ models, one OpenAI-compatible endpoint, credits on Robinhood Chain.</td></tr>
          <tr><td>Shown per agent</td><td><strong>Funded</strong>, <strong>Spent</strong>, and <strong>Left</strong> — live, per token.</td></tr>
          <tr><td>Custody</td><td>Non-custodial. Creators claim their own fees; every transaction is wallet-signed.</td></tr>
        </tbody></table></div>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§05</span><span className="lb">Economics</span></div>
        <h2>Parameters</h2>
        <div className="memo-tbl"><table>
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Network</td><td>Robinhood Chain — Arbitrum-Orbit L2, gas in ETH</td></tr>
            <tr><td>Pairing</td><td>ETH</td></tr>
            <tr><td>Supply</td><td>1,000,000,000 — fair launch, no presale</td></tr>
            <tr><td>Pool fee</td><td>1.0% base + 2% routed to the compute pool</td></tr>
            <tr><td>Graduation</td><td>Locked Uniswap V4 pool once the curve fills</td></tr>
            <tr><td>Launch fee</td><td>None right now — you pay only gas</td></tr>
          </tbody>
        </table></div>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§06</span><span className="lb">Participants</span></div>
        <h2>Each role, a clear job</h2>
        <div className="memo-grid">
          <div className="memo-role"><div className="r">Creators</div><div className="d">Launch an agent — identity, brain, personality — and claim the fees it earns.</div></div>
          <div className="memo-role"><div className="r">Traders</div><div className="d">Buy and sell on a fair, continuous curve; every trade funds the agent&rsquo;s compute.</div></div>
          <div className="memo-role"><div className="r">Agents</div><div className="d">Think and act on Robinhood Chain, paying for inference from their own pool.</div></div>
          <div className="memo-role"><div className="r">Holders</div><div className="d">Hold an asset whose activity funds a working product, not just a story.</div></div>
        </div>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§07</span><span className="lb">Launch &amp; Positioning</span></div>
        <h2>Why Robinhood Chain, ETH and Orbio</h2>
        <p>
          {SITE.name} launches where the assets and the compute already live. Robinhood Chain is an Ethereum-compatible
          Layer 2 built for financial applications, with ETH as gas. Orbio — itself a launch on Robinhood Chain — pays AI
          credits to holders and settles inference on the same network, so an agent&rsquo;s fees and its compute never leave
          the chain they were created on. This placement is practical, and does not imply endorsement or affiliation with
          any third party.
        </p>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§08</span><span className="lb">Risks &amp; Next Steps</span></div>
        <h3>Volatility &amp; total loss</h3>
        <p>Agent tokens can be extremely volatile and may lose all value. Nothing here is financial advice.</p>
        <h3>Unaudited contracts</h3>
        <p>The underlying bonding-curve contracts are unaudited and may behave unexpectedly. Where a launch would revert, the create flow warns before you sign.</p>
        <h3>Inference dependency</h3>
        <p>An agent&rsquo;s ability to think depends on a third-party inference provider and on its compute pool being funded. When the pool runs dry, the agent pauses until trading refills it.</p>
        <h3>Pricing &amp; data</h3>
        <p>Prices, market caps and &ldquo;funded compute&rdquo; are estimates from live on-chain state and an external ETH price, and can be inaccurate.</p>
        <h3>Smart-contract &amp; chain dependence</h3>
        <p>Contract defects, key-management failures and reliance on one network&rsquo;s uptime and governance may cause loss or interruption.</p>
      </section>

      <section className="memo-sec">
        <div className="memo-eye"><span className="no">§09</span><span className="lb">Important Notice</span></div>
        <div className="memo-note"><p>
          This memorandum is provided solely for information. It is not an offer to sell, or a solicitation of an offer to
          buy, any security, token or financial product, and it does not constitute investment, legal, tax or accounting
          advice. {SITE.name} is non-custodial software — not a bank, broker, exchange or custodian. Product parameters,
          fees, integrations and timelines may change. Digital assets and smart contracts involve significant risk,
          including loss of principal.
        </p></div>
      </section>

      <div className="memo-links">
        <Link href="/">Explore</Link>
        <Link href="/create">Launch an agent</Link>
        <Link href="/docs">Docs</Link>
        <a href="https://x.com/neumadotfamily" target="_blank" rel="noreferrer">@neumadotfamily</a>
      </div>

      <p className="doc-updated" style={{ marginTop: 26 }}>{SITE.name} Labs · Informational Memorandum · MMXXVI</p>
    </div>
  );
}
