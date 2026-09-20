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
  color: string; // tile background
  ink: string; // monogram color
  short: string; // 1–2 char monogram
}

const DEFAULT: Provider = { key: "default", name: "Model", color: "#2a2a30", ink: "#f4f2ec", short: "AI" };

const TABLE: Record<string, Provider> = {
  anthropic: { key: "anthropic", name: "Anthropic", color: "#d97757", ink: "#1b0f08", short: "A" },
  openai: { key: "openai", name: "OpenAI", color: "#0f9d76", ink: "#04140e", short: "O" },
  google: { key: "google", name: "Google", color: "#2b6cf0", ink: "#04101f", short: "G" },
  "x-ai": { key: "xai", name: "xAI", color: "#101014", ink: "#f4f2ec", short: "x" },
  xai: { key: "xai", name: "xAI", color: "#101014", ink: "#f4f2ec", short: "x" },
  "meta-llama": { key: "meta", name: "Meta", color: "#0866ff", ink: "#031029", short: "M" },
  meta: { key: "meta", name: "Meta", color: "#0866ff", ink: "#031029", short: "M" },
  mistralai: { key: "mistral", name: "Mistral", color: "#fa5310", ink: "#1c0900", short: "M" },
  mistral: { key: "mistral", name: "Mistral", color: "#fa5310", ink: "#1c0900", short: "M" },
  deepseek: { key: "deepseek", name: "DeepSeek", color: "#4d6bfe", ink: "#050c26", short: "D" },
  qwen: { key: "qwen", name: "Qwen", color: "#615ced", ink: "#0a0824", short: "Q" },
  alibaba: { key: "qwen", name: "Qwen", color: "#615ced", ink: "#0a0824", short: "Q" },
  cohere: { key: "cohere", name: "Cohere", color: "#39594d", ink: "#eafff5", short: "C" },
  perplexity: { key: "perplexity", name: "Perplexity", color: "#20808d", ink: "#02171a", short: "P" },
  microsoft: { key: "microsoft", name: "Microsoft", color: "#2b6cf0", ink: "#04101f", short: "φ" },
  "nousresearch": { key: "nous", name: "Nous", color: "#7c5cff", ink: "#0b0620", short: "N" },
  "z-ai": { key: "zai", name: "Z.AI", color: "#3a7afe", ink: "#03102a", short: "Z" },
  moonshotai: { key: "moonshot", name: "Moonshot", color: "#1f1f24", ink: "#f4f2ec", short: "K" },
};

export function providerFromId(modelId?: string): Provider {
  if (!modelId) return DEFAULT;
  const prefix = modelId.includes("/") ? modelId.split("/")[0] : modelId;
  return TABLE[prefix.toLowerCase()] ?? { ...DEFAULT, name: prefix, short: prefix.slice(0, 2).toUpperCase() };
}

/** A concise model label, e.g. "claude-3.5-sonnet" → "Claude 3.5 Sonnet"-ish tail. */
export function modelTail(modelId?: string): string {
  if (!modelId) return "";
  return modelId.includes("/") ? modelId.split("/").slice(1).join("/") : modelId;
}
