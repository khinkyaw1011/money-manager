/** Monthly budget categories and stored limits. */

export interface BudgetCategory {
  key: string;
  label: string;
  /** Expense categories that count toward this budget. */
  aliases: readonly string[];
}

export const BUDGET_CATEGORIES: readonly BudgetCategory[] = [
  { key: "food", label: "Food", aliases: ["Food"] },
  {
    key: "rent",
    label: "Rent / house fee",
    aliases: ["Rent / house fee", "Rent"],
  },
  { key: "water", label: "Water bill", aliases: ["Water bill"] },
  { key: "gas", label: "Gas bill", aliases: ["Gas bill"] },
  { key: "electric", label: "Electric bill", aliases: ["Electric bill"] },
  { key: "cosmetics", label: "Cosmetics", aliases: ["Cosmetics", "Shopping"] },
  {
    key: "traffic",
    label: "Traffic fee",
    aliases: ["Traffic fee", "Transportation"],
  },
] as const;

/** category label → monthly limit (decimal string, JPY). */
export type BudgetLimits = Record<string, string>;

export const DEFAULT_BUDGET_LIMITS: BudgetLimits = Object.fromEntries(
  BUDGET_CATEGORIES.map((category) => [category.label, "0.00"]),
);
