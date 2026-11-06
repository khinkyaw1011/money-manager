import "server-only";
import Decimal from "decimal.js";
import type {
  PayPalActivitySummary,
  PayPalCurrencyTotal,
  PayPalDirection,
  PayPalErrorCode,
  PayPalTransaction,
} from "@/features/paypal/types";
import { paypalEnv, type PayPalEnv } from "@/lib/env";
import { toMoneyString } from "@/lib/money";
import { jpyRate } from "./exchange-rates";

/**
 * PayPal REST integration (sandbox by default).
 *
 * Uses the Transaction Search API (`GET /v1/reporting/transactions`) with a
 * client-credentials token. The app must have the "Transaction Search" feature
 * enabled in the PayPal Developer Dashboard; otherwise PayPal returns 403.
 *
 * Docs: https://developer.paypal.com/docs/transaction-search/
 */

const PAGE_SIZE = 500;
/** PayPal allows at most 31 days per search; 30 keeps us safely inside it. */
const MAX_WINDOW_MS = 30 * 86_400_000;
const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 3 * 365;
const MAX_PAGES = 20;

/**
 * Account funding, withdrawals, transfers and opening balances are not
 * income or spending: they only move existing money between accounts.
 */
const NON_ACTIVITY_EVENT_CODES = new Set([
  "T0300", // bank deposit to PayPal balance (funding)
  "T0400", // withdrawal from PayPal balance to a bank
  "T0500", // withdrawal to a card
  "T0700", // credit card funding deposit
  "T1900", // initial / opening balance
  "T2000", // intra-account transfer / currency conversion
]);

const EVENT_LABELS: Record<string, string> = {
  T0000: "Payment",
  T0002: "Subscription payment",
  T0003: "Pre-approved payment",
  T0005: "Credit card payment",
  T0006: "Express Checkout payment",
  T0007: "Website payment",
  T0011: "Mobile payment",
  T0013: "Donation",
  T0300: "Bank deposit",
  T0400: "Bank withdrawal",
  T0500: "Card withdrawal",
  T1100: "Reversal",
  T1106: "Reversal",
  T1107: "Refund",
  T1900: "Initial balance",
  T2000: "Account transfer",
};

interface PayPalMoney {
  currency_code?: string;
  value?: string;
}

interface PayPalTransactionInfo {
  transaction_id?: string;
  transaction_event_code?: string;
  transaction_initiation_date?: string;
  transaction_amount?: PayPalMoney;
  transaction_status?: string;
  transaction_subject?: string;
  transaction_note?: string;
}

interface PayPalPayerInfo {
  email_address?: string;
  payer_name?: { alternate_full_name?: string; full_name?: string };
}

interface PayPalTransactionDetail {
  transaction_info?: PayPalTransactionInfo;
  payer_info?: PayPalPayerInfo;
}

interface PayPalTransactionResponse {
  transaction_details?: PayPalTransactionDetail[];
  total_pages?: number;
}

