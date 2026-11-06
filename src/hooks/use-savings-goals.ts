"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addSavingsGoal,
  contributeToSavingsGoal,
  deleteSavingsGoal,
  getSavingsSnapshot,
  getServerSavingsSnapshot,
  subscribeSavings,
  updateSavingsGoal,
} from "@/features/savings/store";
import type { NewSavingsGoal, SavingsGoalChanges } from "@/features/savings/types";

export function useSavingsGoals() {
  const snapshot = useSyncExternalStore(
    subscribeSavings,
    getSavingsSnapshot,
    getServerSavingsSnapshot,
  );

  const addGoal = useCallback((goal: NewSavingsGoal) => addSavingsGoal(goal), []);
  const updateGoal = useCallback(
    (id: string, changes: SavingsGoalChanges) => updateSavingsGoal(id, changes),
    [],
  );
  const deleteGoal = useCallback((id: string) => deleteSavingsGoal(id), []);
  const contribute = useCallback(
    (id: string, amount: string) => contributeToSavingsGoal(id, amount),
    [],
  );

  return {
    goals: snapshot.goals,
    loaded: snapshot.loaded,
    addGoal,
    updateGoal,
    deleteGoal,
    contribute,
  };
}
