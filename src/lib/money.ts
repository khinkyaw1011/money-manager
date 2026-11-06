import Decimal from "decimal.js";

/**
 * Money helpers.
 *
 * Rule: amounts are NEVER handled as JS floating-point numbers.
 * - The database stores them as NUMERIC (Prisma `Decimal`).
 * - Arithmetic goes through decimal.js.
 * - Values cross the server/client boundary as strings ("1234.50").
 */

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_EVEN });

export type MoneyInput = Decimal.Value; // string | number | Decimal

/** Strict decimal string: optional minus, digits, up to 2 fraction digits. */
export const MONEY_PATTERN = /^-?\d{1,12}(\.\d{1,2})?$/;

export function toDecimal(value: MoneyInput): Decimal {
  return new Decimal(value);
}

export function sumMoney(values: readonly MoneyInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(v), new Decimal(0));
}

/** Serialize for transport/storage: fixed 2 fraction digits. */
export function toMoneyString(value: MoneyInput): string {
  return new Decimal(value).toFixed(2);
}

/** Percentage (0–100+) of `part` relative to `whole`, rounded to 1 dp. */
export function percentOf(part: MoneyInput, whole: MoneyInput): Decimal {
  const w = new Decimal(whole);
  if (w.isZero()) return new Decimal(0);
  return new Decimal(part).div(w).times(100).toDecimalPlaces(1);
}

/**
 * Format for display. Uses the currency's own minor-unit rules
 * (e.g. JPY has 0 decimals, USD has 2). Conversion to Number happens
 * only here, at the display edge, after all arithmetic is finished.
 */
export function formatMoney(
  value: MoneyInput,
  currency = "JPY",
  locale = "ja-JP",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(new Decimal(value).toNumber());
}
