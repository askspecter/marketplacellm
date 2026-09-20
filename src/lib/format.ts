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

/**
 * Format a small price without scientific notation, keeping a few significant
 * digits — e.g. 1.68e-9 → "0.00000000168", 7.67e-6 → "0.00000767". This is how
 * pons shows "Price in ETH" so tiny curve prices stay readable.
 */
export function smallNum(n: number, sig = 3): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  const neg = n < 0;
  const abs = Math.abs(n);
  let out: string;
  if (abs >= 1) {
    out = abs.toLocaleString("en-US", { maximumFractionDigits: 6 });
  } else if (abs >= 0.001) {
    out = abs.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  } else {
    const exp = Math.floor(Math.log10(abs)); // negative
    const decimals = Math.min(18, -exp + (sig - 1));
    out = abs.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
  }
  return neg ? `-${out}` : out;
}

/** USD price of one token, precise for sub-cent values (pons-style). */
export function usdPrice(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + smallNum(n, 3);
}

/** Full USD amount with cents, e.g. "$16,584,171.06" (market cap). */
export function usdFull(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0.00";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
