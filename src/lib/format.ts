/** Display formatting helpers shared by server and client components. */

/** "2026-11" → "Nov" (style "short") or "November 2026" (style "long"). */
export function formatMonthKey(key: string, style: "short" | "long" = "short"): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: style,
    ...(style === "long" ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Compact axis label, e.g. ¥1.2M / ¥350K. Display only. */
export function formatCompactMoney(value: number, currency: string, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatShortDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone }).format(
    new Date(iso),
  );
}
