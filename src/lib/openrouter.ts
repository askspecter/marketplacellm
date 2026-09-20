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

/**
 * Inference backend. Defaults to OpenRouter, but can be pointed at any
 * OpenAI-compatible gateway — notably Orbio (https://api.orbio.so/api/v1),
 * whose CREDIT token (1 CREDIT = $1 of AI usage) lives on Robinhood Chain, so a
 * creator's claimed ETH fees can be swapped into CREDIT and spent here. Set
 * INFERENCE_BASE_URL + INFERENCE_API_KEY to switch. The model CATALOG follows
 * the same gateway (see catalogBase), while the credit/top-up endpoints stay on
 * OpenRouter (they're OR-specific).
 */
function inferenceBase(): string {
  return process.env.INFERENCE_BASE_URL?.trim() || BASE;
}
function inferenceKey(): string | undefined {
  return process.env.INFERENCE_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim();
}

/**
 * Where the model CATALOG is read from. When an inference gateway is configured
 * (e.g. Orbio via INFERENCE_BASE_URL) the catalog follows it, so the model ids
 * shown in the picker match the backend that will actually run — and be billed
 * for — inference. With nothing configured it stays the public OpenRouter
 * catalog. Set MODELS_BASE_URL to override the catalog source independently.
 */
function catalogBase(): string {
  return process.env.MODELS_BASE_URL?.trim() || process.env.INFERENCE_BASE_URL?.trim() || BASE;
}
/** True when the catalog is served by something other than public OpenRouter. */
function catalogIsExternal(): boolean {
  return catalogBase() !== BASE;
}

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
  /** Whether the catalog reported pricing for this model. Orbio's OpenAI-style
   * catalog may omit pricing, in which case `free` is not meaningful. */
  priceKnown: boolean;
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

  const base = catalogBase();
  const external = catalogIsExternal();
  const headers: Record<string, string> = { Accept: "application/json" };
  // Public OpenRouter /models needs no key; an OpenAI-compatible gateway (Orbio)
  // typically requires auth on /models, so send the key when the source is external.
  const key = inferenceKey();
  if (external && key) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(`${base}/models`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Model catalog ${res.status}`);
  const json = (await res.json()) as { data?: ORModelRaw[] };

  const models = (json.data ?? []).map((m): ORModel => {
    const priceKnown = m.pricing != null && (m.pricing.prompt != null || m.pricing.completion != null);
    const promptPrice = num(m.pricing?.prompt);
    const completionPrice = num(m.pricing?.completion);
    const provider = m.id.includes("/") ? m.id.split("/")[0] : external ? "orbio" : "openrouter";
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
      priceKnown,
      // "Free" only means something when pricing is actually reported as zero.
      free: priceKnown && promptPrice === 0 && completionPrice === 0,
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
  return !!inferenceKey();
}

function authHeaders(): Record<string, string> {
  const key = inferenceKey();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const referer = process.env.OPENROUTER_APP_URL?.trim();
  const title = process.env.OPENROUTER_APP_TITLE?.trim() || "Neuma";
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

export interface ChatOptions {
  /** Sampling temperature (0–2). Undefined uses the provider default. */
  temperature?: number;
}

/** Spend compute: a single non-streaming chat completion via OpenRouter. */
export async function chat(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult> {
  if (!hasKey()) throw new Error("NO_KEY");

  const res = await fetch(`${inferenceBase()}/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ model, messages, temperature: opts?.temperature, usage: { include: true } }),
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

/**
 * Streaming chat: returns the upstream OpenRouter SSE Response so a route can
 * pipe it straight to the browser. With `usage.include`, OpenRouter emits a
 * final chunk carrying token usage + cost, which the route tees off to record
 * spend against the token's compute pool.
 */
export async function streamChat(model: string, messages: ChatMessage[], opts?: ChatOptions): Promise<Response> {
  if (!hasKey()) throw new Error("NO_KEY");
  return fetch(`${inferenceBase()}/chat/completions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ model, messages, temperature: opts?.temperature, stream: true, usage: { include: true } }),
    cache: "no-store",
  });
}

// ── Tool calling (agentic loop) ─────────────────────────────────────────────

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface RawMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolTurn {
  message: RawMessage;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  costUsd: number;
  /** False when tools were requested but the gateway rejected them and we
   * retried without them (so the agent answered as a plain chat). */
  toolsSupported: boolean;
}

/**
 * Heuristic: does this upstream error look like the gateway not supporting the
 * OpenAI `tools` / `tool_choice` fields (rather than a real request error)?
 * Some OpenAI-compatible backends (incl. some Orbio models) return 400/404/422
 * for tool calling.
 */
function looksLikeToolsUnsupported(status: number, body: string): boolean {
  if (![400, 404, 405, 422, 501].includes(status)) return false;
  const t = body.toLowerCase();
  return (
    t.includes("tool") ||
    t.includes("function call") ||
    t.includes("tool_choice") ||
    t.includes("not supported") ||
    t.includes("unsupported") ||
    t.includes("does not support")
  );
}

/**
 * One model turn that may request tool calls. The caller runs the loop:
 * execute any tool_calls, append the results as role:"tool" messages, and call
 * again until the model returns a message with no tool_calls.
 */
export async function chatWithTools(
  model: string,
  messages: RawMessage[],
  tools: unknown[],
  opts?: ChatOptions
): Promise<ToolTurn> {
  if (!hasKey()) throw new Error("NO_KEY");

  const send = (withTools: boolean) =>
    fetch(`${inferenceBase()}/chat/completions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        model,
        messages,
        ...(withTools ? { tools, tool_choice: "auto" } : {}),
        temperature: opts?.temperature,
        usage: { include: true },
      }),
      cache: "no-store",
    });

  let toolsSupported = tools.length > 0;
  let res = await send(toolsSupported);

  // If the gateway rejected the tools payload, retry once as a plain chat so the
  // agent still answers instead of erroring out.
  if (!res.ok && toolsSupported) {
    const body = await res.text().catch(() => "");
    if (looksLikeToolsUnsupported(res.status, body)) {
      toolsSupported = false;
      res = await send(false);
    } else {
      throw new Error(`Inference ${res.status}: ${body.slice(0, 300)}`);
    }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Inference ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: RawMessage }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
  };
  const message = json.choices?.[0]?.message ?? { role: "assistant", content: "" };
  const u = json.usage ?? {};
  return {
    message,
    usage: {
      promptTokens: u.prompt_tokens ?? 0,
      completionTokens: u.completion_tokens ?? 0,
      totalTokens: u.total_tokens ?? 0,
    },
    costUsd: u.cost ?? 0,
    toolsSupported,
  };
}

/**
 * Create a crypto top-up charge for OpenRouter credits (the fee → compute
 * on-ramp). OpenRouter's crypto purchase API returns web3 calldata for paying
 * with USDC on Base via Coinbase's onchain commerce contract; the treasury
 * signs and sends that payment to actually add credits. This function only
 * CREATES the charge — it never moves funds.
 *
 * NOTE: Verify the exact endpoint/shape against current OpenRouter docs before
 * relying on it (https://openrouter.ai/docs). It is gated server-side by
 * TREASURY_SECRET and requires OPENROUTER_API_KEY.
 */
export async function createCryptoTopup(
  amountUsd: number,
  sender: string,
  chainId = 8453
): Promise<{ ok: boolean; status: number; data: unknown }> {
  if (!hasKey()) throw new Error("NO_KEY");
  const res = await fetch(`${BASE}/credits/coinbase`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ amount: amountUsd, sender, chain_id: chainId }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
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
