import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { isAddress } from "viem";
import { z } from "zod";
import { createCryptoTopup, fetchCredits, hasKey } from "@/lib/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  amountUsd: z.number().positive().max(100_000),
  sender: z.string().refine(isAddress, "sender must be an address"),
  chainId: z.number().int().positive().optional(),
});

/**
 * POST /api/treasury/topup   { amountUsd, sender, chainId? }
 *
 * The fee → compute on-ramp. Creates an OpenRouter crypto top-up charge and
 * returns the web3 calldata for the treasury to sign and pay (USDC on Base by
 * default). It does NOT move funds — the operator/keeper executes the returned
 * payment with the treasury wallet. See docs/TREASURY.md.
 *
 * Gated by TREASURY_SECRET (sent as `x-treasury-secret`) and requires
 * OPENROUTER_API_KEY.
 */
export async function POST(req: Request) {
  const secret = process.env.TREASURY_SECRET?.trim();
  if (secret) {
    const provided = req.headers.get("x-treasury-secret") ?? "";
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (!(a.length === b.length && timingSafeEqual(a, b))) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  } else {
    // No secret configured: refuse rather than expose an open money endpoint.
    return NextResponse.json(
      { error: "Treasury is not configured. Set TREASURY_SECRET to enable top-ups." },
      { status: 503 }
    );
  }

  if (!hasKey()) {
    return NextResponse.json({ error: "Set OPENROUTER_API_KEY to create a top-up charge." }, { status: 503 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  try {
    const [charge, credits] = await Promise.all([
      createCryptoTopup(body.amountUsd, body.sender, body.chainId),
      fetchCredits(),
    ]);
    return NextResponse.json({
      requested: { amountUsd: body.amountUsd, sender: body.sender, chainId: body.chainId ?? 8453 },
      creditsBefore: credits,
      charge,
      note: "Sign and send the returned web3 payment from the treasury wallet to finalize the top-up.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Top-up charge failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
