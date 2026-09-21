// Buyback keeper: every 60 seconds, buy back ~$2 of $NEUMA and burn it.
//
// It sizes $2 into funding-asset wei using an ETH/USD price (env or overridable),
// computes a slippage-protected minOut by quoting the pool, and calls
// buybackAndBurn on the engine. The on-chain contract enforces the 60s cadence,
// the per-round cap, and the minOut, so this script only *schedules* rounds.
//
// Run: node contracts/keeper/buyback-keeper.mjs
//
// Required env:
//   ROBINHOOD_RPC_URL     RPC endpoint
//   KEEPER_PRIVATE_KEY    key authorized via engine.setKeeper(keeper, true)
//   ENGINE_ADDRESS        deployed NeumaBuybackBurn
// Optional env:
//   USD_PER_RUN=2         dollars to spend per round (default 2)
//   ETH_USD               ETH price in USD (if unset, tries a price source)
//   INTERVAL_MS=60000     keeper tick (contract still enforces 60s)
//   SLIPPAGE_BPS=300      max slippage in basis points (3%)

import { ethers } from "ethers";

const RPC = requireEnv("ROBINHOOD_RPC_URL");
const PK = requireEnv("KEEPER_PRIVATE_KEY");
const ENGINE = requireEnv("ENGINE_ADDRESS");
const USD_PER_RUN = Number(process.env.USD_PER_RUN ?? "2");
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? "60000");
const SLIPPAGE_BPS = BigInt(process.env.SLIPPAGE_BPS ?? "300");

const ENGINE_ABI = [
  "function buybackAndBurn(uint256 amountIn, uint256 minNeumaOut) returns (uint256)",
  "function interval() view returns (uint32)",
  "function lastRun() view returns (uint256)",
  "function maxSpendPerRun() view returns (uint256)",
  "function paused() view returns (bool)",
  "function treasuryBalance() view returns (uint256)",
  "function round() view returns (uint256)",
  "function totalBurned() view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PK, provider);
const engine = new ethers.Contract(ENGINE, ENGINE_ABI, wallet);

function requireEnv(k) {
  const v = process.env[k];
  if (!v) throw new Error(`missing env ${k}`);
  return v;
}

async function ethUsd() {
  if (process.env.ETH_USD) return Number(process.env.ETH_USD);
  // Fallback price source; replace with your own oracle/feed if you prefer.
  const r = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot");
  const j = await r.json();
  return Number(j?.data?.amount);
}

// $USD -> wei of native ETH funding. If your funding asset is a stablecoin,
// swap this for `parseUnits(USD_PER_RUN, stableDecimals)` and drop the price call.
async function usdToAmountIn() {
  const price = await ethUsd();
  if (!Number.isFinite(price) || price <= 0) throw new Error("bad ETH/USD price");
  const eth = USD_PER_RUN / price;
  return ethers.parseEther(eth.toFixed(18));
}

async function tick() {
  try {
    if (await engine.paused()) return log("paused, skipping");

    const [interval, lastRun, maxSpend] = await Promise.all([
      engine.interval(),
      engine.lastRun(),
      engine.maxSpendPerRun(),
    ]);
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now < lastRun + BigInt(interval)) return log(`too soon (${lastRun + BigInt(interval) - now}s left)`);

    let amountIn = await usdToAmountIn();
    if (amountIn > maxSpend) amountIn = maxSpend; // respect the on-chain cap

    const treasury = await engine.treasuryBalance();
    if (treasury < amountIn) return log(`treasury too low: has ${ethers.formatEther(treasury)}, needs ${ethers.formatEther(amountIn)}`);

    // Quote expected out via a static call, then apply slippage for minOut.
    // (Runs the real swap in a simulated context; reverts here => reverts on-chain.)
    const expectedOut = await engine.buybackAndBurn.staticCall(amountIn, 0n);
    const minOut = (expectedOut * (10_000n - SLIPPAGE_BPS)) / 10_000n;

    const tx = await engine.buybackAndBurn(amountIn, minOut);
    log(`round tx ${tx.hash} — spending ${ethers.formatEther(amountIn)} ETH, minOut ${minOut}`);
    const rec = await tx.wait();
    const [round, burned] = await Promise.all([engine.round(), engine.totalBurned()]);
    log(`✔ round ${round} mined in block ${rec.blockNumber} — total burned ${burned}`);
  } catch (e) {
    log(`error: ${e?.shortMessage || e?.message || e}`);
  }
}

function log(m) {
  console.log(`[${new Date().toISOString()}] ${m}`);
}

log(`keeper started — engine ${ENGINE}, $${USD_PER_RUN}/round, tick ${INTERVAL_MS}ms`);
await tick();
setInterval(tick, INTERVAL_MS);
