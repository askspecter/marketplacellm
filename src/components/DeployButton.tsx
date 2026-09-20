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
  initialBuyEth,
  onLaunched,
}: {
  name: string;
  ticker: string;
  description: string;
  imageUri: string;
  model: PickerModel | null;
  personality?: string;
  temperature?: number;
  initialBuyEth?: string;
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
          initialBuyEth: initialBuyEth && Number(initialBuyEth) > 0 ? initialBuyEth : undefined,
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
      <div className="card-2" style={{ padding: 16, textAlign: "center" }}>
        <p style={{ marginBottom: 12, fontSize: 14, color: "var(--mut)" }}>Connect a wallet on Robinhood Chain to launch.</p>
        <div className="flex justify-center"><ConnectButton label="Connect wallet" /></div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="card-2" style={{ padding: 16, textAlign: "center", borderColor: "rgba(116,200,138,.4)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>Launched 🎉</div>
        {launchedToken ? (
          <a href={`/token/${launchedToken}`} style={{ marginTop: 4, display: "inline-block", fontSize: 14, color: "var(--cream)" }}>Open the agent →</a>
        ) : (
          <div style={{ marginTop: 4, fontSize: 14, color: "var(--mut)" }}>Tx mined. Indexing…</div>
        )}
      </div>
    );
  }

  const wrongChain = isConnected && chainId !== robinhoodChain.id;

  return (
    <div className="flex flex-col gap-3">
      {wrongChain && (
        <div className="notice" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
          <span>Wallet is on the wrong network.</span>
          <button
            className="btn btn-cream"
            style={{ padding: "7px 14px", fontSize: 13 }}
            onClick={() => switchChainAsync({ chainId: robinhoodChain.id }).catch(() => {})}
          >
            Switch to Robinhood Chain
          </button>
        </div>
      )}
      {warnings.map((w, i) => (<p key={i} className="notice" style={{ fontSize: 12.5 }}>⚠️ {w}</p>))}
      {error && <p className="notice" style={{ borderColor: "rgba(239,122,124,.4)", background: "rgba(239,122,124,.08)", color: "var(--red)", fontSize: 12.5 }}>{error}</p>}
      <button onClick={launch} disabled={disabled} className="btn btn-cream" style={{ width: "100%", padding: 15 }}>
        {phase === "preparing" && "Preparing launch…"}
        {phase === "signing" && "Confirm in wallet…"}
        {phase === "pending" && "Launching on-chain…"}
        {(phase === "idle" || phase === "error") && `Launch $${ticker.trim().toUpperCase() || "TOKEN"}`}
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: "var(--dim)" }}>Paired with ETH · fair-launch bonding curve · you sign every tx</p>
    </div>
  );
}
