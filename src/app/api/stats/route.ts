import { NextResponse } from "next/server";
import { zeroAddress, type Address } from "viem";
import { indexV2Launches, getCurveState } from "@/lib/pons/readerV2";
import { listLinks, getSpend, fundedComputeUsd } from "@/lib/pool";
import { getEthUsd } from "@/lib/eth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stats
 * Platform-wide totals for the homepage hero, computed from REAL on-chain state:
 *  - agents:    every Pons v2 launch on this platform (on-chain) merged with
 *               locally-registered Neuma agents.
 *  - fundedUsd: creator fees funded into compute across all agents, DERIVED from
 *               each live bonding curve's own reserves (fundedComputeUsd), so the
 *               number reflects actual trading, not a keeper-set value that stays
 *               0 until a top-up runs.
 *  - spentUsd:  inference actually spent by agents (0 until they think).
 * Cached in-process briefly so a busy homepage doesn't hammer the RPC.
 */
interface StatsBody { agents: number; fundedUsd: number; spentUsd: number; remainingUsd: number }
let cache: { at: number; body: StatsBody } | null = null;
const TTL_MS = 30_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) return NextResponse.json(cache.body);

  const [onchain, links, ethUsd] = await Promise.all([
    indexV2Launches({ limit: 60 }).catch(() => []),
    listLinks().catch(() => []),
    getEthUsd().catch(() => null),
  ]);

  // Union of tokens (on-chain launches + locally-registered agents) -> curve.
  const curveByToken = new Map<string, Address>();
  for (const l of onchain) curveByToken.set(l.token.toLowerCase(), l.curve as Address);
  for (const l of links) if (l.curve) curveByToken.set(l.token.toLowerCase(), l.curve as Address);
  const agents = curveByToken.size;

  // Creator fees funded = fees accrued on each live curve (realQuoteReserve × feeBps).
  let fundedUsd = 0;
  if (ethUsd) {
    const curves = [...curveByToken.values()].filter((c) => c && c !== zeroAddress);
    const states = await Promise.allSettled(curves.map((c) => getCurveState(c)));
    for (const s of states) {
      if (s.status === "fulfilled" && s.value) {
        fundedUsd += fundedComputeUsd(s.value.realQuoteReserve, s.value.feeBps, ethUsd);
      }
    }
  }

  // Compute spent = inference recorded against agents (real; 0 until they think).
  let spentUsd = 0;
  await Promise.all(
    links.map(async (l) => { spentUsd += await getSpend(l.token).catch(() => 0); })
  );

  const body: StatsBody = { agents, fundedUsd, spentUsd, remainingUsd: Math.max(0, fundedUsd - spentUsd) };
  cache = { at: Date.now(), body };
  return NextResponse.json(body);
}
