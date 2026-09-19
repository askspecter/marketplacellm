import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { fetchCredits, findModel } from "@/lib/openrouter";
import { getCredited, getLink, getSpend, listLinks, saveLink } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pool            → all token→model links + live OpenRouter credits
 * GET /api/pool?token=0x   → one token's link + recorded spend
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (token) {
    if (!isAddress(token)) return NextResponse.json({ error: "Invalid token address." }, { status: 400 });
    const [link, spend, credited] = await Promise.all([getLink(token), getSpend(token), getCredited(token)]);
    return NextResponse.json({ link, spendUsd: spend, creditedUsd: credited, remainingUsd: Math.max(0, credited - spend) });
  }

  const [links, credits] = await Promise.all([listLinks(), fetchCredits()]);
  return NextResponse.json({ links, credits });
}

const PostBody = z.object({
  token: z.string().refine(isAddress, "token must be an address"),
  curve: z.string().optional(),
  model: z.string().min(1),
  creator: z.string().optional(),
  txHash: z.string().optional(),
});

/**
 * POST /api/pool  { token, model, curve?, creator?, txHash? }
 * Register the model a freshly-launched token funds. Called by the client right
 * after a successful v2 deploy. The model is validated against the live catalog.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof PostBody>;
  try {
    body = PostBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const model = await findModel(body.model);
  if (!model) return NextResponse.json({ error: "Unknown OpenRouter model id." }, { status: 400 });

  await saveLink({
    token: body.token,
    curve: body.curve,
    model: model.id,
    modelName: model.name,
    promptPerM: model.promptPerM,
    completionPerM: model.completionPerM,
    creator: body.creator,
    txHash: body.txHash,
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
