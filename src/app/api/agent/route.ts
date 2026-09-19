import { NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { z } from "zod";
import { chatWithTools, hasKey, type RawMessage } from "@/lib/openrouter";
import { AGENT_TOOLS, executeTool } from "@/lib/agent/tools";
import { addSpend, getLink } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TOTAL_CHARS = 24_000;
const MAX_STEPS = 4; // tool-call rounds before we force a final answer

const Body = z
  .object({
    token: z.string().refine(isAddress, "token must be an address"),
    messages: z
      .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(MAX_TOTAL_CHARS) }))
      .min(1)
      .max(30),
  })
  .refine((b) => b.messages.reduce((n, m) => n + m.content.length, 0) <= MAX_TOTAL_CHARS, {
    message: `Conversation exceeds the ${MAX_TOTAL_CHARS}-character input limit.`,
  });

export interface AgentStep {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

/**
 * POST /api/agent  { token, messages }
 * The agentic turn: the agent (its stored model + personality + temperature)
 * may call read-only tools to perceive its market and compute pool, then
 * answers. Returns the final reply plus the tool steps it took, and records the
 * USD cost against the agent's compute pool.
 */
export async function POST(req: Request) {
  if (!hasKey()) {
    return NextResponse.json(
      { error: "Compute is not funded yet: set OPENROUTER_API_KEY so the agent can think." },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = parsed.token as Address;
  const link = await getLink(token);
  if (!link) return NextResponse.json({ error: "No agent is registered for this token." }, { status: 404 });

  const system =
    (link.personality?.trim() ||
      `You are ${link.agentName ?? "an autonomous agent"} on Robinhood Chain. Your token $${
        link.ticker ?? ""
      } funds your compute.`) +
    "\n\nYou can call tools to check your own market and compute pool before answering. " +
    "Use get_market and get_compute_pool when the user asks about price, trading, or your budget. " +
    "Only call propose_trade if the user asks you to trade; it is a suggestion the human must sign.";

  const messages: RawMessage[] = [
    { role: "system", content: system },
    ...parsed.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const steps: AgentStep[] = [];
  let costUsd = 0;
  let finalText = "";

  try {
    for (let i = 0; i < MAX_STEPS; i++) {
      const turn = await chatWithTools(link.model, messages, AGENT_TOOLS, { temperature: link.temperature });
      costUsd += turn.costUsd;
      const msg = turn.message;
      messages.push(msg);

      const calls = msg.tool_calls ?? [];
      if (calls.length === 0) {
        finalText = msg.content ?? "";
        break;
      }

      // Execute each requested tool and feed the results back.
      for (const call of calls) {
        let args: Record<string, unknown> = {};
        try {
          args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          args = {};
        }
        const result = await executeTool(call.function.name, args, { token });
        steps.push({ tool: call.function.name, args, result });
        messages.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result) });
      }

      // On the last allowed round, ask once more with no tools for a final word.
      if (i === MAX_STEPS - 1) {
        const finalTurn = await chatWithTools(link.model, messages, [], { temperature: link.temperature });
        costUsd += finalTurn.costUsd;
        finalText = finalTurn.message.content ?? "";
      }
    }

    if (costUsd > 0) await addSpend(token, costUsd).catch(() => {});
    return NextResponse.json({ reply: finalText || "(no answer)", steps, costUsd });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent turn failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
