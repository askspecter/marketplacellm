/**
 * OpenRouter — the "Any LLM" layer.
 *
 * Two surfaces:
 *  - Public model CATALOG (no key): the 400+ models LLMPad launches can fund,
 *    with live per-token pricing. Used by /api/models and the launch picker.
 *  - Authenticated CHAT + credit balance (needs OPENROUTER_API_KEY): spending
 *    the compute a token's trading fees paid for. Used by /api/chat + /api/pool.
 *
 * This is NEW to LLMPad (the "ETH fee → OpenRouter credit → talk to any model"
 * mechanic, in the spirit of llmtokens.fun). It is not copied from any upstream.
 */

const BASE = "https://openrouter.ai/api/v1";

export interface ORModel {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  /** USD per token (OpenRouter quotes per-token strings). */
  promptPrice: number;
  completionPrice: number;
  /** USD per 1M prompt / completion tokens, for display. */
  promptPerM: number;
  completionPerM: number;
  modalities: string[];
  provider: string;
  free: boolean;
}

interface ORModelRaw {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { input_modalities?: string[]; modality?: string };
  top_provider?: { max_completion_tokens?: number };
}

let cache: { at: number; models: ORModel[] } | null = null;
const TTL_MS = 5 * 60 * 1000;

function num(s?: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** Fetch and normalize the public model catalog (cached in-process for 5 min). */
export async function fetchModels(): Promise<ORModel[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.models;

  const res = await fetch(`${BASE}/models`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenRouter models ${res.status}`);
  const json = (await res.json()) as { data: ORModelRaw[] };

  const models = (json.data ?? []).map((m): ORModel => {
    const promptPrice = num(m.pricing?.prompt);
    const completionPrice = num(m.pricing?.completion);
    const provider = m.id.includes("/") ? m.id.split("/")[0] : "openrouter";
    const modalities = m.architecture?.input_modalities ?? (m.architecture?.modality ? [m.architecture.modality] : ["text"]);
    return {
      id: m.id,
      name: m.name || m.id,
      description: m.description,
      contextLength: m.context_length ?? 0,
      promptPrice,
      completionPrice,
      promptPerM: promptPrice * 1_000_000,
      completionPerM: completionPrice * 1_000_000,
      modalities,
      provider,
      free: promptPrice === 0 && completionPrice === 0,
    };
  });

  cache = { at: Date.now(), models };
  return models;
}

/** Look up one model by id from the catalog. */
export async function findModel(id: string): Promise<ORModel | null> {
  const all = await fetchModels();
  return all.find((m) => m.id === id) ?? null;
}

export function hasKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY?.trim();
}

function authHeaders(): Record<string, string> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const referer = process.env.OPENROUTER_APP_URL?.trim();
  const title = process.env.OPENROUTER_APP_TITLE?.trim() || "LLMPad";
  if (referer) headers["HTTP-Referer"] = referer;
  headers["X-Title"] = title;
  return headers;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  costUsd: number;
  model: string;
}

/** Spend compute: a single non-streaming chat completion via OpenRouter. */
export async function chat(model: string, messages: ChatMessage[]): Promise<ChatResult> {
  if (!hasKey()) throw new Error("NO_KEY");

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ model, messages, usage: { include: true } }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter chat ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
    model?: string;
  };

  const content = json.choices?.[0]?.message?.content ?? "";
  const u = json.usage ?? {};
  return {
    content,
    usage: {
      promptTokens: u.prompt_tokens ?? 0,
      completionTokens: u.completion_tokens ?? 0,
      totalTokens: u.total_tokens ?? 0,
    },
    costUsd: u.cost ?? 0,
    model: json.model ?? model,
  };
}

/** Live OpenRouter credit balance for the configured key (funded compute). */
export async function fetchCredits(): Promise<{ totalCredits: number; totalUsage: number; remaining: number } | null> {
  if (!hasKey()) return null;
  try {
    const res = await fetch(`${BASE}/credits`, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { total_credits?: number; total_usage?: number } };
    const totalCredits = json.data?.total_credits ?? 0;
    const totalUsage = json.data?.total_usage ?? 0;
    return { totalCredits, totalUsage, remaining: totalCredits - totalUsage };
  } catch {
    return null;
  }
}
