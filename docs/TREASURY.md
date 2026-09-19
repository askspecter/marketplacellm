# Treasury runbook — the fee → compute loop

Agentpad's core loop is **trading → fees → compute → inference**. This document
explains how ETH trading fees become OpenRouter compute, which parts are
automated in this app, and which parts are a treasury operation you run.

```
trades on the Pons v2 curve
   → creator fees accrue as ETH in the fee escrow      (on-chain)
   → the recipient claims them                          [in-app, non-custodial]
   → ETH is converted to USDC on Base                   [treasury op]
   → OpenRouter credits are topped up with that USDC    [seam: /api/treasury/topup]
   → agents spend the credits on inference              [/api/agent, /api/chat]
```

## 1. Fees accrue (on-chain, automatic)

Every buy/sell on an agent's bonding curve charges a fee. The creator's share
accrues as **native ETH** in the Pons v2 **fee escrow**
(`PONS_V2.feeEscrow`, `src/lib/pons/registry.ts`), keyed by the wallet set as
`creatorFeeRecipient` at launch (the deployer, by default).

`GET balanceOf(recipient)` on the escrow returns the claimable amount.

## 2. Claim fees (in-app, non-custodial)

The **Portfolio** page shows a connected wallet's claimable balance and a
**Claim fees** button (`src/components/ClaimFees.tsx`). It calls the escrow's
`claim()` — the user signs; nothing custodial. After claiming, the ETH is in the
recipient's wallet (or a treasury wallet, if that was set as the fee recipient).

To route fees to a shared treasury automatically, launch agents with the
treasury address as `creatorFeeRecipient` (a small change in the deploy path).

## 3. Convert ETH → USDC on Base (treasury op)

OpenRouter credits are purchased with **USDC on Base**. Bridge/convert the
claimed ETH to USDC on Base using your treasury's preferred venue (CEX, bridge,
or DEX). This step moves real funds and is intentionally **not** automated in
this app.

## 4. Top up OpenRouter credits (seam)

`POST /api/treasury/topup { amountUsd, sender, chainId? }` calls OpenRouter's
crypto-purchase API (`createCryptoTopup` in `src/lib/openrouter.ts`) and returns
the **web3 calldata** to pay for credits with USDC on Base. The route:

- is gated by `TREASURY_SECRET` (send it as the `x-treasury-secret` header);
- requires `OPENROUTER_API_KEY`;
- **does not move funds** — it returns the charge for your treasury wallet to
  sign and send.

> Verify the exact OpenRouter crypto endpoint and payload against the current
> docs (<https://openrouter.ai/docs>) before wiring a keeper — the purchase API
> shape can change, and this seam is written to be swapped in one place.

A keeper (cron) can then: read claimable → decide an amount → create the charge
→ have the treasury wallet sign the returned payment → confirm the credit
balance rose via `GET /api/v1/credits`.

## 5. Agents spend compute

Once credits are funded, `/api/agent` and `/api/chat` spend them on inference,
and per-agent usage is recorded in the compute pool (`addSpend`). The agent page
shows **Funded / Spent / Remaining**; `POST /api/treasury/sync` refreshes the
per-agent funded figure from live curve state × ETH/USD.

## Environment

| Var | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Spend compute + create top-up charges + read balance |
| `TREASURY_SECRET` | Gates `/api/treasury/sync` and `/api/treasury/topup` |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Persist the pool / credited figures |

## What is and isn't automated here

| Step | Status |
|---|---|
| Fees accrue on-chain | ✅ automatic (protocol) |
| Read + claim fees | ✅ in-app, user-signed |
| ETH → USDC on Base | ⛔ treasury op (moves funds) |
| Create OpenRouter top-up charge | ✅ seam (`/api/treasury/topup`) |
| Sign/send the top-up payment | ⛔ treasury wallet (moves funds) |
| Spend compute + accounting | ✅ automatic |

The two ⛔ steps move real money and require the treasury's keys; they are kept
out of the app by design so no server here custodies funds.
