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
    <div className="card" style={{ padding: 20 }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div style={{ fontSize: 13, color: "var(--mut)" }}>Creator fees</div>
          <div className="num" style={{ marginTop: 4, fontSize: 26, fontWeight: 700 }}>{eth.toLocaleString("en-US", { maximumFractionDigits: 6 })} ETH</div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--dim)" }}>Claimable from the Pons v2 fee escrow - the compute budget your agents earned.</div>
        </div>
        <button onClick={claim} disabled={busy || wei === 0n} className="btn btn-cream">{busy ? "Claiming…" : "Claim fees"}</button>
      </div>
      {msg && (
        <p style={{ marginTop: 12, fontSize: 12.5, color: msg.kind === "ok" ? "var(--green)" : "var(--red)" }}>
          {msg.text} {msg.href && <a href={msg.href} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>view tx</a>}
        </p>
      )}
    </div>
  );
}
