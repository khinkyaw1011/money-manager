/**
 * PayPal activity types shared by the income and expenses pages.
 * Money values are decimal strings, never floats.
 */

export type PayPalDirection = "INCOME" | "EXPENSE";

export interface PayPalTransaction {
  id: string;
  /** ISO timestamp of the PayPal transaction. */
  date: string;
  /** Absolute decimal string, e.g. "42.00". */
  amount: string;
  currency: string;
  description: string;
  /** Friendly label for the PayPal transaction event code. */
  typeLabel: string;
  /** PayPal status code: S, P, V or D. */
  status: string;
  /** Counterparty name or email, when PayPal reports one. */
  payer: string | null;
  direction: PayPalDirection;
}

export interface PayPalCurrencyTotal {
  currency: string;
  /** Sum of transactions in this currency and direction. */
  total: string;
  count: number;
}

export interface PayPalActivitySummary {
  /** Inclusive PayPal query window. */
  range: { from: string; to: string };
  days: number;
  /** Every income and expense transaction returned by PayPal. */
  transactions: PayPalTransaction[];
  /** One total per currency (no FX conversion is applied). */
  incomeTotals: PayPalCurrencyTotal[];
  expenseTotals: PayPalCurrencyTotal[];
  /** Raw PayPal transactions examined, including ignored transfers. */
  scanned: number;
}

export type PayPalErrorCode = "NOT_CONFIGURED" | "NOT_AUTHORIZED" | "API_ERROR";

export interface PayPalErrorInfo {
  code: PayPalErrorCode;
  message: string;
  status?: number;
  debugId?: string;
}
