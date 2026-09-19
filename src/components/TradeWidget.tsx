"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract } from "wagmi";
import { parseEther, parseUnits, formatUnits, zeroAddress, type Abi } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { v2CurveAbi } from "@/lib/pons/abisV2";
import { quoteBuy, quoteSell, withSlippage, type CurveQuoteInputs } from "@/lib/pons/quote";
import { robinhoodChain } from "@/lib/chain";

const erc20ApproveAbi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export interface CurveInputsSerialized {
  quoteReserve: string;
  tokenReserve: string;
  sellableTokens: string;
  feeBps: string;
  creatorTaxBps: string;
  graduated: boolean;
}

export function TradeWidget({
  curve,
  token,
  tokenSymbol,
  quoteIsNative,
  quoteDecimals,
  quoteSymbol,
  state,
}: {
  curve: `0x${string}`;
  token: `0x${string}`;
  tokenSymbol: string;
  quoteIsNative: boolean;
  quoteDecimals: number;
  quoteSymbol: string;
  state: CurveInputsSerialized;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const inputs: CurveQuoteInputs = useMemo(
    () => ({
      quoteReserve: BigInt(state.quoteReserve),
      tokenReserve: BigInt(state.tokenReserve),
      sellableTokens: BigInt(state.sellableTokens),
      feeBps: BigInt(state.feeBps),
      creatorTaxBps: BigInt(state.creatorTaxBps),
    }),
    [state]
  );

  // Live estimate of what the user receives.
  const estimate = useMemo(() => {
    if (!amount || Number(amount) <= 0) return null;
    try {
      if (side === "buy") {
        const quoteIn = quoteIsNative ? parseEther(amount) : parseUnits(amount, quoteDecimals);
        const q = quoteBuy(quoteIn, inputs);
        return { out: q.tokensOut, outLabel: tokenSymbol, dp: 18 };
      }
      const tokensIn = parseUnits(amount, 18);
      const out = quoteSell(tokensIn, inputs);
      return { out, outLabel: quoteSymbol, dp: quoteDecimals };
    } catch {
      return null;
    }
  }, [amount, side, inputs, quoteIsNative, quoteDecimals, tokenSymbol, quoteSymbol]);

  const graduated = state.graduated;

  async function ensureChain() {
    if (chainId !== robinhoodChain.id) await switchChainAsync({ chainId: robinhoodChain.id });
  }

  async function submit() {
    if (!address || !amount || Number(amount) <= 0) return;
    setBusy(true);
    setMsg(null);
    try {
      await ensureChain();
      if (side === "buy") {
        const quoteIn = quoteIsNative ? parseEther(amount) : parseUnits(amount, quoteDecimals);
        const est = quoteBuy(quoteIn, inputs);
        const minOut = withSlippage(est.tokensOut, 300); // 3% slippage
        await writeContractAsync({
          address: curve,
          abi: v2CurveAbi as Abi,
          functionName: "buy",
          args: [quoteIn, minOut, address],
          value: quoteIsNative ? quoteIn : 0n,
        });
        setMsg({ kind: "ok", text: "Buy submitted. Fees just funded this token's compute." });
      } else {
        const tokensIn = parseUnits(amount, 18);
        const est = quoteSell(tokensIn, inputs);
        const minOut = withSlippage(est, 300);
        // ERC-20 launch token: approve the curve to pull tokens, then sell.
        await writeContractAsync({
          address: token,
          abi: erc20ApproveAbi as unknown as Abi,
          functionName: "approve",
          args: [curve, tokensIn],
        });
        await writeContractAsync({
          address: curve,
          abi: v2CurveAbi as Abi,
          functionName: "sell",
          args: [tokensIn, minOut, address],
        });
        setMsg({ kind: "ok", text: "Sell submitted." });
      }
      setAmount("");
    } catch (e) {
      setMsg({ kind: "err", text: (e instanceof Error ? e.message : "Trade failed.").slice(0, 200) });
    } finally {
      setBusy(false);
    }
  }

  if (graduated) {
    return (
      <div className="rounded-xl2 border border-bg-line bg-bg-panel p-5 text-sm text-white/60">
        This token has <span className="text-lime">graduated</span> to Uniswap V4 — trade it on the DEX pool. The curve is closed.
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-bg-line bg-bg-panel p-5">
      <div className="mb-4 flex rounded-lg bg-bg-soft p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold capitalize transition ${
              side === s
                ? s === "buy"
                  ? "bg-lime text-black"
                  : "bg-ember text-black"
                : "text-white/50 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-white/50">
          {side === "buy" ? `Spend (${quoteSymbol})` : `Sell (${tokenSymbol})`}
        </span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          placeholder="0.0"
          className="w-full rounded-lg border border-bg-line bg-bg-soft px-3 py-3 text-lg font-mono outline-none focus:border-cyan/50"
        />
      </label>

      {estimate && (
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-white/50">You receive ≈</span>
          <span className="font-mono text-white">
            {Number(formatUnits(estimate.out, estimate.dp)).toLocaleString("en-US", { maximumFractionDigits: 4 })}{" "}
            {estimate.outLabel}
          </span>
        </div>
      )}

      {msg && (
        <p className={`mt-3 rounded-lg p-2 text-xs ${msg.kind === "ok" ? "bg-lime/10 text-lime" : "bg-ember/10 text-ember"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-4">
        {isConnected ? (
          <button
            onClick={submit}
            disabled={busy || !amount}
            className="w-full rounded-full bg-signature py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Submitting…" : side === "buy" ? `Buy ${tokenSymbol}` : `Sell ${tokenSymbol}`}
          </button>
        ) : (
          <div className="flex justify-center">
            <ConnectButton label="Connect to trade" />
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-white/40">
        3% slippage · pair {quoteSymbol === "ETH" && quoteIsNative ? "native ETH" : quoteSymbol} · curve {zeroAddress === curve ? "—" : ""}
      </p>
    </div>
  );
}
