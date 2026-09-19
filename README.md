# Agentpad — launch autonomous AI agents 🧠⚡

An **agent-native launchpad** on Robinhood Chain. Every agent launches — in one
transaction — with its own **token, personality, and model**. Trading generates
fees; the fees fund a shared **compute pool**; the pool pays for the agent's
**inference**. An ongoing source of intelligence, funded by the markets around
it. In the spirit of [llmtokens.fun/agents](https://llmtokens.fun) (LLMOS),
built on the **Pons v2** launch engine + **OpenRouter**.

> Third-party interface to the Pons protocol on Robinhood Chain. Not affiliated
> with Pons or OpenRouter. Non-custodial — your wallet signs every transaction.
> Not financial advice.

## How it works

```
Define the agent  — name, personality (system prompt), behavior (temperature)
      → Choose a brain — any OpenRouter model (Claude, GPT, Llama, DeepSeek…)
      → Launch — one Pons v2 tx deploys the token, paired with ETH
      → Trades → fees → shared compute pool → inference
      → The agent acts — chat with it now (its personality is authoritative);
        it gains tools & autonomy over time
      → Curve fills → graduates to a locked Uniswap V4 pool

trading → fees → compute → inference → agents
```

## Engine vs. new code

This project **reuses the Pons v2 launch engine** and wraps it in a brand-new UI
plus a new OpenRouter compute layer. The engine files are copied unchanged.

| Path | Origin | Contents |
|---|---|---|
| `src/lib/chain.ts`, `src/lib/pons/*`, `src/lib/kv.ts` | **engine (reused)** | Robinhood Chain, Pons v1/v2 adapters, verified ABIs, on-chain readers, bonding-curve math |
| `src/app/api/v2/*` | **engine (reused)** | Live v2 launch-options, token state, and chart endpoints |
| `src/lib/openrouter.ts` | **new** | OpenRouter “Any LLM” layer — public model catalog + authenticated chat (streaming) + credits |
| `src/lib/pool.ts`, `src/lib/eth.ts` | **new** | Compute-pool accounting: token→model link, spend + credited tracking, ETH/USD |
| `src/app/api/{models,chat,pool,launches,portfolio,treasury/sync}` | **new** | Catalog, spend-compute (SSE), pool registry, feed, portfolio, treasury keeper |
| `src/app/*`, `src/components/*` | **new** | Landing, launch studio, token page (live), compute playground, portfolio, wallet |

## Features

- **Agent studio** — define name, ticker, bio, **personality (system prompt)**,
  a **brain** (any OpenRouter model), and **behavior** (temperature); deploy the
  ETH-paired Pons v2 token in one signed tx. The agent profile is registered
  automatically and is first-write-wins (it can't be re-pointed later).
- **Agent page (live)** — identity + brain + personality, bonding-curve price
  chart, graduation progress, a buy/sell trade widget (curve math from the
  engine), the compute pool’s **Funded / Spent / Remaining**, and a **chat with
  the agent** whose system prompt + temperature are enforced server-side.
- **Compute** — streaming chat against any model (free playground); on an agent
  page it spends that agent’s pool and records the cost.
- **Portfolio** — your agents (with brain + compute spent) and on-chain holdings.
- **Treasury keeper** — `POST /api/treasury/sync` derives funded compute from
  live curve state × ETH/USD and records it per agent (the OpenRouter top-up
  seam; gate it with `TREASURY_SECRET`).

No UI or AI code from the reference launchpad was copied — only the on-chain
engine.

## Running

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

- **No key needed** to browse the model catalog and the launch flow.
- Set `OPENROUTER_API_KEY` to actually **spend compute** (the chat/playground);
  without it, `/api/chat` returns a clear 503 and the UI shows a “fund compute”
  state.
- Set `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Vercel KV / Upstash) to persist
  the token→model pool across restarts; otherwise it’s kept in memory.

## Notes / caveats

- **Pons v2 launches are whitelist-gated on-chain.** A non-allowlisted wallet’s
  `launchToken()` reverts (only gas spent). The deploy flow surfaces this up
  front via `canLaunch()`.
- Live model catalog and on-chain reads need outbound network access to
  `openrouter.ai` and the Robinhood Chain RPC. Where egress is restricted, the
  app degrades gracefully (clean empty states, no crashes).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · wagmi + viem + RainbowKit ·
zod · OpenRouter.
