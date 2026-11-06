/**
 * Dashboard types. All money values are decimal STRINGS ("12345.00") so they
 * survive the server → client boundary without floating-point loss.
 */

export type TransactionKind = "INCOME" | "EXPENSE";

/** Raw record shape the data source returns (mirrors the Phase 2 schema). */
export interface TransactionRecord {
  id: string;
  type: TransactionKind;
  amount: string;
  date: Date;
  categoryName: string;
  description: string | null;
}

export interface BudgetRecord {
  categoryName: string;
  /** Monthly limit. */
  limit: string;
}

export interface MonthlyPoint {
  /** "YYYY-MM" */
  month: string;
  income: string;
  expenses: string;
}

export interface CategoryPoint {
  category: string;
  amount: string;
}

export interface BudgetSummary {
  total: string;
  spent: string;
  remaining: string;
  /** 0–100+, one decimal place. */
  percentUsed: string;
}

export interface RecentTransaction {
  id: string;
  type: TransactionKind;
  amount: string;
  /** ISO date string. */
  date: string;
  categoryName: string;
  description: string | null;
}

export interface DashboardSummary {
  /** "YYYY-MM" of the current month in the app time zone. */
  month: string;
  currency: string;
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  /** Income − expenses for the month (can be negative). */
  monthlySavings: string;
  /** Null when no budgets are set for the month. */
  budget: BudgetSummary | null;
  /** Oldest → newest, always `months` entries (zeros where empty). */
  trend: MonthlyPoint[];
  /** Current-month expenses by category, largest first. */
  expensesByCategory: CategoryPoint[];
  recentTransactions: RecentTransaction[];
}
