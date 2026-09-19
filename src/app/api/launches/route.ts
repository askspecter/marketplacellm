import { NextResponse } from "next/server";
import { indexV2Launches } from "@/lib/pons/readerV2";
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
    onchain = await indexV2Launches({ limit: 36 });
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
    });
  }

  return NextResponse.json({ count: feed.length, launches: feed });
}
