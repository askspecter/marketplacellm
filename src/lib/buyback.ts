import { parseEther } from "viem";
import { quoteBuy, withSlippage, type CurveQuoteInputs } from "@/lib/pons/quote";

/** The burn sink: tokens sent here are permanently out of circulation. */
export const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as const;

/** $NEUMA — the token this engine buys back and burns. */
export const BUYBACK_TOKEN =
  ((process.env.NEXT_PUBLIC_BUYBACK_TOKEN as `0x${string}`) ||
    "0xa6f1a20408c8edb181a0e8faa54357c70b8f730a") as `0x${string}`;

/** Dollars spent per buyback round (default $1). */
export const BUYBACK_USD = Number(process.env.NEXT_PUBLIC_BUYBACK_USD ?? "1");

/** Slippage tolerance for the buyback swap (bps). Buybacks can be lenient. */
export const BUYBACK_SLIPPAGE_BPS = 500; // 5%

export interface BuybackPlan {
  quoteIn: bigint; // ETH (wei) to spend this round
  expected: bigint; // expected NEUMA out
  minOut: bigint; // slippage-protected floor
}

/**
 * Size a USD target into ETH (wei) and a min-out floor for a curve buy, using
 * the same pure quote math the trade widget uses. The bought NEUMA is sent to
 * BURN_ADDRESS, so a buy IS a burn.
 */
export function planBuyback(
  usd: number,
  ethUsd: number,
  inputs: CurveQuoteInputs,
  slippageBps: number = BUYBACK_SLIPPAGE_BPS
): BuybackPlan {
  if (!Number.isFinite(ethUsd) || ethUsd <= 0) throw new Error("no ETH/USD price");
  if (!Number.isFinite(usd) || usd <= 0) throw new Error("bad USD amount");
  const eth = usd / ethUsd;
  const quoteIn = parseEther(eth.toFixed(18));
  const expected = quoteBuy(quoteIn, inputs).tokensOut;
  const minOut = withSlippage(expected, slippageBps);
  return { quoteIn, expected, minOut };
}
