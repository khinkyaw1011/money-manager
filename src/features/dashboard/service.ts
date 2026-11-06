import "server-only";
import Decimal from "decimal.js";
import { siteConfig } from "@/config/site";
import { toMoneyString } from "@/lib/money";
import {
  buildBudgetSummary,
  buildExpensesByCategory,
  buildTrend,
  rangeForMonths,
  recentMonthKeys,
} from "./calculations";
import { emptyDataSource, type DashboardDataSource } from "./data-source";
import type { DashboardSummary } from "./types";

const TREND_MONTHS = 6;
const RECENT_LIMIT = 5;

/**
 * Builds the dashboard for one user. `userId` must come from the server-side
 * session, never from client input.
 *
 * When the current month has no activity, the headline tiles fall back to the
 * most recent month that does, so a quiet month does not hide real data.
 */
export async function getDashboardSummary(
  userId: string,
  { now = new Date(), source = emptyDataSource }: { now?: Date; source?: DashboardDataSource } = {},
): Promise<DashboardSummary> {
  const tz = siteConfig.timeZone;
  const keys = recentMonthKeys(now, TREND_MONTHS, tz);

  const [currency, totalBalance, transactions, recent] = await Promise.all([
    source.getCurrency(),
    source.getTotalBalance(userId),
    source.getTransactions(userId, rangeForMonths(keys)),
    source.getRecentTransactions(userId, RECENT_LIMIT),
  ]);

  const trend = buildTrend(transactions, keys, tz);
  const latestActive = [...trend]
    .reverse()
    .find((point) => new Decimal(point.income).plus(point.expenses).abs().greaterThan(0));
  const month = latestActive?.month ?? keys[keys.length - 1];
  const current = trend.find((point) => point.month === month)!;
  const budgets = await source.getBudgets(userId, month);
  const expensesByCategory = buildExpensesByCategory(transactions, month, tz);

  return {
    month,
    currency,
    totalBalance: toMoneyString(totalBalance),
    monthlyIncome: current.income,
    monthlyExpenses: current.expenses,
    monthlySavings: toMoneyString(new Decimal(current.income).minus(current.expenses)),
    budget: buildBudgetSummary(budgets, expensesByCategory),
    trend,
    expensesByCategory,
    recentTransactions: recent.map((t) => ({
      id: t.id,
      type: t.type,
      amount: toMoneyString(t.amount),
      date: t.date.toISOString(),
      categoryName: t.categoryName,
      description: t.description,
    })),
  };
}
