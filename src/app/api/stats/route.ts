import { NextResponse } from "next/server";
import { listLinks, getCredited, getSpend } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stats
 * Platform-wide totals across every agent launched here: creator fees funded
 * into compute pools (credited), compute spent, and the agent count. Aggregated
 * from the pool store; returns zeros when nothing has launched yet, so the
 * homepage stat is always honest about real on-platform activity.
 */
export async function GET() {
  const links = await listLinks().catch(() => []);
  let fundedUsd = 0;
  let spentUsd = 0;
  await Promise.all(
    links.map(async (l) => {
      const [c, s] = await Promise.all([
        getCredited(l.token).catch(() => 0),
        getSpend(l.token).catch(() => 0),
      ]);
      fundedUsd += c;
      spentUsd += s;
    })
  );
  return NextResponse.json({
    agents: links.length,
    fundedUsd,
    spentUsd,
    remainingUsd: Math.max(0, fundedUsd - spentUsd),
  });
}
