/**
 * Map an OpenRouter model id (e.g. "anthropic/claude-3.5-sonnet") to its
 * provider identity: a display name, a brand-ish tile color, and a short
 * monogram for an ORIGINAL badge.
 *
 * We deliberately do NOT ship the providers' trademarked logos. Instead the
 * <ModelLogo> component renders an original monogram tile, and will use an
 * official logo only if the operator drops one at `public/models/<key>.svg`
 * (their own licensed asset). This keeps brand identity legible without
 * reproducing protected logo artwork.
 */

export interface Provider {
  key: string;
  name: string;
  color: string; // monogram tile background
  ink: string; // monogram color
  short: string; // 1–2 char monogram
  domain?: string; // official domain — used to load the provider's real logo
  hf?: string; // HuggingFace org — avatar fallback for labs without a brand site
}

const DEFAULT: Provider = { key: "default", name: "Model", color: "#2a2a30", ink: "#f4f2ec", short: "AI" };

const TABLE: Record<string, Provider> = {
  anthropic: { key: "anthropic", name: "Anthropic", color: "#d97757", ink: "#1b0f08", short: "A", domain: "anthropic.com", hf: "anthropic" },
  openai: { key: "openai", name: "OpenAI", color: "#0f9d76", ink: "#04140e", short: "O", domain: "openai.com", hf: "openai" },
  google: { key: "google", name: "Google", color: "#2b6cf0", ink: "#04101f", short: "G", domain: "gemini.google.com", hf: "google" },
  "x-ai": { key: "xai", name: "xAI", color: "#101014", ink: "#f4f2ec", short: "x", domain: "x.ai" },
  xai: { key: "xai", name: "xAI", color: "#101014", ink: "#f4f2ec", short: "x", domain: "x.ai" },
  "meta-llama": { key: "meta", name: "Meta", color: "#0866ff", ink: "#031029", short: "M", domain: "meta.com", hf: "meta-llama" },
  meta: { key: "meta", name: "Meta", color: "#0866ff", ink: "#031029", short: "M", domain: "meta.com", hf: "meta-llama" },
  mistralai: { key: "mistral", name: "Mistral", color: "#fa5310", ink: "#1c0900", short: "M", domain: "mistral.ai", hf: "mistralai" },
  mistral: { key: "mistral", name: "Mistral", color: "#fa5310", ink: "#1c0900", short: "M", domain: "mistral.ai", hf: "mistralai" },
  deepseek: { key: "deepseek", name: "DeepSeek", color: "#4d6bfe", ink: "#050c26", short: "D", domain: "deepseek.com", hf: "deepseek-ai" },
  qwen: { key: "qwen", name: "Qwen", color: "#615ced", ink: "#0a0824", short: "Q", domain: "qwen.ai", hf: "Qwen" },
  alibaba: { key: "qwen", name: "Qwen", color: "#615ced", ink: "#0a0824", short: "Q", domain: "qwen.ai", hf: "Qwen" },
  cohere: { key: "cohere", name: "Cohere", color: "#39594d", ink: "#eafff5", short: "C", domain: "cohere.com", hf: "CohereLabs" },
  perplexity: { key: "perplexity", name: "Perplexity", color: "#20808d", ink: "#02171a", short: "P", domain: "perplexity.ai" },
  microsoft: { key: "microsoft", name: "Microsoft", color: "#2b6cf0", ink: "#04101f", short: "φ", domain: "microsoft.com", hf: "microsoft" },
  "nousresearch": { key: "nous", name: "Nous Research", color: "#7c5cff", ink: "#0b0620", short: "N", domain: "nousresearch.com", hf: "NousResearch" },
  "z-ai": { key: "zai", name: "Z.AI", color: "#3a7afe", ink: "#03102a", short: "Z", domain: "z.ai", hf: "zai-org" },
  moonshotai: { key: "moonshot", name: "Moonshot AI", color: "#1f1f24", ink: "#f4f2ec", short: "K", domain: "moonshot.ai", hf: "moonshotai" },
  nvidia: { key: "nvidia", name: "NVIDIA", color: "#76b900", ink: "#0b1400", short: "N", domain: "nvidia.com", hf: "nvidia" },
  amazon: { key: "amazon", name: "Amazon", color: "#ff9900", ink: "#1a1000", short: "A", domain: "aws.amazon.com" },
  ai21: { key: "ai21", name: "AI21", color: "#e23b3b", ink: "#1a0303", short: "AI", domain: "ai21.com" },
  "01-ai": { key: "yi", name: "01.AI", color: "#003425", ink: "#eafff5", short: "Yi", domain: "01.ai" },
  databricks: { key: "databricks", name: "Databricks", color: "#ff3621", ink: "#1a0300", short: "DB", domain: "databricks.com" },
  inflection: { key: "inflection", name: "Inflection", color: "#111", ink: "#fff", short: "IN", domain: "inflection.ai" },
  liquid: { key: "liquid", name: "Liquid AI", color: "#0b6", ink: "#021", short: "LQ", domain: "liquid.ai", hf: "LiquidAI" },
  minimax: { key: "minimax", name: "MiniMax", color: "#e8471c", ink: "#1a0400", short: "MM", domain: "minimax.io", hf: "MiniMaxAI" },
  baidu: { key: "baidu", name: "Baidu", color: "#2932e1", ink: "#fff", short: "B", domain: "baidu.com", hf: "baidu" },
  tencent: { key: "tencent", name: "Tencent", color: "#1471ff", ink: "#fff", short: "T", domain: "tencent.com", hf: "tencent" },
  stepfun: { key: "stepfun", name: "StepFun", color: "#2f6bff", ink: "#fff", short: "SF", domain: "stepfun.com", hf: "stepfun-ai" },
  reka: { key: "reka", name: "Reka", color: "#ff5a5f", ink: "#1a0304", short: "R", domain: "reka.ai", hf: "RekaAI" },
  rekaai: { key: "reka", name: "Reka", color: "#ff5a5f", ink: "#1a0304", short: "R", domain: "reka.ai", hf: "RekaAI" },
  inception: { key: "inception", name: "Inception", color: "#6d5cff", ink: "#fff", short: "IN", domain: "inceptionlabs.ai" },
  "amazon-bedrock": { key: "amazon", name: "Amazon", color: "#ff9900", ink: "#1a1000", short: "A", domain: "aws.amazon.com" },
  // ── extended coverage so every OpenRouter provider shows a real logo ──
  "aion-labs": { key: "aion", name: "AionLabs", color: "#3b5bdb", ink: "#fff", short: "AI", domain: "aionlabs.ai" },
  "anthracite-org": { key: "anthracite", name: "Anthracite", color: "#3a3a44", ink: "#fff", short: "AN", hf: "anthracite-org" },
  "arcee-ai": { key: "arcee", name: "Arcee AI", color: "#5b3df5", ink: "#fff", short: "AR", domain: "arcee.ai", hf: "arcee-ai" },
  bytedance: { key: "bytedance", name: "ByteDance", color: "#325ab4", ink: "#fff", short: "BD", domain: "bytedance.com", hf: "ByteDance-Seed" },
  "bytedance-seed": { key: "bytedance", name: "ByteDance Seed", color: "#325ab4", ink: "#fff", short: "BD", domain: "bytedance.com", hf: "ByteDance-Seed" },
  cognitivecomputations: { key: "cognitive", name: "Cognitive Computations", color: "#2f7d4f", ink: "#fff", short: "CC", hf: "cognitivecomputations" },
  "dots-studio": { key: "dots", name: "Dots", color: "#e23b6d", ink: "#fff", short: "DS", hf: "dots-studio" },
  "ibm-granite": { key: "ibm", name: "IBM Granite", color: "#0f62fe", ink: "#fff", short: "IB", domain: "ibm.com", hf: "ibm-granite" },
  inclusionai: { key: "inclusion", name: "InclusionAI", color: "#1f6feb", ink: "#fff", short: "IA", hf: "inclusionAI" },
  "inference-net": { key: "inference", name: "Inference.net", color: "#111", ink: "#fff", short: "IN", domain: "inference.net", hf: "inference-net" },
  kwaipilot: { key: "kwai", name: "Kwaipilot", color: "#ff7a00", ink: "#1a0d00", short: "KW", hf: "Kwaipilot" },
  mancer: { key: "mancer", name: "Mancer", color: "#7a3cff", ink: "#fff", short: "MA", domain: "mancer.tech" },
  meituan: { key: "meituan", name: "Meituan", color: "#ffce00", ink: "#1a1600", short: "MT", domain: "meituan.com", hf: "meituan-longcat" },
  morph: { key: "morph", name: "Morph", color: "#111", ink: "#fff", short: "MO", domain: "morphllm.com" },
  "nex-agi": { key: "nex", name: "Nex AGI", color: "#b3352f", ink: "#fff", short: "NE", hf: "nex-agi" },
  openrouter: { key: "openrouter", name: "OpenRouter", color: "#5b6572", ink: "#fff", short: "OR", domain: "openrouter.ai" },
  perceptron: { key: "perceptron", name: "Perceptron", color: "#4b3ef5", ink: "#fff", short: "PE", domain: "perceptron.inc" },
  poolside: { key: "poolside", name: "Poolside", color: "#111", ink: "#fff", short: "PS", domain: "poolside.ai", hf: "poolside" },
  "prism-ml": { key: "prism", name: "PrismML", color: "#0f8f8f", ink: "#fff", short: "PR", hf: "prism-ml" },
  relace: { key: "relace", name: "Relace", color: "#2f6bff", ink: "#fff", short: "RE", domain: "relace.ai" },
  sakana: { key: "sakana", name: "Sakana AI", color: "#e2483b", ink: "#fff", short: "SK", domain: "sakana.ai" },
  sao10k: { key: "sao10k", name: "Sao10K", color: "#6d3df5", ink: "#fff", short: "SA", hf: "Sao10K" },
  thedrummer: { key: "thedrummer", name: "TheDrummer", color: "#c2410c", ink: "#fff", short: "TD", hf: "thedrummer" },
  thinkingmachines: { key: "thinking", name: "Thinking Machines", color: "#111", ink: "#fff", short: "TM", domain: "thinkingmachines.ai", hf: "thinkingmachines" },
  unbiased: { key: "unbiased", name: "Unbiased", color: "#7a5cff", ink: "#fff", short: "UB", hf: "unbiased" },
  undi95: { key: "undi95", name: "Undi95", color: "#c026d3", ink: "#fff", short: "UN", hf: "Undi95" },
  upstage: { key: "upstage", name: "Upstage", color: "#8b5cf6", ink: "#fff", short: "UP", domain: "upstage.ai" },
  writer: { key: "writer", name: "Writer", color: "#111", ink: "#fff", short: "WR", domain: "writer.com" },
  xiaomi: { key: "xiaomi", name: "Xiaomi", color: "#ff6900", ink: "#1a0c00", short: "MI", domain: "xiaomi.com", hf: "XiaomiMiMo" },
  gryphe: { key: "gryphe", name: "Gryphe", color: "#3f9d6b", ink: "#fff", short: "GR", hf: "Gryphe" },
};