interface PayPalErrorBody {
  error?: string;
  name?: string;
  message?: string;
  debug_id?: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

let tokenCache: CachedToken | undefined;

export class PayPalIntegrationError extends Error {
  constructor(
    readonly code: PayPalErrorCode,
    message: string,
    readonly status?: number,
    readonly debugId?: string,
  ) {
    super(message);
    this.name = "PayPalIntegrationError";
  }
}

function credentials(): PayPalEnv {
  try {
    return paypalEnv();
  } catch (error) {
    throw new PayPalIntegrationError(
      "NOT_CONFIGURED",
      error instanceof Error ? error.message : "PayPal credentials are not configured.",
    );
  }
}

function apiBase(environment: PayPalEnv["environment"]): string {
  return environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function basicAuth({ clientId, clientSecret }: PayPalEnv): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

/** RFC 3339 with seconds, e.g. 2026-11-05T12:00:00Z. */
function paypalDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function parseBody(text: string): PayPalErrorBody | null {
  try {
    return JSON.parse(text) as PayPalErrorBody;
  } catch {
    return null;
  }
}

function responseError(
  res: Response,
  body: PayPalErrorBody | null,
  fallback: string,
): PayPalIntegrationError {
  const message = body?.message || fallback;
  if (res.status === 401 || body?.error === "invalid_client") {
    return new PayPalIntegrationError(
      "NOT_CONFIGURED",
      `PayPal rejected the configured client credentials. ${message}`,
      res.status,
      body?.debug_id,
    );
  }
  if (res.status === 403 || body?.name === "NOT_AUTHORIZED") {
    return new PayPalIntegrationError(
      "NOT_AUTHORIZED",
      "PayPal did not authorize transaction search. Enable the Transaction Search feature for this app in the PayPal Developer Dashboard, save, then refresh this page.",
      res.status,
      body?.debug_id,
    );
  }
  return new PayPalIntegrationError("API_ERROR", message, res.status, body?.debug_id);
}

async function requestToken(): Promise<CachedToken> {
  const env = credentials();
  const res = await fetch(`${apiBase(env.environment)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(env),
      Accept: "application/json",
      "Accept-Language": "en_US",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const text = await res.text();
  const body = parseBody(text) as
    | (PayPalErrorBody & { access_token?: string; expires_in?: number })
    | null;

  if (!res.ok || !body?.access_token) {
    throw responseError(res, body, "Could not obtain a PayPal access token.");
  }

  const expiresIn = Number(body.expires_in ?? 32_400);
  return {
    value: body.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

/** Cached token. Access tokens normally live ~9 hours; refresh a minute early. */
async function getToken(force = false): Promise<string> {
  const now = Date.now();
  if (!force && tokenCache && tokenCache.expiresAt - now > 60_000) {
    return tokenCache.value;
  }
  tokenCache = await requestToken();
  return tokenCache.value;
}

/**
 * Ask PayPal to invalidate the cached token. This matters right after the
 * Transaction Search feature is enabled: PayPal otherwise reuses the old token
 * (without the new scope) for up to 9 hours.
 */
async function discardToken(token: string): Promise<void> {
  const env = credentials();
  tokenCache = undefined;
  try {
    await fetch(`${apiBase(env.environment)}/v1/oauth2/token/terminate`, {
      method: "POST",
      headers: {
        Authorization: basicAuth(env),
        Accept: "application/json",
        "Accept-Language": "en_US",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ token }).toString(),
      cache: "no-store",
    });
  } catch {
    // Termination is best-effort; a fresh token is still requested below.
  }
}

async function fetchWindow(
  from: Date,
  to: Date,
  canRetry = true,
): Promise<PayPalTransactionDetail[]> {
  const env = credentials();
  const token = await getToken(false);
  const details: PayPalTransactionDetail[] = [];
  let page = 1;

  for (;;) {
    const params = new URLSearchParams({
      start_date: paypalDate(from),
      end_date: paypalDate(to),
      fields: "transaction_info,payer_info",
      page_size: String(PAGE_SIZE),
      page: String(page),
    });

    const res = await fetch(`${apiBase(env.environment)}/v1/reporting/transactions?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": "en_US",
        "Content-Type": "application/json",
        "PayPal-Enforce-ISO8601-Format": "true",
      },
      cache: "no-store",
    });
    const text = await res.text();
    const body = parseBody(text) as
      | (PayPalErrorBody & PayPalTransactionResponse)
      | null;

    if (!res.ok) {
      if (res.status === 403 && canRetry) {
        await discardToken(token);
        return fetchWindow(from, to, false);
      }
      throw responseError(res, body, "PayPal transaction search failed.");
    }

    const pageDetails = body?.transaction_details ?? [];
    details.push(...pageDetails);

    const totalPages = Number(body?.total_pages ?? 1);
    if (page >= totalPages || page >= MAX_PAGES || pageDetails.length === 0) break;
    page += 1;
  }

  return details;
}

function eventLabel(code: string | undefined): string {
  if (!code) return "Payment";
  if (EVENT_LABELS[code]) return EVENT_LABELS[code];
  if (code.startsWith("T01")) return "Fee";
  return `PayPal ${code}`;
}

