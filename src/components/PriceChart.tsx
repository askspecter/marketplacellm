"use client";

import { useEffect, useRef, useState } from "react";
import { usd } from "@/lib/format";

interface Point {
  block: number;
  price: number;
  priceUsd: number | null;
}

/** Bonding-curve price history for a v2 token, from the engine chart endpoint. */
export function PriceChart({ token, quoteSymbol = "ETH" }: { token: string; quoteSymbol?: string }) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [usdMode, setUsdMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/v2/token/chart?address=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const pts: Point[] = d.points ?? [];
        setPoints(pts);
        setUsdMode(pts.some((p) => p.priceUsd != null));
      })
      .catch(() => alive && setPoints([]));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !points || points.length < 2) return;
    const series = points.map((p) => (usdMode && p.priceUsd != null ? p.priceUsd : p.price));
    const positive = series[series.length - 1] >= series[0];

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const pad = 8;
    const xy = series.map((v, i) => [
      (i / (series.length - 1)) * w,
      h - ((v - min) / range) * (h - pad * 2) - pad,
    ]);
    const color = positive ? "#a3e635" : "#fb7185";

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, positive ? "rgba(163,230,53,0.28)" : "rgba(251,113,133,0.28)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.moveTo(xy[0][0], h);
    xy.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(xy[xy.length - 1][0], h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    xy.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
  }, [points, usdMode]);

  if (points === null)
    return <div className="h-[200px] animate-pulse rounded-xl2 border border-bg-line bg-bg-panel/60" />;
  if (points.length < 2)
    return (
      <div className="grid h-[200px] place-items-center rounded-xl2 border border-bg-line bg-bg-panel text-sm text-white/40">
        No trades yet — the chart appears after the first buy.
      </div>
    );

  const last = points[points.length - 1];
  const first = points[0];
  const lastVal = usdMode && last.priceUsd != null ? last.priceUsd : last.price;
  const firstVal = usdMode && first.priceUsd != null ? first.priceUsd : first.price;
  const changePct = firstVal ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const up = changePct >= 0;

  return (
    <div className="rounded-xl2 border border-bg-line bg-bg-panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/40">Price ({usdMode ? "USD" : quoteSymbol})</div>
          <div className="mt-1 font-mono text-2xl font-bold">
            {usdMode ? usd(lastVal, 6) : `${lastVal.toPrecision(4)} ${quoteSymbol}`}
          </div>
        </div>
        <span className={`font-mono text-sm font-semibold ${up ? "text-lime" : "text-ember"}`}>
          {up ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      </div>
      <canvas ref={canvasRef} className="mt-3 h-[180px] w-full" />
    </div>
  );
}
