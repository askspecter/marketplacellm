import { NextResponse } from "next/server";
import type { Address } from "viem";
import { readTokenInfoV2 } from "@/lib/pons/readerV2";
import { listLinks } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/launches
 * The feed: agents launched THROUGH Neuma. The source of truth is the pool
 * store (every launch registers a token->model link via /api/pool), so the feed
 * only ever shows this platform's own agents, never arbitrary tokens that happen
 * to exist on the shared Pons v2 factory. Ordering is newest-first (listLinks).
 *
 * Durability note: launches persist only when a KV store is configured (see
 * lib/kv.ts). Without one the link store is in-memory and resets per serverless
 * instance, so agents can vanish on refresh. Connect a Vercel KV / Upstash
 * database to the project to keep the feed permanent.
 */
export async function GET() {
  const links = await listLinks().catch(() => []);

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
    createdAt: number;
  }

  const feed: FeedItem[] = links.map((l) => ({
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
    logo: l.logo ?? null,
    createdAt: l.createdAt ?? 0,
  }));

  // Fill in any missing name / symbol / image from on-chain metadata so an agent
  // launched with a sparse profile still renders a real identity.
  await Promise.allSettled(
    feed.map(async (it) => {
      if (it.agentName && it.logo) return;
      try {
        const info = await readTokenInfoV2(it.token as Address);
        it.agentName = it.agentName ?? info.name ?? null;
        it.ticker = it.ticker ?? info.symbol ?? null;
        it.logo = it.logo ?? info.logo ?? null;
      } catch {
        /* leave nulls; the card falls back gracefully */
      }
    })
  );

  return NextResponse.json({ count: feed.length, launches: feed });
}
