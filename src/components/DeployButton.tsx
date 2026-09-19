"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEventLogs, type Abi } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getStrategy } from "@/lib/pons";
import { v2TokenLaunchedEvent } from "@/lib/pons/abisV2";
import { robinhoodChain } from "@/lib/chain";
import type { PickerModel } from "./ModelPicker";

type Phase = "idle" | "preparing" | "signing" | "pending" | "done" | "error";

export function DeployButton({
  name,
  ticker,
  description,
  imageUri,
  model,
  personality,
  temperature,
  onLaunched,
}: {
  name: string;
  ticker: string;
  description: string;
  imageUri: string;
  model: PickerModel | null;
  personality?: string;
  temperature?: number;
  onLaunched?: (token: string) => void;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [launchedToken, setLaunchedToken] = useState<string | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({ hash });

  // Once the launch tx is mined, decode the token address and register the
  // token → model link so the feed and token page know which model it funds.
  useEffect(() => {
    if (!receipt || !model) return;
    try {
      const logs = parseEventLogs({ abi: [v2TokenLaunchedEvent], logs: receipt.logs });
      const ev = logs[0];
      const token = (ev?.args as { token?: string })?.token;
      const curve = (ev?.args as { curve?: string })?.curve;
      if (token) {
        setLaunchedToken(token);
        fetch("/api/pool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            curve,
            model: model.id,
            creator: address,
            txHash: receipt.transactionHash,
            agentName: name.trim(),
            ticker: ticker.trim().toUpperCase(),
            bio: description.trim(),
            personality: personality?.trim() || undefined,
            temperature,
          }),
        }).catch(() => {});
        setPhase("done");
        onLaunched?.(token);
      } else {
        setPhase("done");
      }
    } catch {
      setPhase("done");
    }
  }, [receipt, model, address, onLaunched, name, ticker, description, personality, temperature]);

  const disabled =
    !isConnected || !model || !name.trim() || !ticker.trim() || phase === "preparing" || phase === "signing" || phase === "pending";

  async function launch() {
    if (!address || !model) return;
    setError(null);
    setWarnings([]);
    try {
      if (chainId !== robinhoodChain.id) {
        await switchChainAsync({ chainId: robinhoodChain.id });
      }

      setPhase("preparing");
      const plan = await getStrategy("v2").prepareLaunch(
        {
          version: "v2",
          name: name.trim(),
          ticker: ticker.trim().toUpperCase(),
          description: description.trim(),
          imageUri,
          quoteAsset: "ETH",
        },
        address
      );
      setWarnings(plan.warnings ?? []);

      setPhase("signing");
      const txHash = await writeContractAsync({
        address: plan.address,
        abi: plan.abi as Abi,
        functionName: plan.functionName,
        args: plan.args as readonly unknown[],
        value: plan.value,
      });
      setHash(txHash);
      setPhase("pending");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Launch failed.";
      setError(msg.slice(0, 240));
      setPhase("error");
    }
  }

  if (!isConnected) {
    return (
      <div className="rounded-xl2 border border-bg-line bg-bg-soft p-4 text-center">
        <p className="mb-3 text-sm text-white/60">Connect a wallet on Robinhood Chain to launch.</p>
        <div className="flex justify-center">
          <ConnectButton label="Connect wallet" />
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="rounded-xl2 border border-lime/40 bg-lime/5 p-4 text-center">
        <div className="text-lg font-semibold text-lime">Launched 🎉</div>
        {launchedToken ? (
          <a href={`/token/${launchedToken}`} className="mt-1 inline-block text-sm text-cyan-soft hover:text-cyan">
            Open the token page →
          </a>
        ) : (
          <div className="mt-1 text-sm text-white/50">Tx mined. Indexing…</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {warnings.map((w, i) => (
        <p key={i} className="rounded-lg border border-ember/30 bg-ember/5 p-3 text-xs text-ember/90">
          ⚠️ {w}
        </p>
      ))}
      {error && <p className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-xs text-ember">{error}</p>}

      <button
        onClick={launch}
        disabled={disabled}
        className="w-full rounded-full bg-signature px-6 py-3 font-semibold text-black shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {phase === "preparing" && "Preparing launch…"}
        {phase === "signing" && "Confirm in wallet…"}
        {phase === "pending" && "Launching on-chain…"}
        {(phase === "idle" || phase === "error") && `Launch $${ticker.trim().toUpperCase() || "TOKEN"} on Pons v2`}
      </button>
      <p className="text-center text-[11px] text-white/40">
        Paired with ETH · fair-launch bonding curve · you sign every tx (non-custodial)
      </p>
    </div>
  );
}
