"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { shortAddr } from "@/lib/format";

/**
 * Opens the Reown AppKit modal (searchable 550+ wallet directory). When a
 * wallet is connected the button shows the short address and opens the account
 * view. A drop-in replacement for RainbowKit's ConnectButton across the app.
 */
export function ConnectWallet({
  label = "Connect",
  full = false,
  compact = false,
}: {
  label?: string;
  full?: boolean;
  compact?: boolean;
}) {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  return (
    <button
      type="button"
      className="btn btn-cream"
      onClick={() => open()}
      style={{
        ...(full ? { width: "100%" } : {}),
        ...(compact ? { padding: "9px 16px", fontSize: 14 } : {}),
      }}
    >
      {isConnected && address ? shortAddr(address) : label}
    </button>
  );
}