// Deterministic pleasant color from a string (for unknown providers).
function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h}, 52%, 42%)`;
}
function prettify(s: string): string {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function providerFromId(modelId?: string): Provider {
  if (!modelId) return DEFAULT;
  let prefix = (modelId.includes("/") ? modelId.split("/")[0] : modelId).toLowerCase();
  // OpenRouter tags shadow / preset variants with a leading "~" (e.g.
  // "~openai/..."). Strip it so they resolve to the real provider's logo.
  if (prefix.startsWith("~")) prefix = prefix.slice(1);
  const known = TABLE[prefix];
  if (known) return known;
  // Unknown provider → most OpenRouter provider slugs match their HuggingFace
  // org, so use that for a real avatar; a deterministic monogram is the final
  // fallback if even that 404s.
  const letters = prefix.replace(/[^a-z0-9]/g, "").slice(0, 2).toUpperCase() || "AI";
  return { key: prefix, name: prettify(prefix), color: hashColor(prefix), ink: "#f7f7f5", short: letters, hf: prefix };
}

/**
 * A curated set of real, popular OpenRouter models. Tokens launched without an
 * explicit brain still "fund a model" in the product's framing, so the feed
 * assigns one deterministically from the token address for a stable display.
 */
const FALLBACK_MODELS: { id: string; name: string }[] = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
  { id: "x-ai/grok-2-1212", name: "Grok 2" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3" },
  { id: "mistralai/mistral-large", name: "Mistral Large" },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B" },
];

/** Deterministic model pick from a seed (e.g. a token address). */
export function fallbackModel(seed: string): { id: string; name: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_MODELS[h % FALLBACK_MODELS.length];
}

/** A concise model label, e.g. "claude-3.5-sonnet" → "Claude 3.5 Sonnet"-ish tail. */
export function modelTail(modelId?: string): string {
  if (!modelId) return "";
  return modelId.includes("/") ? modelId.split("/").slice(1).join("/") : modelId;
}
