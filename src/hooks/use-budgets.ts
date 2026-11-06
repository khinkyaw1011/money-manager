"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getBudgetSnapshot,
  getServerBudgetSnapshot,
  setBudgetLimits,
  subscribeBudgets,
} from "@/features/budgets/store";
import type { BudgetLimits } from "@/features/budgets/types";

export function useBudgets() {
  const snapshot = useSyncExternalStore(
    subscribeBudgets,
    getBudgetSnapshot,
    getServerBudgetSnapshot,
  );

  const saveLimits = useCallback((limits: BudgetLimits) => setBudgetLimits(limits), []);

  return {
    limits: snapshot.limits,
    loaded: snapshot.loaded,
    saveLimits,
  };
}
