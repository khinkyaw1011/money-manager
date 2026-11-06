import "server-only";
import { siteConfig } from "@/config/site";
import type { BudgetRecord, TransactionRecord } from "./types";

/**
 * Where dashboard data comes from. Every method is scoped by `userId`, so a
 * user can only ever read their own records.
 *
 * Phase 2 adds a Prisma implementation. Until then the empty source is used:
 * it returns no data rather than invented numbers.
 */
export interface DashboardDataSource {
  /** ISO 4217 code for every amount this source returns. */
  getCurrency(): Promise<string>;
  /** Sum of account opening balances plus all income minus all expenses. */
  getTotalBalance(userId: string): Promise<string>;
  getTransactions(userId: string, range: { from: Date; to: Date }): Promise<TransactionRecord[]>;
  getBudgets(userId: string, month: string): Promise<BudgetRecord[]>;
  getRecentTransactions(userId: string, limit: number): Promise<TransactionRecord[]>;
}

export const emptyDataSource: DashboardDataSource = {
  getCurrency: async () => siteConfig.defaultCurrency,
  getTotalBalance: async () => "0.00",
  getTransactions: async () => [],
  getBudgets: async () => [],
  getRecentTransactions: async () => [],
};
