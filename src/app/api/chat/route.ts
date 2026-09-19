import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, hasKey } from "@/lib/openrouter";
import { addSpend, getLink } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  model: z.string().min(1),
  messages: z
    .array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() }))
    .min(1)
    .max(40),
  /** Optional: the launch token whose compute pool this spend belongs to. */
  token: z.string().optional(),
});

/**
 * POST /api/chat  { model, messages, token? }
 * Spend compute: route the conversation to any OpenRouter model. When a token
 * is supplied its pool's model is enforced and the USD cost is recorded against
 * that pool. Returns 503 (not 500) when no OPENROUTER_API_KEY is configured, so
 * the UI can show a clear "add a key to spend compute" state.
 */
export async function POST(req: Request) {
  if (!hasKey()) {
    return NextResponse.json(
      { error: "Compute is not funded yet: set OPENROUTER_API_KEY to spend against OpenRouter." },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // If tied to a launch, the token's paired model wins (you fund THAT model).
  let model = parsed.model;
  if (parsed.token) {
    const link = await getLink(parsed.token);
    if (link) model = link.model;
  }

  try {
    const result = await chat(model, parsed.messages);
    if (parsed.token && result.costUsd > 0) {
      await addSpend(parsed.token, result.costUsd).catch(() => {});
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
