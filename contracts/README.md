# $NEUMA Buyback & Burn engine

An on-chain engine that buys back **$NEUMA** with the treasury's funds on a
**Uniswap v4** pool and burns what it buys (sends to `0x…dEaD`). A keeper drives
it on a fixed cadence: **~$2 every 60 seconds, starting from round 1.**

- Token: `$NEUMA` — `0xa6f1a20408c8edb181a0e8faa54357c70b8f730a`
- Contract: `src/NeumaBuybackBurn.sol`
- Keeper: `keeper/buyback-keeper.mjs`

## How it works

```
treasury (ETH) ── keeper every 60s ──> buybackAndBurn($2 worth)
                                          │  swap on Uniswap v4
                                          ▼
                                     $NEUMA ──> 0x…dEaD  (burned)
```

The **contract** only does the swap + burn atomically and safely. The
**schedule** (once/min) and the **$2 sizing** are computed by the keeper and
passed in, with these on-chain guardrails:

- only an authorized keeper (or the owner) can start a round;
- a round can fire at most once per `interval` (default **60s**);
- `amountIn` is capped by `maxSpendPerRun` (a compromised keeper can't drain it);
- `minNeumaOut` gives slippage protection;
- the swap runs through the v4 `PoolManager.unlock` → `unlockCallback` flow, and
  the bought NEUMA is taken **directly to the burn address**.

Admin (owner) can `setKeeper`, `setParams`, `setPaused`, `transferOwnership`,
and `rescue` funds for migration.

## What you must fill in

The Robinhood-Chain Uniswap v4 addresses and the exact NEUMA pool key are NOT
hard-coded — set them at deploy time:

| Env | What | Where to get it |
|-----|------|-----------------|
| `POOL_MANAGER` | v4 PoolManager on Robinhood Chain | Uniswap v4 deployment on the chain |
| `NEUMA` | `0xa6f1a20408c8edb181a0e8faa54357c70b8f730a` | given |
| `FUNDING` | asset spent to buy back (`0x0` = native ETH) | your treasury asset |
| `POOL_FEE` | pool fee (e.g. `3000`) | the pool's graduation params |
| `POOL_TICK_SPACING` | pool tickSpacing (e.g. `60`) | the pool's graduation params |
| `POOL_HOOKS` | hooks address (`0x0` if none) | the pool's graduation params |
| `MAX_SPEND_PER_RUN` | per-round cap, funding wei | your call (keep small) |

> The NEUMA pool was created when the token graduated to Uniswap v4. The
> `fee`, `tickSpacing`, and `hooks` come from that pool's `PoolKey`; read them
> from the graduation transaction / the v4 `Initialize` event for this pair.

## Deploy (Foundry)

```bash
cd contracts
forge init --no-git --force .            # if not already a foundry project
forge install uniswap/v4-core foundry-rs/forge-std --no-git

export ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com/
export PRIVATE_KEY=0x...                 # deployer/owner (KEEP SECRET)
export POOL_MANAGER=0x...
export NEUMA=0xa6f1a20408c8edb181a0e8faa54357c70b8f730a
export FUNDING=0x0000000000000000000000000000000000000000   # native ETH
export POOL_FEE=3000
export POOL_TICK_SPACING=60
export POOL_HOOKS=0x0000000000000000000000000000000000000000
export MAX_SPEND_PER_RUN=5000000000000000                    # e.g. 0.005 ETH

forge build
forge script script/DeployBuybackBurn.s.sol --rpc-url $ROBINHOOD_RPC_URL --broadcast
```

Then, from the owner wallet:

```bash
# authorize the keeper wallet
cast send $ENGINE "setKeeper(address,bool)" $KEEPER_ADDR true --rpc-url $ROBINHOOD_RPC_URL --private-key $PRIVATE_KEY
# fund the engine (native ETH example)
cast send $ENGINE --value 0.1ether --rpc-url $ROBINHOOD_RPC_URL --private-key $PRIVATE_KEY
```

## Run the keeper (every 60s, $2/round)

```bash
export ENGINE_ADDRESS=0x...deployed...
export KEEPER_PRIVATE_KEY=0x...          # the address you authorized above
export USD_PER_RUN=2
node contracts/keeper/buyback-keeper.mjs
```

Run it under a process manager (pm2 / systemd / a small VM or a cron-driven
serverless function) so it keeps ticking. It's safe to over-tick: the contract
rejects a round that comes sooner than `interval`.

## ⚠️ Before you point real money at this

This contract moves **real funds on mainnet**. Treat it accordingly:

1. **Test on a testnet first** against a test v4 pool end to end.
2. **Get it audited.** I wrote it defensively, but it has not been audited, and
   the exact v4 interface/paths can differ by v4-core version — confirm
   `SwapParams`/`PoolManager` signatures against the version you install.
3. **Verify the pool key** (fee/tickSpacing/hooks) matches the live NEUMA pool,
   or swaps will revert or hit the wrong pool.
4. **Keep `maxSpendPerRun` small** and the keeper key low-value; the cap is your
   backstop if the key leaks.
5. **Buyback ≠ price go up.** $2/min is a steady, transparent sink; size it to
   what the treasury can sustain.
