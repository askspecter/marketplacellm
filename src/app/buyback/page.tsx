"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { formatUnits, type Abi } from "viem";
import { ConnectWallet } from "@/components/ConnectWallet";
import { v2CurveAbi } from "@/lib/pons/abisV2";
import { type CurveQuoteInputs } from "@/lib/pons/quote";
import { robinhoodChain, explorerTx } from "@/lib/chain";
import { BURN_ADDRESS, BUYBACK_TOKEN, BUYBACK_USD, planBuyback } from "@/lib/buyback";
import { compact, usdPrice } from "@/lib/format";

const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

interface TokenData {
  symbol: string; decimals: number; ethUsd?: number | null; curveAddress: string; pairToken: string; phase: number; phaseLabel: string;
  curve: { quoteReserve: string; tokenReserve: string; sellableTokens: string; graduated: boolean; feeBps: string; creatorTaxBps: string; spotPrice: number } | null;
}

export default function BuybackPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [data, setData] = useState<TokenData | null>(null);
  const [usdAmount, setUsdAmount] = useState(String(BUYBACK_USD));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string; href?: string } | null>(null);

  const load = () =>
    fetch(`/api/v2/token?address=${BUYBACK_TOKEN}`).then((r) => r.json()).then(setData).catch(() => {});
  useEffect(() => { load(); const id = setInterval(load, 15_000); return () => clearInterval(id); }, []);

  const { data: burnedRaw, refetch: refetchBurned } = useReadContract({
    address: BUYBACK_TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [BURN_ADDRESS],
    query: { refetchInterval: 15_000 },
  });
  const burned = burnedRaw != null ? Number(formatUnits(burnedRaw as bigint, data?.decimals ?? 18)) : null;

  const isNative = !data?.pairToken || data.pairToken === "0x0000000000000000000000000000000000000000";
  const graduated = data?.curve?.graduated || (data ? data.phase !== 0 : false);

  const plan = useMemo(() => {
    if (!data?.curve || !data.ethUsd) return null;
    const inputs: CurveQuoteInputs = {
      quoteReserve: BigInt(data.curve.quoteReserve), tokenReserve: BigInt(data.curve.tokenReserve),
      sellableTokens: BigInt(data.curve.sellableTokens), feeBps: BigInt(data.curve.feeBps), creatorTaxBps: BigInt(data.curve.creatorTaxBps),
    };
    try { return planBuyback(Number(usdAmount), data.ethUsd, inputs); } catch { return null; }
  }, [data, usdAmount]);

  async function buybackAndBurn() {
    if (!address || !data?.curveAddress || !plan) return;
    if (graduated) { setMsg({ kind: "err", text: "Token has graduated to the Uniswap V4 pool; curve buyback is only for the bonding-curve phase." }); return; }
    if (!isNative) { setMsg({ kind: "err", text: "This token is not ETH-paired; ERC-20-quote buyback needs an approval flow." }); return; }
    setBusy(true); setMsg(null);
    try {
      if (chainId !== robinhoodChain.id) await switchChainAsync({ chainId: robinhoodChain.id });
      // buy(quoteIn, minTokensOut, recipient) with recipient = burn address → the
      // bought NEUMA is minted straight to 0x…dEaD, i.e. bought back AND burned.
      const hash = await writeContractAsync({
        address: data.curveAddress as `0x${string}`,
        abi: v2CurveAbi as Abi,
        functionName: "buy",
        args: [plan.quoteIn, plan.minOut, BURN_ADDRESS],
        value: plan.quoteIn,
      });
      setMsg({ kind: "ok", text: "Buyback & burn submitted.", href: explorerTx(hash) });
      setTimeout(() => { refetchBurned(); load(); }, 3500);
    } catch (e) {
      setMsg({ kind: "err", text: (e instanceof Error ? e.message : "Buyback failed.").slice(0, 180) });
    } finally { setBusy(false); }
  }

  const priceUsd = data?.curve && data.ethUsd ? data.curve.spotPrice * data.ethUsd : null;

  return (
    <div className="wrap" style={{ paddingTop: 26, paddingBottom: 48, maxWidth: 720 }}>
      <span className="mono" style={{ fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--cream)" }}>Buyback &amp; burn</span>
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.02em", marginTop: 10 }}>$NEUMA buyback &amp; burn</h1>
      <p style={{ marginTop: 10, color: "var(--mut)", fontSize: 15, lineHeight: 1.6, maxWidth: "58ch" }}>
        Buy $NEUMA on the bonding curve and send it straight to the burn address in one signed transaction. Set the size
        (default ${BUYBACK_USD}) and sign - the bought supply is removed forever. For a continuous ${BUYBACK_USD}/minute
        engine, enable the automated keeper (see notes below).
      </p>

      <div className="duo" style={{ marginTop: 22 }}>
        <div className="stat-tile">
          <div className="st-k">Total $NEUMA burned</div>
          <div className="st-v accent">{burned != null ? compact(burned) : "…"}</div>
        </div>
        <div className="stat-tile">
          <div className="st-k">Price</div>
          <div className="st-v">{priceUsd != null ? usdPrice(priceUsd) : "…"}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="flex items-center justify-between"><span style={{ fontWeight: 600 }}>Buy back &amp; burn now</span>
          <span className="badge">fees → burn</span>
        </div>

        <div style={{ marginTop: 14 }}>
          <span style={{ display: "block", fontSize: 13, color: "var(--mut)", marginBottom: 8 }}>Amount (USD)</span>
          <div className="flex items-center gap-2">
            <span className="mono" style={{ color: "var(--dim)" }}>$</span>
            <input className="input mono" value={usdAmount} onChange={(e) => setUsdAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="2" style={{ maxWidth: 160 }} />
            {[1, 2, 5].map((v) => (
              <button key={v} onClick={() => setUsdAmount(String(v))} className={`pill pill--sm ${Number(usdAmount) === v ? "pill--active" : ""}`}>${v}</button>
            ))}
          </div>
        </div>

        {plan && (
          <div className="mono" style={{ marginTop: 14, fontSize: 13, color: "var(--mut)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="flex justify-between"><span>Spend</span><span>{Number(formatUnits(plan.quoteIn, 18)).toFixed(6)} ETH</span></div>
            <div className="flex justify-between"><span>Est. $NEUMA</span><span>≈ {compact(Number(formatUnits(plan.expected, data?.decimals ?? 18)))}</span></div>
            <div className="flex justify-between"><span>Min received (after slippage)</span><span>{compact(Number(formatUnits(plan.minOut, data?.decimals ?? 18)))}</span></div>
          </div>
        )}

        {graduated && <p className="notice" style={{ marginTop: 14, fontSize: 12.5 }}>This token has graduated to the Uniswap V4 pool. Curve buyback applies to the bonding-curve phase only.</p>}

        <div style={{ marginTop: 16 }}>
          {!isConnected ? (
            <ConnectWallet label="Connect wallet" />
          ) : (
            <button onClick={buybackAndBurn} disabled={busy || !plan || graduated} className="btn btn-cream" style={{ width: "100%", padding: 14 }}>
              {busy ? "Confirm in wallet…" : `Buy back & burn $${usdAmount || BUYBACK_USD}`}
            </button>
          )}
        </div>

        {msg && (
          <p style={{ marginTop: 12, fontSize: 13, color: msg.kind === "ok" ? "var(--green)" : "var(--red)" }}>
            {msg.text} {msg.href && <a href={msg.href} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>view tx</a>}
          </p>
        )}
      </div>

      <div className="card-2" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Automated engine (${BUYBACK_USD} / minute)</div>
        <p style={{ marginTop: 6, color: "var(--mut)", fontSize: 13, lineHeight: 1.6 }}>
          A Vercel Cron hits <span className="mono">/api/buyback</span> every minute and runs one round from a keeper
          wallet. It stays off until you set <span className="mono">BUYBACK_KEEPER_PRIVATE_KEY</span> and{" "}
          <span className="mono">BUYBACK_ENABLED=true</span>, and fund that wallet with ETH. See{" "}
          <span className="mono">contracts/README.md</span> and the buyback route.
        </p>
      </div>
    </div>
  );
}
