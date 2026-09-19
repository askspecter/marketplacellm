import { NextResponse } from "next/server";
import { isAddress, parseAbi, type Address } from "viem";
import { ponsClient } from "@/lib/pons/reader";
import { getSpend, listLinks } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const erc20 = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
]);

/**
 * GET /api/portfolio?address=0x...
 * A wallet's position in LLMPad: the launches it created (with each one's model
 * and recorded compute spend) and any known-token balances it holds. Holdings
 * are read on-chain for the tokens LLMPad knows about (the pool links); if the
 * RPC is unreachable, holdings come back empty rather than failing the request.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address." }, { status: 400 });
  }
  const wallet = address as Address;
  const lower = wallet.toLowerCase();

  const links = await listLinks().catch(() => []);

  // Launches created by this wallet + their recorded compute spend.
  const mine = links.filter((l) => l.creator?.toLowerCase() === lower);
  const launched = await Promise.all(
    mine.map(async (l) => ({
      token: l.token,
      model: l.model,
      modelName: l.modelName,
      agentName: l.agentName ?? null,
      ticker: l.ticker ?? null,
      spendUsd: await getSpend(l.token).catch(() => 0),
    }))
  );

  // Holdings across every token LLMPad knows about (bounded to the links set).
  const client = ponsClient();
  const holdings = (
    await Promise.all(
      links.map(async (l) => {
        try {
          const token = l.token as Address;
          const [balance, symbol] = await Promise.all([
            client.readContract({ address: token, abi: erc20, functionName: "balanceOf", args: [wallet] }),
            client.readContract({ address: token, abi: erc20, functionName: "symbol" }).catch(() => "TOKEN"),
          ]);
          if ((balance as bigint) === 0n) return null;
          return {
            token: l.token,
            symbol: symbol as string,
            modelName: l.modelName,
            balance: (balance as bigint).toString(),
          };
        } catch {
          return null;
        }
      })
    )
  ).filter((h): h is NonNullable<typeof h> => h !== null);

  const spentUsd = launched.reduce((s, l) => s + l.spendUsd, 0);

  return NextResponse.json({ address: wallet, launched, holdings, spentUsd });
}
