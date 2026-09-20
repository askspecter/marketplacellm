/**
 * Agent tools — how an Agentpad agent perceives and acts on its world.
 *
 * These are OpenAI/OpenRouter-style function tools the agent's model can call
 * during a turn. They are executed SERVER-SIDE against the Pons v2 engine
 * (read-only chain reads) and the compute pool. The one "action" tool,
 * propose_trade, does NOT move funds — it returns a structured suggestion the
 * human signs via the trade widget. Custodial write-actions (the agent trading
 * from its own wallet) are the next, deliberately-gated step.
 */

import { zeroAddress, type Address } from "viem";
import { getCurveState, getLaunchedTokenV2, readTokenInfoV2 } from "@/lib/pons/readerV2";
import { getCredited, getLink, getSpend } from "@/lib/pool";
import { getEthUsd } from "@/lib/eth";

export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

const EMPTY_PARAMS = { type: "object", properties: {}, additionalProperties: false } as const;

export const AGENT_TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "get_market",
      description:
        "Read this agent's own token bonding-curve market: spot price (in ETH and USD), graduation progress %, ETH raised so far, and whether it is ready to graduate to Uniswap V4.",
      parameters: EMPTY_PARAMS,
    },
  },
  {
    type: "function",
    function: {
      name: "get_compute_pool",
      description:
        "Read this agent's compute pool: the model it runs on, and funded / spent / remaining compute in USD. This is the intelligence budget its trading fees have paid for.",
      parameters: EMPTY_PARAMS,
    },
  },
  {
    type: "function",
    function: {
      name: "get_token_info",
      description: "Read basic on-chain info about this agent's token: name, symbol, launch phase, and deployer address.",
      parameters: EMPTY_PARAMS,
    },
  },
  {
    type: "function",
    function: {
      name: "propose_trade",
      description:
        "Propose a buy or sell on this agent's own token for the human to review and sign. This does NOT execute a trade; it surfaces a suggestion in the UI.",
      parameters: {
        type: "object",
        properties: {
          side: { type: "string", enum: ["buy", "sell"], description: "buy the token with ETH, or sell the token for ETH" },
          amount: { type: "string", description: "amount in ETH for a buy, or in token units for a sell" },
          rationale: { type: "string", description: "one short sentence on why" },
        },
        required: ["side", "amount"],
        additionalProperties: false,
      },
    },
  },
];

export interface ToolContext {
  token: Address;
}

type Json = Record<string, unknown>;

/** Execute one tool call and return a compact JSON result for the model. */
export async function executeTool(name: string, args: Json, ctx: ToolContext): Promise<Json> {
  switch (name) {
    case "get_market":
      return getMarket(ctx.token);
    case "get_compute_pool":
      return getPool(ctx.token);
    case "get_token_info":
      return getInfo(ctx.token);
    case "propose_trade":
      return proposeTrade(args);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function resolveCurve(token: Address): Promise<Address | null> {
  try {
    const rec = await getLaunchedTokenV2(token);
    if (!rec.exists || !rec.curve || rec.curve === zeroAddress) return null;
    return rec.curve;
  } catch {
    return null;
  }
}

async function getMarket(token: Address): Promise<Json> {
  const curve = await resolveCurve(token);
  if (!curve) return { error: "Market not readable (not on an active curve, or chain unreachable)." };
  try {
    const [state, ethUsd] = await Promise.all([getCurveState(curve), getEthUsd()]);
    const raisedEth = Number(state.realQuoteReserve) / 1e18;
    return {
      spotPriceEth: state.spotPrice,
      spotPriceUsd: ethUsd ? state.spotPrice * ethUsd : null,
      graduationProgressPct: Math.round(state.progress * 100),
      raisedEth: Number(raisedEth.toFixed(6)),
      readyToGraduate: state.readyToGraduate,
      graduated: state.graduated,
    };
  } catch {
    return { error: "Failed to read curve state." };
  }
}

async function getPool(token: Address): Promise<Json> {
  const [link, credited, spent] = await Promise.all([getLink(token), getCredited(token), getSpend(token)]);
  return {
    model: link?.model ?? null,
    modelName: link?.modelName ?? null,
    fundedUsd: Number(credited.toFixed(4)),
    spentUsd: Number(spent.toFixed(4)),
    remainingUsd: Number(Math.max(0, credited - spent).toFixed(4)),
  };
}

async function getInfo(token: Address): Promise<Json> {
  try {
    const [rec, info] = await Promise.all([getLaunchedTokenV2(token), readTokenInfoV2(token)]);
    return { name: info.name, symbol: info.symbol, phase: rec.phase, deployer: rec.deployer };
  } catch {
    return { error: "Token info not readable (chain unreachable)." };
  }
}

function proposeTrade(args: Json): Json {
  const side = args.side === "sell" ? "sell" : "buy";
  const amount = typeof args.amount === "string" ? args.amount : String(args.amount ?? "");
  const rationale = typeof args.rationale === "string" ? args.rationale : "";
  return {
    proposed: true,
    side,
    amount,
    rationale,
    note: "Suggestion only - the human must sign this in the trade widget.",
  };
}
