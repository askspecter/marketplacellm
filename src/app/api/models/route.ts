import { NextResponse } from "next/server";
import { fetchModels } from "@/lib/openrouter";

export const runtime = "nodejs";
export const revalidate = 300;

/**
 * GET /api/models?q=claude&free=1&limit=60
 * The public OpenRouter catalog — the models an LLMPad launch can fund.
 * No API key required.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const freeOnly = searchParams.get("free") === "1";
  const limit = Math.min(Number(searchParams.get("limit")) || 500, 1000);

  try {
    let models = await fetchModels();
    if (freeOnly) models = models.filter((m) => m.free);
    if (q) {
      models = models.filter(
        (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)
      );
    }
    // Trim descriptions to keep the payload lean.
    const out = models.slice(0, limit).map((m) => ({
      ...m,
      description: m.description ? m.description.slice(0, 220) : undefined,
    }));
    return NextResponse.json({ count: out.length, total: models.length, models: out });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load models.";
    return NextResponse.json({ error: message, models: [] }, { status: 502 });
  }
}
