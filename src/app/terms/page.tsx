import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms that govern your use of the ${SITE.name} interface.`,
};

export default function TermsPage() {
  return (
    <div className="wrap doc" style={{ paddingTop: 26, paddingBottom: 56 }}>
      <div className="doc-hero">
        <span className="doc-eyebrow">● Legal</span>
        <h1>Terms of Use</h1>
        <p className="doc-lede">
          These terms govern your use of the {SITE.name} interface. {SITE.name} is non-custodial software for
          interacting with public smart contracts — please read this carefully before you launch or trade.
        </p>
        <p className="doc-updated" style={{ marginTop: 16 }}>Last updated 20 September 2026</p>
      </div>

      <section>
        <h2>1. Acceptance</h2>
        <p>
          By accessing or using the {SITE.name} interface (the &ldquo;Service&rdquo;), you agree to these Terms of Use. If
          you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. What {SITE.name} is</h2>
        <p>
          {SITE.name} is a <strong>non-custodial</strong> interface that helps you build transactions for public
          smart contracts on Robinhood Chain and read on-chain data. We are <strong>not</strong> a broker, dealer,
          exchange, custodian, investment adviser, or financial institution. We do not hold your assets,
          execute trades on your behalf, or control the underlying contracts. Your wallet signs and submits
          every transaction.
        </p>
      </section>

      <section>
        <h2>3. Eligibility</h2>
        <p>
          You must be at least 18 years old and legally able to enter into these terms. You are responsible
          for ensuring that your use of the Service is lawful where you live, and you must not use it if you
          are in a jurisdiction where doing so is prohibited or where the Service is restricted.
        </p>
      </section>

      <section>
        <h2>4. No financial advice</h2>
        <p>
          Nothing on {SITE.name} is financial, investment, legal, or tax advice. Information and figures shown in
          the interface — including prices, market caps, and &ldquo;funded compute&rdquo; — may be estimates or
          simulated and can be inaccurate or out of date. You are solely responsible for your own decisions.
        </p>
      </section>

      <section>
        <h2>5. Risks you accept</h2>
        <ul>
          <li><strong>Volatility &amp; total loss.</strong> Agent tokens can be extremely volatile and may lose all value.</li>
          <li><strong>Unaudited contracts.</strong> The underlying bonding-curve contracts are unaudited and may contain bugs or behave unexpectedly.</li>
          <li><strong>Irreversibility.</strong> On-chain transactions are permanent. A transaction you sign cannot be undone, and mistakes are your responsibility.</li>
          <li><strong>No guarantees.</strong> Agents are experimental software; their outputs and behavior are not guaranteed and should not be relied upon.</li>
          <li><strong>Gas &amp; failed transactions.</strong> Network fees apply, and a transaction can revert (for example, if a launch is gated) — spending gas without completing.</li>
          <li><strong>Third-party dependencies.</strong> The Service relies on wallets, RPC providers, inference providers, and networks we do not control.</li>
        </ul>
      </section>

      <section>
        <h2>6. Your responsibilities</h2>
        <ul>
          <li>Keep your wallet, keys, and seed phrase secure. We can never recover them.</li>
          <li>Review every transaction in your wallet before signing.</li>
          <li>Comply with all applicable laws, including tax and securities laws.</li>
        </ul>
      </section>

      <section>
        <h2>7. Agent content</h2>
        <p>
          If you launch an agent, you are responsible for the identity and personality you give it and for
          the content it produces. You must not create agents or content that are unlawful, infringing,
          deceptive, or that impersonate real people or organizations. We may remove agents or restrict
          access at our discretion, but we do not pre-screen content and are not responsible for it.
        </p>
      </section>

      <section>
        <h2>8. Prohibited use</h2>
        <p>
          You agree not to use the Service to break the law, manipulate markets, defraud others, infringe
          intellectual property, interfere with or attack the Service, or circumvent any access controls or
          on-chain restrictions.
        </p>
      </section>

      <section>
        <h2>9. Intellectual property</h2>
        <p>
          The {SITE.name} name, interface, and branding belong to {SITE.name} Labs. On-chain assets and agent
          content are governed by their own terms and the smart contracts that create them.
        </p>
      </section>

      <section>
        <h2>10. Disclaimers</h2>
        <p>
          The Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available,&rdquo;</strong> without warranties of any kind,
          whether express or implied, including merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the Service will be uninterrupted, secure, or error-free.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {SITE.name} Labs and its contributors will not be liable for
          any indirect, incidental, special, consequential, or exemplary damages, or for any loss of
          profits, tokens, or data, arising from your use of the Service — including losses from volatility,
          contract bugs, failed transactions, or third-party services.
        </p>
      </section>

      <section>
        <h2>12. Indemnity</h2>
        <p>
          You agree to indemnify and hold harmless {SITE.name} Labs from any claims and expenses arising out of
          your use of the Service or your violation of these terms.
        </p>
      </section>

      <section>
        <h2>13. Changes &amp; termination</h2>
        <p>
          We may modify the Service or these terms at any time. Material changes are reflected by the
          &ldquo;last updated&rdquo; date above, and continued use means you accept them. We may also suspend or
          discontinue any part of the Service.
        </p>
      </section>

      <section>
        <h2>14. Contact</h2>
        <p>
          Questions? Reach us on X at{" "}
          <a className="link" href="https://x.com/neumadotfamily" target="_blank" rel="noreferrer">@neumadotfamily</a>.
          See also our <Link className="link" href="/privacy">Privacy Policy</Link> and the{" "}
          <Link className="link" href="/docs">docs</Link>.
        </p>
      </section>
    </div>
  );
}
