/** Robinhood Chain badge using the official mark (asset in /public). */
export function RhBadge({ label = "RH" }: { label?: string }) {
  return (
    <span className="badge" style={{ paddingLeft: 5 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/robinhood.png" alt="Robinhood" width={15} height={15} style={{ borderRadius: 4, display: "block" }} />
      {label}
    </span>
  );
}
