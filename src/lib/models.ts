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
}

const DEFAULT: Provider = { key: "default", name: "Model", color: "#2a2a30", ink: "#f4f2ec", short: "AI" };

const TABLE: Record<string, Provider> = {
  anthropic: { key: "anthropic", name: "Anthropic", color: "#d97757", ink: "#1b0f08", short: "A", domain: "anthropic.com" },
  openai: { key: "openai", name: "OpenAI", color: "#0f9d76", ink: "#04140e", short: "O", domain: "openai.com" },
  google: { key: "google", name: "Google", color: "#2b6cf0", ink: "#04101f", short: "G", domain: "gemini.google.com" },
  "x-ai": { key: "xai", name: "xAI", color: "#101014", ink: "#f4f2ec", short: "x", domain: "x.ai" },
  xai: { key: "xai", name: "xAI", color: "#101014", ink: "#f4f2ec", short: "x", domain: "x.ai" },
  "meta-llama": { key: "meta", name: "Meta", color: "#0866ff", ink: "#031029", short: "M", domain: "meta.com" },
  meta: { key: "meta", name: "Meta", color: "#0866ff", ink: "#031029", short: "M", domain: "meta.com" },
  mistralai: { key: "mistral", name: "Mistral", color: "#fa5310", ink: "#1c0900", short: "M", domain: "mistral.ai" },
  mistral: { key: "mistral", name: "Mistral", color: "#fa5310", ink: "#1c0900", short: "M", domain: "mistral.ai" },
  deepseek: { key: "deepseek", name: "DeepSeek", color: "#4d6bfe", ink: "#050c26", short: "D", domain: "deepseek.com" },
  qwen: { key: "qwen", name: "Qwen", color: "#615ced", ink: "#0a0824", short: "Q", domain: "qwen.ai" },
  alibaba: { key: "qwen", name: "Qwen", color: "#615ced", ink: "#0a0824", short: "Q", domain: "qwen.ai" },
  cohere: { key: "cohere", name: "Cohere", color: "#39594d", ink: "#eafff5", short: "C", domain: "cohere.com" },
  perplexity: { key: "perplexity", name: "Perplexity", color: "#20808d", ink: "#02171a", short: "P", domain: "perplexity.ai" },
  microsoft: { key: "microsoft", name: "Microsoft", color: "#2b6cf0", ink: "#04101f", short: "φ", domain: "microsoft.com" },
  "nousresearch": { key: "nous", name: "Nous", color: "#7c5cff", ink: "#0b0620", short: "N", domain: "nousresearch.com" },
  "z-ai": { key: "zai", name: "Z.AI", color: "#3a7afe", ink: "#03102a", short: "Z", domain: "z.ai" },
  moonshotai: { key: "moonshot", name: "Moonshot", color: "#1f1f24", ink: "#f4f2ec", short: "K", domain: "moonshot.ai" },
  nvidia: { key: "nvidia", name: "NVIDIA", color: "#76b900", ink: "#0b1400", short: "N", domain: "nvidia.com" },
  amazon: { key: "amazon", name: "Amazon", color: "#ff9900", ink: "#1a1000", short: "A", domain: "aws.amazon.com" },
  ai21: { key: "ai21", name: "AI21", color: "#e23b3b", ink: "#1a0303", short: "AI", domain: "ai21.com" },
  "01-ai": { key: "yi", name: "01.AI", color: "#003425", ink: "#eafff5", short: "Yi", domain: "01.ai" },
  databricks: { key: "databricks", name: "Databricks", color: "#ff3621", ink: "#1a0300", short: "DB", domain: "databricks.com" },
  inflection: { key: "inflection", name: "Inflection", color: "#111", ink: "#fff", short: "IN", domain: "inflection.ai" },
  liquid: { key: "liquid", name: "Liquid", color: "#0b6", ink: "#021", short: "LQ", domain: "liquid.ai" },
  minimax: { key: "minimax", name: "MiniMax", color: "#e8471c", ink: "#1a0400", short: "MM", domain: "minimax.io" },
  baidu: { key: "baidu", name: "Baidu", color: "#2932e1", ink: "#fff", short: "B", domain: "baidu.com" },
  tencent: { key: "tencent", name: "Tencent", color: "#1471ff", ink: "#fff", short: "T", domain: "tencent.com" },
  stepfun: { key: "stepfun", name: "StepFun", color: "#2f6bff", ink: "#fff", short: "SF", domain: "stepfun.com" },
  reka: { key: "reka", name: "Reka", color: "#ff5a5f", ink: "#1a0304", short: "R", domain: "reka.ai" },
  inception: { key: "inception", name: "Inception", color: "#6d5cff", ink: "#fff", short: "IN", domain: "inceptionlabs.ai" },
  "amazon-bedrock": { key: "amazon", name: "Amazon", color: "#ff9900", ink: "#1a1000", short: "A", domain: "aws.amazon.com" },
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
  const prefix = (modelId.includes("/") ? modelId.split("/")[0] : modelId).toLowerCase();
  const known = TABLE[prefix];
  if (known) return known;
  // Unknown provider → a distinct, deterministic monogram (never a flat "AI").
  const letters = prefix.replace(/[^a-z0-9]/g, "").slice(0, 2).toUpperCase() || "AI";
  return { key: prefix, name: prettify(prefix), color: hashColor(prefix), ink: "#f7f7f5", short: letters };
}

/** A concise model label, e.g. "claude-3.5-sonnet" → "Claude 3.5 Sonnet"-ish tail. */
export function modelTail(modelId?: string): string {
  if (!modelId) return "";
  return modelId.includes("/") ? modelId.split("/").slice(1).join("/") : modelId;
}
