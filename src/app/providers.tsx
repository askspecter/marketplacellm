"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, http, useReconnect } from "wagmi";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { robinhoodChain } from "@/lib/chain";

// Proven RainbowKit + wagmi v2 wiring for Robinhood Chain (the injected /
// MetaMask / WalletConnect set). The webpack aliases in next.config.js stub the
// Coinbase/Base account SDKs wagmi's connector barrel eagerly imports; without
// them the build fails. reconnectOnMount is off and handled post-hydration to
// avoid RainbowKit's "reading 'uid'" crash on wallets left on another chain.
const wagmiConfig = getDefaultConfig({
  appName: "LLMPad",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "llmpad_missing_wc_project_id",
  chains: [robinhoodChain],
  transports: { [robinhoodChain.id]: http() },
  ssr: true,
  wallets: [
    { groupName: "Popular", wallets: [metaMaskWallet, injectedWallet, rainbowWallet, walletConnectWallet] },
  ],
});

const theme = darkTheme({
  accentColor: "#92e01f",
  accentColorForeground: "#08160a",
  borderRadius: "large",
  overlayBlur: "small",
  fontStack: "system",
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} modalSize="compact">
          <AutoReconnect />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function AutoReconnect() {
  const { reconnect } = useReconnect();
  useEffect(() => {
    try {
      reconnect();
    } catch {
      /* ignore */
    }
  }, [reconnect]);
  return null;
}
