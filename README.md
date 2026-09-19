# LLMPad — every token funds a model 🧠⚡

Launch an **ETH-paired token** on the **Pons v2** fair-launch bonding curve. Every
trade pays a fee, and that fee becomes **OpenRouter compute** — anyone who
launched can spend it talking to any of 400+ models. Inspired by the
[llmtokens.fun](https://llmtokens.fun) mechanic (*“every token funds a model”*),
built on the Pons v2 launch engine.

> Third-party interface to the Pons protocol on Robinhood Chain. Not affiliated
> with Pons or OpenRouter. Non-custodial — your wallet signs every transaction.
> Not financial advice.

## How it works

```
Pick an OpenRouter model
      → Launch a token, paired with ETH  (Pons v2 launchToken → bonding curve)
      → Trades accrue fees in ETH on the curve
      → ETH fees ≈ OpenRouter credits for that model
      → Launchers spend the compute: chat with the model the token funds
      → Curve fills → graduates to a locked Uniswap V4 pool
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

- **Launch studio** — pick any OpenRouter model, deploy an ETH-paired Pons v2
  token in one signed tx; the token→model link is registered automatically.
- **Token page (live)** — bonding-curve price chart, graduation progress, a
  buy/sell trade widget (curve math from the engine), and the compute pool’s
  **Funded / Spent / Remaining**, all refreshing on an interval.
- **Compute** — streaming chat against any model; on a token page it spends
  that token’s pool and records the cost.
- **Portfolio** — your launches (with model + compute spent) and on-chain
  holdings across known tokens.
- **Treasury keeper** — `POST /api/treasury/sync` derives funded compute from
  live curve state × ETH/USD and records it per token (the OpenRouter top-up
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
