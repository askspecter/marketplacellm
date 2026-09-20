import type { Metadata, Viewport } from "next";
import "@rainbow-me/rainbowkit/styles.css"; // before globals — styles the connect modal
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description, type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#08090c" };

// RainbowKit's config throws during static prerender; render at request time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var V='llmpad-wallet-reset-1';if(localStorage.getItem('llmpad.walletReset')===V)return;var kill=/^(wagmi|wc@2|walletconnect|WALLETCONNECT|rk-|@rainbow|W3M|WCM|@w3m|@appkit|reown|@reown|CBWSDK|-walletlink)/i;Object.keys(localStorage).forEach(function(k){if(kill.test(k))localStorage.removeItem(k)});localStorage.setItem('llmpad.walletReset',V)}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-dvh flex-col overflow-x-hidden">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
