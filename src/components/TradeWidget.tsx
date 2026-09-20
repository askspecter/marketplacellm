"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract } from "wagmi";
import { parseEther, parseUnits, formatUnits, type Abi } from "viem";
import { ConnectWallet } from "@/components/ConnectWallet";
import { v2CurveAbi } from "@/lib/pons/abisV2";
import { quoteBuy, quoteSell, withSlippage, type CurveQuoteInputs } from "@/lib/pons/quote";
import { robinhoodChain } from "@/lib/chain";

const erc20ApproveAbi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export interface CurveInputsSerialized {
  quoteReserve: string; tokenReserve: string; sellableTokens: string; feeBps: string; creatorTaxBps: string; graduated: boolean;
}

export function TradeWidget({ curve, token, tokenSymbol, quoteIsNative, quoteDecimals, quoteSymbol, state }: {
  curve: `0x${string}`; token: `0x${string}`; tokenSymbol: string; quoteIsNative: boolean; quoteDecimals: number; quoteSymbol: string; state: CurveInputsSerialized;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const inputs: CurveQuoteInputs = useMemo(() => ({
    quoteReserve: BigInt(state.quoteReserve), tokenReserve: BigInt(state.tokenReserve), sellableTokens: BigInt(state.sellableTokens),
    feeBps: BigInt(state.feeBps), creatorTaxBps: BigInt(state.creatorTaxBps),
  }), [state]);

  const feePct = (Number(state.feeBps) / 100).toFixed(0);
  const taxPct = (Number(state.creatorTaxBps) / 100).toFixed(0);

  const estimate = useMemo(() => {
    if (!amount || Number(amount) <= 0) return null;
    try {
      if (side === "buy") {
        const quoteIn = quoteIsNative ? parseEther(amount) : parseUnits(amount, quoteDecimals);
        return { out: quoteBuy(quoteIn, inputs).tokensOut, label: tokenSymbol, dp: 18 };
      }
      return { out: quoteSell(parseUnits(amount, 18), inputs), label: quoteSymbol, dp: quoteDecimals };
    } catch { return null; }
  }, [amount, side, inputs, quoteIsNative, quoteDecimals, tokenSymbol, quoteSymbol]);

  if (state.graduated) {
    return <div className="card" style={{ padding: 18, fontSize: 14, color: "var(--mut)" }}>This agent has <span className="up">graduated</span> to Uniswap V4 - trade it on the DEX pool.</div>;
  }

  async function submit() {
    if (!address || !amount || Number(amount) <= 0) return;
    setBusy(true); setMsg(null);
    try {
      if (chainId !== robinhoodChain.id) await switchChainAsync({ chainId: robinhoodChain.id });
      if (side === "buy") {
        const quoteIn = quoteIsNative ? parseEther(amount) : parseUnits(amount, quoteDecimals);
        const minOut = withSlippage(quoteBuy(quoteIn, inputs).tokensOut, 300);
        await writeContractAsync({ address: curve, abi: v2CurveAbi as Abi, functionName: "buy", args: [quoteIn, minOut, address], value: quoteIsNative ? quoteIn : 0n });
        setMsg({ kind: "ok", text: "Buy submitted - fees just funded this agent's compute." });
      } else {
        const tokensIn = parseUnits(amount, 18);
        const minOut = withSlippage(quoteSell(tokensIn, inputs), 300);
        await writeContractAsync({ address: token, abi: erc20ApproveAbi as unknown as Abi, functionName: "approve", args: [curve, tokensIn] });
        await writeContractAsync({ address: curve, abi: v2CurveAbi as Abi, functionName: "sell", args: [tokensIn, minOut, address] });
        setMsg({ kind: "ok", text: "Sell submitted." });
      }
      setAmount("");
    } catch (e) { setMsg({ kind: "err", text: (e instanceof Error ? e.message : "Trade failed.").slice(0, 180) }); }
    finally { setBusy(false); }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="seg" style={{ marginBottom: 16 }}>
        {(["buy", "sell"] as const).map((s) => (
          <button key={s} onClick={() => setSide(s)} style={{ textTransform: "capitalize",
            background: side === s ? (s === "buy" ? "var(--green)" : "var(--red)") : "transparent",
            color: side === s ? "#08240f" : "var(--mut)" }}>{s}</button>
        ))}
      </div>

      <label style={{ display: "block" }}>
        <span style={{ display: "block", fontSize: 13, color: "var(--mut)", marginBottom: 6 }}>{side === "buy" ? `You pay (${quoteSymbol})` : `You sell (${tokenSymbol})`}</span>
        <input className="input num" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="0.0" style={{ fontSize: 20 }} />
      </label>

      {estimate && (
        <div className="flex justify-between" style={{ marginTop: 10, fontSize: 14 }}>
          <span style={{ color: "var(--mut)" }}>You receive ≈</span>
          <span className="num">{Number(formatUnits(estimate.out, estimate.dp)).toLocaleString("en-US", { maximumFractionDigits: 4 })} {estimate.label}</span>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--dim)" }}>Pool fee: <span style={{ color: "var(--mut)" }}>{feePct}% ({(Number(feePct) - Number(taxPct)).toFixed(0)}% base + {taxPct}% creator tax)</span></div>

      {msg && <p style={{ marginTop: 12, borderRadius: 12, padding: "10px 12px", fontSize: 12.5, background: msg.kind === "ok" ? "rgba(116,200,138,.1)" : "rgba(239,122,124,.1)", color: msg.kind === "ok" ? "var(--green)" : "var(--red)" }}>{msg.text}</p>}

      <div style={{ marginTop: 14 }}>
        {isConnected ? (
          <button onClick={submit} disabled={busy || !amount} className={`btn ${side === "buy" ? "btn-green" : "btn-red"}`} style={{ width: "100%", padding: 15 }}>
            {busy ? "Submitting…" : side === "buy" ? `Buy ${tokenSymbol}` : `Sell ${tokenSymbol}`}
          </button>
        ) : (
          <div className="flex justify-center"><ConnectWallet label="Connect wallet to trade" /></div>
        )}
      </div>
      <p style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: "var(--dim)" }}>3% slippage · pair {quoteSymbol} · non-custodial</p>
    </div>
  );
}
