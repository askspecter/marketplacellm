import { NextResponse } from "next/server";
import { listLinks, getCredited, getSpend } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard
 * Agents ranked by the compute their trading has funded. Built from the
 * pool store (no chain calls), so it stays fast and reflects real on-platform
 * activity. Each row carries enough identity to render without extra lookups.
 */
export async function GET() {
  const links = await listLinks().catch(() => []);

  const rows = await Promise.all(
    links.map(async (l) => {
      const [fundedUsd, spentUsd] = await Promise.all([
        getCredited(l.token).catch(() => 0),
        getSpend(l.token).catch(() => 0),
      ]);
      return {
        token: l.token,
        agentName: l.agentName ?? null,
        ticker: l.ticker ?? null,
        model: l.model ?? null,
        modelName: l.modelName ?? null,
        logo: l.logo ?? null,
        creator: l.creator ?? null,
        createdAt: l.createdAt ?? 0,
        fundedUsd,
        spentUsd,
        remainingUsd: Math.max(0, fundedUsd - spentUsd),
      };
    })
  );

  rows.sort((a, b) => b.fundedUsd - a.fundedUsd || b.createdAt - a.createdAt);

  return NextResponse.json({ count: rows.length, agents: rows.slice(0, 50) });
}