function toTransaction(
  detail: PayPalTransactionDetail,
  rates: Map<string, number>,
): PayPalTransaction | null {
  const info = detail.transaction_info;
  const amount = info?.transaction_amount;
  if (!info || !amount?.value) return null;

  const value = new Decimal(amount.value);
  if (value.isZero()) return null;

  const eventCode = info.transaction_event_code;
  if (eventCode && NON_ACTIVITY_EVENT_CODES.has(eventCode)) return null;

  const originalCurrency = (amount.currency_code || "USD").toUpperCase();
  const rate = rates.get(originalCurrency) ?? 1;

  const rawDate = info.transaction_initiation_date;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return null;

  const payer =
    detail.payer_info?.payer_name?.alternate_full_name?.trim() ||
    detail.payer_info?.payer_name?.full_name?.trim() ||
    detail.payer_info?.email_address?.trim() ||
    null;

  const description =
    info.transaction_subject?.trim() ||
    info.transaction_note?.trim() ||
    eventLabel(eventCode);

  return {
    id: `${info.transaction_id ?? "transaction"}:${rawDate}`,
    date: date.toISOString(),
    amount: toMoneyString(value.abs().times(rate)),
    currency: "JPY",
    description,
    typeLabel: eventLabel(eventCode),
    status: info.transaction_status ?? "",
    payer,
    direction: value.isNegative() ? "EXPENSE" : "INCOME",
  };
}

function totalsFor(
  transactions: PayPalTransaction[],
  direction: PayPalDirection,
): PayPalCurrencyTotal[] {
  const totals = new Map<string, { total: Decimal; count: number }>();
  for (const transaction of transactions) {
    if (transaction.direction !== direction) continue;
    const entry = totals.get(transaction.currency) ?? { total: new Decimal(0), count: 0 };
    entry.total = entry.total.plus(transaction.amount);
    entry.count += 1;
    totals.set(transaction.currency, entry);
  }
  return [...totals.entries()]
    .map(([currency, entry]) => ({
      currency,
      total: toMoneyString(entry.total),
      count: entry.count,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

/**
 * Collects PayPal sandbox income and expenses for the last `days` days.
 *
 * Every request stays inside PayPal's 31-day search window. Positive amounts
 * are income, negative amounts are expenses. Account funding, withdrawals,
 * transfers and opening balances are ignored so totals reflect real activity.
 */
export async function getPayPalActivitySummary(
  { days = 90, now = new Date() }: { days?: number; now?: Date } = {},
): Promise<PayPalActivitySummary> {
  const rangeDays = Math.min(Math.max(1, Math.trunc(days)), MAX_RANGE_DAYS);
  const to = now;
  const from = new Date(to.getTime() - rangeDays * DAY_MS);

  const raw: PayPalTransactionDetail[] = [];
  let cursor = from;
  while (cursor.getTime() < to.getTime()) {
    const end = new Date(Math.min(cursor.getTime() + MAX_WINDOW_MS, to.getTime()));
    raw.push(...(await fetchWindow(cursor, end)));
    cursor = end;
  }

  // Convert every PayPal currency to JPY up front so the rest of the app only
  // ever deals with one currency.
  const currencies = new Set<string>();
  for (const detail of raw) {
    const info = detail.transaction_info;
    const code = info?.transaction_amount?.currency_code?.toUpperCase();
    if (!code || code === "JPY") continue;
    if (info?.transaction_event_code && NON_ACTIVITY_EVENT_CODES.has(info.transaction_event_code)) {
      continue;
    }
    currencies.add(code);
  }

  const rates = new Map<string, number>([["JPY", 1]]);
  await Promise.all(
    [...currencies].map(async (code) => {
      rates.set(code, await jpyRate(code));
    }),
  );

  const seen = new Set<string>();
  const transactions: PayPalTransaction[] = [];
  for (const detail of raw) {
    const transaction = toTransaction(detail, rates);
    if (!transaction || seen.has(transaction.id)) continue;
    seen.add(transaction.id);
    transactions.push(transaction);
  }
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    days: rangeDays,
    transactions,
    incomeTotals: totalsFor(transactions, "INCOME"),
    expenseTotals: totalsFor(transactions, "EXPENSE"),
    scanned: raw.length,
  };
}
