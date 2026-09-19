"use client";

import { useState } from "react";
import { useAccount, useChainId, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { formatEther, type Abi } from "viem";
import { PONS_V2 } from "@/lib/pons/registry";
import { v2FeeEscrowAbi } from "@/lib/pons/abisV2";
import { robinhoodChain, explorerTx } from "@/lib/chain";

/**
 * ClaimFees — the first, non-custodial half of the fee → compute loop.
 *
 * Creator/agent trading fees accrue as native ETH in the Pons v2 fee escrow,
 * keyed by the recipient (the wallet set as creatorFeeRecipient at launch). This
 * reads the connected wallet's claimable balance and lets them claim() it — the
 * user signs; nothing custodial. The claimed ETH is what the treasury then
 * converts into OpenRouter compute (see docs/TREASURY.md and /api/treasury/topup).
 */
export function ClaimFees() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string; href?: string } | null>(null);

  const { data: claimable, refetch } = useReadContract({
    address: PONS_V2.feeEscrow,
    abi: v2FeeEscrowAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 20_000 },
  });

  const wei = (claimable as bigint | undefined) ?? 0n;
  const eth = Number(formatEther(wei));

  async function claim() {
    if (!address || wei === 0n) return;
    setBusy(true);
    setMsg(null);
    try {
      if (chainId !== robinhoodChain.id) await switchChainAsync({ chainId: robinhoodChain.id });
      const hash = await writeContractAsync({
        address: PONS_V2.feeEscrow,
        abi: v2FeeEscrowAbi as Abi,
        functionName: "claim",
        args: [],
      });
      setMsg({ kind: "ok", text: "Fees claimed.", href: explorerTx(hash) });
      setTimeout(() => refetch(), 3000);
    } catch (e) {
      setMsg({ kind: "err", text: (e instanceof Error ? e.message : "Claim failed.").slice(0, 160) });
    } finally {
      setBusy(false);
    }
  }

  if (!isConnected) return null;

  return (
    <div className="rounded-xl2 border border-cyan/30 bg-signature-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-cyan-soft">Creator fees</div>
          <div className="mt-1 font-mono text-2xl font-bold text-white">{eth.toLocaleString("en-US", { maximumFractionDigits: 6 })} ETH</div>
          <div className="mt-1 text-xs text-white/50">Claimable from the Pons v2 fee escrow — this is the compute budget your agents earned.</div>
        </div>
        <button
          onClick={claim}
          disabled={busy || wei === 0n}
          className="rounded-full bg-signature px-5 py-2.5 font-semibold text-black transition hover:brightness-110 disabled:opacity-40"
        >
          {busy ? "Claiming…" : "Claim fees"}
        </button>
      </div>
      {msg && (
        <p className={`mt-3 text-xs ${msg.kind === "ok" ? "text-lime" : "text-ember"}`}>
          {msg.text}{" "}
          {msg.href && (
            <a href={msg.href} target="_blank" rel="noreferrer" className="underline">
              view tx
            </a>
          )}
        </p>
      )}
    </div>
  );
}
