import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, formatEther, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhoodChain } from "@/lib/chain";
import { PONS_V2 } from "@/lib/pons/registry";
import { v2FactoryAbi, v2CurveAbi } from "@/lib/pons/abisV2";
import { getEthUsd } from "@/lib/eth";
import { BURN_ADDRESS, BUYBACK_TOKEN, BUYBACK_USD, planBuyback } from "@/lib/buyback";
import type { CurveQuoteInputs } from "@/lib/pons/quote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/buyback  — one automated buyback-and-burn round of ~$BUYBACK_USD.
 *
 * Meant to be triggered by the Vercel Cron in vercel.json ("* * * * *"). It buys
 * $NEUMA on the bonding curve straight to the burn address (buy(recipient=dead)),
 * from a keeper wallet. It is OFF until you set:
 *   BUYBACK_ENABLED=true
 *   BUYBACK_KEEPER_PRIVATE_KEY=0x...        (fund this wallet with ETH)
 *   CRON_SECRET=...                         (Vercel sends it as a Bearer header)
 * Optional:
 *   BUYBACK_USD_PER_RUN (default 2)
 *   BUYBACK_MAX_ETH_PER_RUN (wei cap; default 0.01 ETH) — backstop if the price
 *                                           feed is wrong or the key leaks.
 */
export async function GET(req: Request) {
  const enabled = process.env.BUYBACK_ENABLED === "true";
  const key = process.env.BUYBACK_KEEPER_PRIVATE_KEY?.trim();
  if (!enabled || !key) {
    return NextResponse.json({ ok: false, reason: "disabled" });
  }

  // Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Allow a
  // manual trigger with ?key=<CRON_SECRET> too. If no secret is set, refuse.
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const ok = !!secret && (auth === `Bearer ${secret}` || url.searchParams.get("key") === secret);
  if (!ok) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const usdPerRun = Number(process.env.BUYBACK_USD_PER_RUN ?? BUYBACK_USD);
  const maxEthPerRun = BigInt(process.env.BUYBACK_MAX_ETH_PER_RUN ?? parseEther("0.01").toString());

  try {
    const account = privateKeyToAccount(key as `0x${string}`);
    const pub = createPublicClient({ chain: robinhoodChain, transport: http() });
    const wallet = createWalletClient({ account, chain: robinhoodChain, transport: http() });

    // Resolve the token's curve + phase from the factory.
    const launched = (await pub.readContract({
      address: PONS_V2.factory, abi: v2FactoryAbi, functionName: "getLaunchedToken", args: [BUYBACK_TOKEN],
    })) as { curve: `0x${string}`; phase: number; exists: boolean };
    if (!launched?.exists || !launched.curve) {
      return NextResponse.json({ ok: false, reason: "token not found" });
    }
    if (launched.phase !== 0) {
      return NextResponse.json({ ok: false, reason: "graduated; curve buyback n/a" });
    }
    const curve = launched.curve;

    // Read curve pricing state + native-quote flag.
    const [reserves, sellable, feeBps, taxBps, graduated, isNative] = await Promise.all([
      pub.readContract({ address: curve, abi: v2CurveAbi, functionName: "getReserves" }) as Promise<[bigint, bigint]>,
      pub.readContract({ address: curve, abi: v2CurveAbi, functionName: "sellableTokens" }) as Promise<bigint>,
      pub.readContract({ address: curve, abi: v2CurveAbi, functionName: "feeBps" }) as Promise<bigint>,
      pub.readContract({ address: curve, abi: v2CurveAbi, functionName: "creatorTaxBps" }) as Promise<bigint>,
      pub.readContract({ address: curve, abi: v2CurveAbi, functionName: "graduated" }) as Promise<boolean>,
      pub.readContract({ address: curve, abi: v2CurveAbi, functionName: "isNativeQuote" }) as Promise<boolean>,
    ]);
    if (graduated) return NextResponse.json({ ok: false, reason: "graduated" });
    if (!isNative) return NextResponse.json({ ok: false, reason: "not ETH-paired" });

    const ethUsd = await getEthUsd();
    if (!ethUsd) return NextResponse.json({ ok: false, reason: "no ETH/USD price" });

    const inputs: CurveQuoteInputs = {
      quoteReserve: reserves[0], tokenReserve: reserves[1], sellableTokens: sellable, feeBps, creatorTaxBps: taxBps,
    };
    const plan = planBuyback(usdPerRun, ethUsd, inputs);
    if (plan.quoteIn > maxEthPerRun) {
      return NextResponse.json({ ok: false, reason: `over cap (${formatEther(plan.quoteIn)} > ${formatEther(maxEthPerRun)} ETH)` });
    }

    const bal = await pub.getBalance({ address: account.address });
    if (bal < plan.quoteIn) {
      return NextResponse.json({ ok: false, reason: `keeper low: ${formatEther(bal)} ETH < ${formatEther(plan.quoteIn)} ETH` });
    }

    const hash = await wallet.writeContract({
      address: curve, abi: v2CurveAbi, functionName: "buy",
      args: [plan.quoteIn, plan.minOut, BURN_ADDRESS], value: plan.quoteIn,
    });

    return NextResponse.json({
      ok: true, hash, spentEth: formatEther(plan.quoteIn), minOut: plan.minOut.toString(), keeper: account.address,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "buyback failed";
    return NextResponse.json({ ok: false, reason: message.slice(0, 200) }, { status: 500 });
  }
}
