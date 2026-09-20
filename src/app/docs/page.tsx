import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs",
  description: `How ${SITE.name} works - agent launches, the bonding curve, and the self-funding compute pool.`,
};

export default function DocsPage() {
  return (
    <div className="wrap doc" style={{ paddingTop: 26, paddingBottom: 56 }}>
      <div className="doc-hero">
        <span className="doc-eyebrow">Documentation</span>
        <h1>How {SITE.name} works</h1>
        <p className="doc-lede">
          {SITE.name} is an agent-native launchpad on Robinhood Chain. Every agent is minted with a
          mind, a market, and a self-funding pool of compute - intelligence funded by the markets
          around it. This page explains the whole loop, end to end.
        </p>
        <div className="doc-toc">
          <a href="#overview">Overview</a>
          <a href="#launch">Launching an agent</a>
          <a href="#curve">The bonding curve</a>
          <a href="#compute">Compute pool</a>
          <a href="#fees">Fees &amp; economics</a>
          <a href="#custody">Custody &amp; safety</a>
          <a href="#faq">FAQ</a>
        </div>
      </div>

      <section id="overview">
        <h2>Overview</h2>
        <p>
          An agent on {SITE.name} is three things fused into one launch: a <strong>token</strong> (an
          ERC-20 on Robinhood Chain), a <strong>brain</strong> (an @orbiodotso model it thinks with),
          and a <strong>compute pool</strong> (a live budget that pays for that thinking). When people
          trade the token, a slice of every trade flows to the compute pool, and that pool buys the
          inference that keeps the agent alive. The more a market trades, the more the agent can think.
        </p>
        <div className="doc-grid">
          <div className="doc-card">
            <h3>Token</h3>
            <p>A fair-launch ERC-20 paired with ETH on a bonding curve. 1,000,000,000 supply, no presale.</p>
          </div>
          <div className="doc-card">
            <h3>Brain</h3>
            <p>Any @orbiodotso model, picked at launch. It becomes the agent&rsquo;s authoritative mind.</p>
          </div>
          <div className="doc-card">
            <h3>Compute</h3>
            <p>Trading fees accrue as an inference budget. Fees → compute → the agent keeps thinking.</p>
          </div>
        </div>
      </section>

      <section id="launch">
        <h2>Launching an agent</h2>
        <p>
          Head to <Link className="link" href="/create">Create</Link> and give your agent an identity: a
          name, a ticker, and optionally a face and a bio. Then pick the model it thinks with and write
          its personality - a system prompt that becomes the agent&rsquo;s authoritative voice. A
          temperament slider tunes how predictable or wild its replies are.
        </p>
        <ul>
          <li><strong>Identity.</strong> Name, ticker, and an optional image. Leave the image empty to use the model&rsquo;s badge as the face.</li>
          <li><strong>Brain.</strong> The @orbiodotso model, paired with ETH on a single pool.</li>
          <li><strong>Personality.</strong> The system prompt plus a temperature (0-2) that sets its style.</li>
          <li><strong>Dev buy.</strong> An optional opening buy that lands in the same transaction, so nobody gets in before you.</li>
        </ul>
        <p>
          There is no launch fee right now - you pay only gas. The launch runs on Robinhood Chain and
          <strong> your wallet submits the transaction</strong>. Agent images are stored efficiently so a
          launch stays cheap and reliable regardless of how large a file you upload.
        </p>
      </section>

      <section id="curve">
        <h2>The bonding curve</h2>
        <p>
          Each agent launches onto an ETH-denominated bonding curve that holds the full supply. Price is
          set by the curve, so early trading is fair and continuous - no order book, no listing step. As
          buyers raise ETH into the curve, it fills toward a graduation threshold.
        </p>
        <p>
          Once the curve fills, the agent <strong>graduates to a permanently-locked Uniswap V4 pool</strong>,
          where it trades from then on. Bonding-curve progress is shown live on every agent&rsquo;s page.
        </p>
      </section>

      <section id="compute">
        <h2>The compute pool</h2>
        <p>
          This is the twist that makes an agent alive. Every trade on the curve accrues a fee in ETH, and
          that ETH is the agent&rsquo;s compute budget. The budget is converted to @orbiodotso credits, so the
          agent can be prompted and can act. Funded compute is derived directly from the curve&rsquo;s own
          reserves, so the number is honest about on-chain state rather than invented.
        </p>
        <p>
          On each agent page you can see three figures: <strong>Funded</strong> (credited to the pool),{" "}
          <strong>Spent</strong> (inference used so far), and <strong>Left</strong> (what remains). Talk to
          the agent in its console and it spends from that pool.
        </p>
      </section>

      <section id="fees">
        <h2>Fees &amp; economics</h2>
        <ul>
          <li><strong>Network:</strong> Robinhood Chain.</li>
          <li><strong>Paired with:</strong> ETH.</li>
          <li><strong>Supply:</strong> 1,000,000,000 · fair launch, no presale.</li>
          <li><strong>Pool fee:</strong> 1.0% base + 2% routed to the compute pool.</li>
          <li><strong>Where your fees go:</strong> the compute pool that funds inference.</li>
          <li><strong>Graduation:</strong> to a locked Uniswap V4 pool once the curve fills.</li>
        </ul>
        <p>
          Starting market cap is set by the curve (≈ $3,502 at launch). Figures shown in the interface may
          be estimates and can change with the market and the ETH price.
        </p>
      </section>

      <section id="custody">
        <h2>Custody &amp; safety</h2>
        <p>
          {SITE.name} is <strong>non-custodial</strong>. Your wallet signs and submits every transaction; the
          protocol never holds your keys or your assets. The underlying bonding-curve contracts are
          unaudited and, on some networks, launches may be gated - the create flow surfaces a clear warning
          before you sign if a launch would revert.
        </p>
        <p>
          Tokens can be extremely volatile and may lose all value. Nothing here is financial advice. See the{" "}
          <Link className="link" href="/terms">Terms of Use</Link> and{" "}
          <Link className="link" href="/privacy">Privacy Policy</Link> for the full picture.
        </p>
      </section>

      <section id="faq">
        <h2>FAQ</h2>
        <h3>Do I need to code to launch an agent?</h3>
        <p>No. The <Link className="link" href="/create">Create</Link> flow is no-code - fill in the form, sign one transaction, and you&rsquo;re live.</p>
        <h3>Which models can an agent use?</h3>
        <p>Any model on @orbiodotso, chosen at launch. It&rsquo;s paired with the token for the life of the agent.</p>
        <h3>What happens when the compute pool runs out?</h3>
        <p>The agent simply can&rsquo;t think until trading refills the pool. More activity means more compute.</p>
        <h3>Can I change the model or personality later?</h3>
        <p>A token&rsquo;s model link is set once at launch and can&rsquo;t be re-pointed, which keeps an agent&rsquo;s brain stable and prevents hijacking its compute pool.</p>
      </section>

      <p className="doc-updated" style={{ marginTop: 40 }}>Last updated 20 September 2026</p>
    </div>
  );
}
