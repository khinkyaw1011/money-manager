import {
  BUDGET_CATEGORIES,
  DEFAULT_BUDGET_LIMITS,
  type BudgetLimits,
} from "./types";

export const BUDGETS_STORAGE_KEY = "money-manager:budgets:v1";

export function readBudgetLimits(): BudgetLimits {
  if (typeof window === "undefined") return { ...DEFAULT_BUDGET_LIMITS };
  try {
    const raw = window.localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BUDGET_LIMITS };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_BUDGET_LIMITS };

    const limits: BudgetLimits = { ...DEFAULT_BUDGET_LIMITS };
    for (const category of BUDGET_CATEGORIES) {
      const value = (parsed as Record<string, unknown>)[category.label];
      if (typeof value === "string") limits[category.label] = value;
    }
    return limits;
  } catch {
    return { ...DEFAULT_BUDGET_LIMITS };
  }
}

export function writeBudgetLimits(limits: BudgetLimits): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(limits));
  } catch {
    // Quota or privacy mode — the UI still works for this session.
  }
}
