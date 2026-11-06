import "server-only";
import Decimal from "decimal.js";
import { toMoneyString } from "@/lib/money";

/**
 * JPY conversion for connected accounts.
 *
 * PayPal sandbox data is usually USD while this app uses JPY. A live rate is
 * fetched (cached for 12h) with a conservative fallback if the rate service is
 * unavailable, so a page never fails because of an FX lookup.
 */

const CACHE_MS = 12 * 60 * 60 * 1000;
const FALLBACK_JPY_PER_UNIT: Record<string, number> = {
  JPY: 1,
  USD: 150,
  EUR: 160,
  GBP: 190,
};

interface CachedRate {
  rate: number;
  expiresAt: number;
}

const cache = new Map<string, CachedRate>();

/** How many JPY one unit of `currency` is worth. */
export async function jpyRate(currency: string): Promise<number> {
  const code = currency.trim().toUpperCase();
  if (code === "JPY") return 1;

  const cached = cache.get(code);
  if (cached && cached.expiresAt > Date.now()) return cached.rate;

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${code}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 43_200 },
      signal: AbortSignal.timeout(2_500),
    });

    if (response.ok) {
      const body = (await response.json()) as { rates?: Record<string, number> };
      const rate = Number(body.rates?.JPY);
      if (Number.isFinite(rate) && rate > 0) {
        cache.set(code, { rate, expiresAt: Date.now() + CACHE_MS });
        return rate;
      }
    }
  } catch {
    // Fall through to the fallback rate.
  }

  const fallback = FALLBACK_JPY_PER_UNIT[code] ?? 1;
  cache.set(code, { rate: fallback, expiresAt: Date.now() + CACHE_MS });
  return fallback;
}

/** Converts a decimal amount string to JPY using the current cached rate. */
export async function convertToJpy(
  amount: string,
  currency: string,
): Promise<string> {
  const rate = await jpyRate(currency);
  return toMoneyString(new Decimal(amount).times(rate));
}
