import { NextResponse } from "next/server";
import type { Address } from "viem";
import { indexV2Launches, readTokenInfoV2 } from "@/lib/pons/readerV2";
import { listLinks } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/launches
 * The feed: recent Pons v2 launches (indexed on-chain via the engine), each
 * annotated with the OpenRouter model it funds (from the compute-pool store).
 * Chain-indexed launches and locally-registered links are merged so the feed
 * still shows this deployment's launches even if the RPC is slow.
 */
export async function GET() {
  const links = await listLinks().catch(() => []);
  const byToken = new Map(links.map((l) => [l.token.toLowerCase(), l]));

  let onchain: Awaited<ReturnType<typeof indexV2Launches>> = [];
  try {
    onchain = await indexV2Launches({ limit: 18 });
  } catch {
    onchain = [];
  }

  interface FeedItem {
    token: string;
    curve: string;
    deployer: string;
    pairToken: string;
    blockNumber: string;
    txHash: string;
    model: string | null;
    modelName: string | null;
    agentName: string | null;
    ticker: string | null;
    bio: string | null;
    logo: string | null;
  }

  const seen = new Set<string>();
  const feed: FeedItem[] = onchain.map((l): FeedItem => {
    const key = l.token.toLowerCase();
    seen.add(key);
    const link = byToken.get(key);
    return {
      token: l.token,
      curve: l.curve,
      deployer: l.deployer,
      pairToken: l.pairToken,
      blockNumber: l.blockNumber.toString(),
      txHash: l.txHash,
      model: link?.model ?? null,
      modelName: link?.modelName ?? null,
      agentName: link?.agentName ?? null,
      ticker: link?.ticker ?? null,
      bio: link?.bio ?? null,
      logo: null,
    };
  });

  // Include locally-registered launches the indexer hasn't surfaced yet.
  for (const l of links) {
    if (seen.has(l.token.toLowerCase())) continue;
    feed.unshift({
      token: l.token,
      curve: l.curve ?? "0x",
      deployer: l.creator ?? "0x",
      pairToken: "0x0000000000000000000000000000000000000000",
      blockNumber: "0",
      txHash: l.txHash ?? "0x",
      model: l.model,
      modelName: l.modelName,
      agentName: l.agentName ?? null,
      ticker: l.ticker ?? null,
      bio: l.bio ?? null,
      logo: null,
    });
  }

  // Enrich items that have no local agent name with the token's on-chain
  // name / symbol / logo, so foreign launches render with a real identity.
  await Promise.allSettled(
    feed.map(async (it) => {
      if (it.agentName) return;
      try {
        const info = await readTokenInfoV2(it.token as Address);
        it.agentName = info.name || it.agentName;
        it.ticker = it.ticker ?? info.symbol ?? null;
        it.logo = info.logo || null;
      } catch {
        /* leave nulls; the card falls back gracefully */
      }
    })
  );

  return NextResponse.json({ count: feed.length, launches: feed });
}
