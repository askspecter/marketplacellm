import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, hasKey, streamChat } from "@/lib/openrouter";
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
  /** Stream Server-Sent Events instead of a single JSON response. */
  stream: z.boolean().optional(),
});

/**
 * POST /api/chat  { model, messages, token?, stream? }
 * Spend compute: route the conversation to any OpenRouter model. When a token
 * is supplied its pool's model is enforced and the USD cost is recorded against
 * that pool. Returns 503 (not 500) when no OPENROUTER_API_KEY is configured.
 * With stream:true, forwards OpenRouter's SSE straight to the browser and tees
 * off the final usage chunk to record spend.
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

  // ── Streaming path ──────────────────────────────────────────────────────
  if (parsed.stream) {
    let upstream: Response;
    try {
      upstream = await streamChat(model, parsed.messages);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json({ error: `OpenRouter ${upstream.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }

    const token = parsed.token;
    const decoder = new TextDecoder();
    let costUsd = 0;
    let buf = "";

    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk); // forward verbatim to the client
        buf += decoder.decode(chunk, { stream: true });
        // Scan complete SSE lines for a usage-bearing chunk.
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const json = JSON.parse(data) as { usage?: { cost?: number } };
            if (json.usage?.cost != null) costUsd = json.usage.cost;
          } catch {
            /* partial or non-JSON keepalive; ignore */
          }
        }
      },
      async flush() {
        if (token && costUsd > 0) await addSpend(token, costUsd).catch(() => {});
      },
    });

    return new Response(upstream.body.pipeThrough(transform), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // ── Non-streaming path ──────────────────────────────────────────────────
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
