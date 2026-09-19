/**
 * Compute pool accounting — the bridge between on-chain trading and OpenRouter.
 *
 * The mechanic (LLMPad's twist, in the spirit of llmtokens.fun):
 *   1. A launch is PAIRED with one OpenRouter model at create time.
 *   2. Every trade on the Pons v2 bonding curve accrues a creator/protocol fee
 *      (in ETH). That ETH is the compute budget.
 *   3. fees(ETH) × ETH/USD ≈ OpenRouter credits → talk to the model.
 *
 * "Funded compute" for a token is DERIVED live from the curve's own reserves
 * (see fundedComputeUsd), so it is honest about the chain state rather than a
 * number we invented. This module only stores the token→model link and a small
 * per-token spend counter, in KV when configured, else in-process memory.
 */

import { getKv } from "./kv";

export interface LaunchLink {
  token: string;
  curve?: string;
  /** OpenRouter model id, e.g. "anthropic/claude-3.5-sonnet". */
  model: string;
  modelName: string;
  promptPerM: number;
  completionPerM: number;
  creator?: string;
  txHash?: string;
  createdAt: number;
}

const KEY_LINK = (token: string) => `llmpad:link:${token.toLowerCase()}`;
const KEY_INDEX = "llmpad:links";
const KEY_SPEND = (token: string) => `llmpad:spend:${token.toLowerCase()}`;

// In-process fallback (resets on redeploy; fine for local/dev).
const mem = {
  links: new Map<string, LaunchLink>(),
  index: new Set<string>(),
  spend: new Map<string, number>(),
};

export async function saveLink(link: LaunchLink): Promise<void> {
  const token = link.token.toLowerCase();
  const kv = getKv();
  if (kv) {
    await kv.set(KEY_LINK(token), link);
    await kv.sadd(KEY_INDEX, token);
    return;
  }
  mem.links.set(token, link);
  mem.index.add(token);
}

export async function getLink(token: string): Promise<LaunchLink | null> {
  const key = token.toLowerCase();
  const kv = getKv();
  if (kv) return (await kv.get<LaunchLink>(KEY_LINK(key))) ?? null;
  return mem.links.get(key) ?? null;
}

export async function listLinks(): Promise<LaunchLink[]> {
  const kv = getKv();
  if (kv) {
    const tokens = (await kv.smembers(KEY_INDEX)) ?? [];
    const links = await Promise.all(tokens.map((t) => kv.get<LaunchLink>(KEY_LINK(t))));
    return links.filter((l): l is LaunchLink => !!l).sort((a, b) => b.createdAt - a.createdAt);
  }
  return [...mem.links.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSpend(token: string): Promise<number> {
  const key = token.toLowerCase();
  const kv = getKv();
  if (kv) return (await kv.get<number>(KEY_SPEND(key))) ?? 0;
  return mem.spend.get(key) ?? 0;
}

export async function addSpend(token: string, usd: number): Promise<number> {
  const key = token.toLowerCase();
  const kv = getKv();
  if (kv) return (await kv.incrbyfloat(KEY_SPEND(key), usd)) as number;
  const next = (mem.spend.get(key) ?? 0) + usd;
  mem.spend.set(key, next);
  return next;
}

/**
 * Derive the compute (USD) a token's trading has funded so far, from the live
 * bonding-curve state. Fees are the curve fee applied to the quote raised.
 *   fundedUsd ≈ realQuoteReserve(ETH) × (feeBps / 10000) × ethUsd
 */
export function fundedComputeUsd(realQuoteReserveWei: bigint, feeBps: bigint, ethUsd: number): number {
  if (ethUsd <= 0) return 0;
  const raisedEth = Number(realQuoteReserveWei) / 1e18;
  const feeRate = Number(feeBps) / 10_000;
  return raisedEth * feeRate * ethUsd;
}
