/** Manual income / expense ledger types. Money values are decimal strings. */

export type LedgerKind = "INCOME" | "EXPENSE";

export interface LedgerEntry {
  id: string;
  kind: LedgerKind;
  /** Positive decimal string, e.g. "1250.00". */
  amount: string;
  currency: string;
  category: string;
  description: string;
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  createdAt: string;
}

export const INCOME_CATEGORIES = ["Salary", "Freelance", "Business", "Other income"] as const;

export const EXPENSE_CATEGORIES = [
  "Food",
  "Shopping",
  "Transportation",
  "Rent",
  "Utilities",
  "Healthcare",
  "Entertainment",
] as const;

export const CURRENCIES = ["JPY", "USD", "EUR", "GBP"] as const;

/** Sentinel used by the category select to reveal the custom-name input. */
export const CUSTOM_CATEGORY = "__custom__";

export function categoriesFor(kind: LedgerKind): readonly string[] {
  return kind === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
