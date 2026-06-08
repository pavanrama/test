// Money helpers. Amounts are stored as floating point currency units but always
// rounded to 2 decimals at the boundaries to avoid accumulation drift.

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(
  value: number,
  symbol = "$",
  options: { showSymbol?: boolean } = {},
): string {
  const { showSymbol = true } = options;
  const safe = Number.isFinite(value) ? value : 0;
  const formatted = Math.abs(safe).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = safe < 0 ? "-" : "";
  return showSymbol ? `${sign}${symbol}${formatted}` : `${sign}${formatted}`;
}

export function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}
