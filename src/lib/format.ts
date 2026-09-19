export function shortAddr(a?: string): string {
  if (!a) return "";
  return a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function usd(n: number, max = 2): string {
  if (!Number.isFinite(n)) return "$0";
  if (n > 0 && n < 0.01) return "<$0.01";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n < 1 ? 2 : 0, maximumFractionDigits: max });
}

/** Compact USD price-per-1M-tokens label for model pricing. */
export function perM(n: number): string {
  if (n === 0) return "Free";
  if (n < 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(2);
}

export function compact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}

export function ethFmt(wei: bigint, dp = 4): string {
  const n = Number(wei) / 1e18;
  return n.toLocaleString("en-US", { maximumFractionDigits: dp });
}
