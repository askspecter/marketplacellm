import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { zeroAddress, type Address } from "viem";
import { getCurveState, getLaunchedTokenV2 } from "@/lib/pons/readerV2";
import { fundedComputeUsd, getLink, listLinks, setCredited } from "@/lib/pool";
import { getEthUsd } from "@/lib/eth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/treasury/sync   { token? }
 *
 * The treasury keeper. For each launch (or one token) it reads the live curve
 * state, derives the compute its trading fees have funded (fees × ETH/USD), and
 * records that as the token's credited compute.
 *
 * This is the on-ramp seam: recording the funded amount is what a keeper does
 * AFTER topping up OpenRouter credits for the pool. The actual top-up is an
 * account/treasury action (OpenRouter credits are off-chain), intentionally not
 * automated with secrets here. Gate this route by setting TREASURY_SECRET and
 * sending it as `x-treasury-secret`; unset means open (dev only).
 */
export async function POST(req: Request) {
  const secret = process.env.TREASURY_SECRET?.trim();
  if (secret) {
    const provided = req.headers.get("x-treasury-secret") ?? "";
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let only: string | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as { token?: string };
    only = body.token;
  } catch {
    /* no body is fine — sync all */
  }

  const ethUsd = await getEthUsd();
  if (!ethUsd) return NextResponse.json({ error: "ETH price unavailable." }, { status: 502 });

  const links = only ? [await getLink(only)].filter(Boolean) : await listLinks();
  const results: { token: string; creditedUsd: number }[] = [];

  for (const link of links) {
    if (!link) continue;
    try {
      const record = await getLaunchedTokenV2(link.token as Address);
      if (!record.exists || !record.curve || record.curve === zeroAddress) continue;
      const curve = await getCurveState(record.curve);
      const funded = fundedComputeUsd(curve.realQuoteReserve, curve.feeBps, ethUsd);
      const credited = await setCredited(link.token, funded);
      results.push({ token: link.token, creditedUsd: credited });
    } catch {
      // Chain unreachable for this token; skip without failing the batch.
    }
  }

  return NextResponse.json({ ethUsd, synced: results.length, results });
}
