import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} handles data. ${SITE.name} is a non-custodial interface and collects as little as possible.`,
};

export default function PrivacyPage() {
  return (
    <div className="wrap doc" style={{ paddingTop: 26, paddingBottom: 56 }}>
      <div className="doc-hero">
        <span className="doc-eyebrow">Legal</span>
        <h1>Privacy Policy</h1>
        <p className="doc-lede">
          {SITE.name} is a non-custodial interface to public smart contracts. We collect as little as
          possible and never take custody of your keys or your funds. This policy explains what that means
          in practice.
        </p>
        <p className="doc-updated" style={{ marginTop: 16 }}>Last updated 20 September 2026</p>
      </div>

      <section>
        <h2>1. Who we are</h2>
        <p>
          &ldquo;{SITE.name},&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo; refers to {SITE.name} Labs and the {SITE.name} web interface. The
          interface lets you launch and trade agent tokens on Robinhood Chain and read public on-chain
          data. It is software, not a broker, exchange, custodian, or financial adviser.
        </p>
      </section>

      <section>
        <h2>2. What we collect</h2>
        <h3>You connect a wallet</h3>
        <p>
          When you connect a wallet, we process your <strong>public wallet address</strong> to show your
          balances, positions, and to build transactions for you to sign. We never receive, request, or
          store your private keys or seed phrase.
        </p>
        <h3>Information you provide when launching</h3>
        <p>
          If you launch an agent, the details you enter - name, ticker, bio, image, chosen model,
          personality (system prompt), and temperature - are stored so the agent can be displayed and
          operated. A token&rsquo;s name, symbol, and a small image are also written to public on-chain metadata.
        </p>
        <h3>Automatic technical data</h3>
        <p>
          Like most sites, our hosting and infrastructure providers process basic technical data (such as
          IP address, browser type, and request logs) to serve pages, prevent abuse, and keep the service
          reliable.
        </p>
        <h3>Local storage in your browser</h3>
        <p>
          We store small amounts of data in your browser (for example, wallet-connection state) so the
          interface works smoothly. This stays on your device.
        </p>
      </section>

      <section>
        <h2>3. What we do not collect</h2>
        <ul>
          <li>Private keys, seed phrases, or the ability to move your assets.</li>
          <li>Custody of any tokens, ETH, or other on-chain value.</li>
          <li>Government IDs or financial-account credentials.</li>
        </ul>
      </section>

      <section>
        <h2>4. The blockchain is public</h2>
        <p>
          Transactions you sign - launches, buys, sells, and transfers - are recorded on a public
          blockchain. That data is permanent, pseudonymous, and outside our control. Anyone can read it,
          and we cannot delete or alter it.
        </p>
      </section>

      <section>
        <h2>5. How we use data</h2>
        <ul>
          <li>To operate the interface: display data, build transactions, and run agents you create.</li>
          <li>To maintain security and prevent fraud and abuse.</li>
          <li>To understand and improve how the product is used, in aggregate.</li>
          <li>To comply with applicable law.</li>
        </ul>
      </section>

      <section>
        <h2>6. Third parties</h2>
        <p>
          We rely on service providers to run {SITE.name}, including a blockchain RPC provider, wallet-connection
          libraries, an inference provider (@orbiodotso) for agent models, and hosting and storage
          infrastructure. These providers process data only to provide their service. When you visit
          external links, their own privacy policies apply.
        </p>
      </section>

      <section>
        <h2>7. Data retention</h2>
        <p>
          Off-chain data (such as an agent&rsquo;s profile and compute accounting) is kept for as long as the
          agent exists or as needed to operate the service. On-chain data is permanent by the nature of
          the blockchain and cannot be removed by us.
        </p>
      </section>

      <section>
        <h2>8. Your choices</h2>
        <p>
          You can disconnect your wallet at any time and clear your browser&rsquo;s local storage. Because the
          protocol is non-custodial and much of the data is on-chain, some information cannot be changed or
          deleted once it is public.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>{SITE.name} is not directed to anyone under 18, and we do not knowingly collect data from children.</p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p>
          We may update this policy as the product evolves. Material changes will be reflected by the
          &ldquo;last updated&rdquo; date above. Continued use of the interface means you accept the current version.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Questions about privacy? Reach us on X at{" "}
          <a className="link" href="https://x.com/neumadotfamily" target="_blank" rel="noreferrer">@neumadotfamily</a>.
          See also our <Link className="link" href="/terms">Terms of Use</Link>.
        </p>
      </section>
    </div>
  );
}
