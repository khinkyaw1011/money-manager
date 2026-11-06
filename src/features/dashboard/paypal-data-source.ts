import "server-only";
import Decimal from "decimal.js";
import { siteConfig } from "@/config/site";
import type { PayPalActivitySummary, PayPalTransaction } from "@/features/paypal/types";
import { toMoneyString } from "@/lib/money";
import { getPayPalActivitySummary } from "@/server/integrations/paypal";
import type { DashboardDataSource } from "./data-source";
import type { TransactionRecord } from "./types";

/**
 * More than six months, so the dashboard trend window is always covered.
 * Every dashboard read shares one PayPal fetch through `activity()`.
 */
const DEFAULT_DAYS = 200;

function toRecord(transaction: PayPalTransaction): TransactionRecord {
  return {
    id: transaction.id,
    type: transaction.direction,
    amount: transaction.amount,
    date: new Date(transaction.date),
    categoryName: transaction.typeLabel,
    description: transaction.payer
      ? `${transaction.description} · ${transaction.payer}`
      : transaction.description,
  };
}

/**
 * Picks the currency with the most transactions (total breaks ties). The
 * dashboard renders one currency; mixing currencies would be misleading.
 */
function primaryCurrency(summary: PayPalActivitySummary): string {
  const byCurrency = new Map<string, { count: number; total: Decimal }>();
  for (const transaction of summary.transactions) {
    const entry = byCurrency.get(transaction.currency) ?? {
      count: 0,
      total: new Decimal(0),
    };
    entry.count += 1;
    entry.total = entry.total.plus(transaction.amount);
    byCurrency.set(transaction.currency, entry);
  }

  const [best] = [...byCurrency.entries()].sort(
    ([, a], [, b]) => b.count - a.count || b.total.comparedTo(a.total),
  );
  return best?.[0] ?? siteConfig.defaultCurrency;
}

/**
 * Dashboard source backed by the PayPal sandbox account. Amounts are filtered
 * to one currency; budgets stay empty until the database phase lands.
 */
export function createPayPalDataSource({
  days = DEFAULT_DAYS,
}: { days?: number } = {}): DashboardDataSource {
  let activityPromise: Promise<PayPalActivitySummary> | undefined;
  const activity = () =>
    (activityPromise ??= getPayPalActivitySummary({ days }));

  return {
    getCurrency: async () => primaryCurrency(await activity()),

    getTotalBalance: async () => {
      const summary = await activity();
      const currency = primaryCurrency(summary);
      const net = summary.transactions
        .filter((transaction) => transaction.currency === currency)
        .reduce(
          (total, transaction) =>
            transaction.direction === "INCOME"
              ? total.plus(transaction.amount)
              : total.minus(transaction.amount),
          new Decimal(0),
        );
      return toMoneyString(net);
    },

    getTransactions: async (_userId, range) => {
      const summary = await activity();
      const currency = primaryCurrency(summary);
      return summary.transactions
        .filter(
          (transaction) =>
            transaction.currency === currency &&
            new Date(transaction.date) >= range.from &&
            new Date(transaction.date) <= range.to,
        )
        .map(toRecord);
    },

    getBudgets: async () => [],

    getRecentTransactions: async (_userId, limit) => {
      const summary = await activity();
      const currency = primaryCurrency(summary);
      return summary.transactions
        .filter((transaction) => transaction.currency === currency)
        .slice(0, limit)
        .map(toRecord);
    },
  };
}
