/** Savings goal types. Amounts are decimal strings in JPY. */

export interface SavingsGoal {
  id: string;
  name: string;
  /** Target amount, e.g. "500000.00". */
  target: string;
  /** Amount saved so far, e.g. "125000.00". */
  saved: string;
  currency: string;
  /** Optional target date, "YYYY-MM-DD". */
  targetDate: string | null;
  createdAt: string;
}

export type NewSavingsGoal = Omit<SavingsGoal, "id" | "createdAt">;
export type SavingsGoalChanges = Partial<Omit<SavingsGoal, "id" | "createdAt">>;
