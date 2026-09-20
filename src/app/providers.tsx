"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { robinhoodChain } from "@/lib/chain";
import { SITE } from "@/lib/site";
import { WalletGate } from "@/components/WalletGate";

// Reown AppKit (the modern WalletConnect modal): a searchable list of 550+
// wallets — MetaMask, Trust, Binance, injected browser wallets, mobile via QR —
// styled to the Neuma brand. Set NEXT_PUBLIC_WC_PROJECT_ID (free at
// cloud.reown.com) to populate the full wallet directory; without it, only
// detected/injected wallets show.
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "llmpad_missing_wc_project_id";

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [robinhoodChain as unknown as AppKitNetwork];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Create the modal once, at module scope (per Reown's Next.js pattern).
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: networks[0],
  projectId,
  metadata: {
    name: SITE.name,
    description: SITE.description,
    url: "https://neuma.family",
    icons: ["/neuma.png"],
  },
  // Wallet-first: hide email / social login so the modal is a clean wallet list.
  features: { analytics: false, email: false, socials: false },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#92e01f",
    "--w3m-color-mix": "#92e01f",
    "--w3m-color-mix-strength": 8,
    "--w3m-font-family": "'Space Grotesk', system-ui, sans-serif",
    "--w3m-border-radius-master": "3px",
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletGate />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
