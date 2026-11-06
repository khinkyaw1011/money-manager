import Decimal from "decimal.js";
import { toMoneyString } from "@/lib/money";
import type {
  BudgetRecord,
  BudgetSummary,
  CategoryPoint,
  MonthlyPoint,
  TransactionRecord,
} from "./types";

/**
 * Pure dashboard math — no I/O, so it is easy to unit-test (Phase 9).
 * All arithmetic uses decimal.js; nothing here touches JS floats.
 */

/** "YYYY-MM" for `date` as seen in `timeZone`. */
export function monthKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}`;
}

/** The last `count` month keys ending with the month containing `now`, oldest first. */
export function recentMonthKeys(now: Date, count: number, timeZone: string): string[] {
  const [y, m] = monthKey(now, timeZone).split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/**
 * A UTC range that safely covers every month key (padded by a day on each side
 * so any time zone fits). Callers bucket by `monthKey`, so the padding is harmless.
 */
export function rangeForMonths(keys: string[]): { from: Date; to: Date } {
  const [fy, fm] = keys[0].split("-").map(Number);
  const [ly, lm] = keys[keys.length - 1].split("-").map(Number);
  const DAY = 86_400_000;
  return {
    from: new Date(Date.UTC(fy, fm - 1, 1) - DAY),
    to: new Date(Date.UTC(ly, lm, 1) + DAY),
  };
}

export function buildTrend(
  transactions: TransactionRecord[],
  keys: string[],
  timeZone: string,
): MonthlyPoint[] {
  const buckets = new Map(keys.map((k) => [k, { income: new Decimal(0), expenses: new Decimal(0) }]));
  for (const t of transactions) {
    const bucket = buckets.get(monthKey(t.date, timeZone));
    if (!bucket) continue;
    if (t.type === "INCOME") bucket.income = bucket.income.plus(t.amount);
    else bucket.expenses = bucket.expenses.plus(t.amount);
  }
  return keys.map((month) => {
    const b = buckets.get(month)!;
    return { month, income: toMoneyString(b.income), expenses: toMoneyString(b.expenses) };
  });
}

export function buildExpensesByCategory(
  transactions: TransactionRecord[],
  month: string,
  timeZone: string,
): CategoryPoint[] {
  const totals = new Map<string, Decimal>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE" || monthKey(t.date, timeZone) !== month) continue;
    totals.set(t.categoryName, (totals.get(t.categoryName) ?? new Decimal(0)).plus(t.amount));
  }
  return [...totals.entries()]
    .sort(([, a], [, b]) => b.comparedTo(a))
    .map(([category, amount]) => ({ category, amount: toMoneyString(amount) }));
}

/** Budget usage: spending counts only in categories that have a budget. */
export function buildBudgetSummary(
  budgets: BudgetRecord[],
  byCategory: CategoryPoint[],
): BudgetSummary | null {
  if (budgets.length === 0) return null;
  const spentMap = new Map(byCategory.map((c) => [c.category, new Decimal(c.amount)]));
  let total = new Decimal(0);
  let spent = new Decimal(0);
  for (const b of budgets) {
    total = total.plus(b.limit);
    spent = spent.plus(spentMap.get(b.categoryName) ?? 0);
  }
  const percent = total.isZero() ? new Decimal(0) : spent.div(total).times(100).toDecimalPlaces(1);
  return {
    total: toMoneyString(total),
    spent: toMoneyString(spent),
    remaining: toMoneyString(total.minus(spent)),
    percentUsed: percent.toFixed(1),
  };
}
