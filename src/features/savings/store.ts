import Decimal from "decimal.js";
import { toMoneyString } from "@/lib/money";
import {
  newSavingsGoalId,
  readSavingsGoals,
  SAVINGS_STORAGE_KEY,
  writeSavingsGoals,
} from "./storage";
import type { NewSavingsGoal, SavingsGoal, SavingsGoalChanges } from "./types";

/** External store over localStorage, read with `useSyncExternalStore`. */

export interface SavingsSnapshot {
  goals: SavingsGoal[];
  loaded: boolean;
}

const SERVER_SNAPSHOT: SavingsSnapshot = { goals: [], loaded: false };
let snapshot: SavingsSnapshot | undefined;
const listeners = new Set<() => void>();

function current(): SavingsSnapshot {
  if (!snapshot) snapshot = { goals: readSavingsGoals(), loaded: true };
  return snapshot;
}

export function getSavingsSnapshot(): SavingsSnapshot {
  return current();
}

export function getServerSavingsSnapshot(): SavingsSnapshot {
  return SERVER_SNAPSHOT;
}

function commit(goals: SavingsGoal[]): void {
  snapshot = { goals, loaded: true };
  writeSavingsGoals(goals);
  for (const listener of listeners) listener();
}

function update(updater: (goals: SavingsGoal[]) => SavingsGoal[]): void {
  commit(updater(current().goals));
}

export function subscribeSavings(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SAVINGS_STORAGE_KEY) return;
    snapshot = { goals: readSavingsGoals(), loaded: true };
    for (const currentListener of listeners) currentListener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function addSavingsGoal(goal: NewSavingsGoal): SavingsGoal {
  const created: SavingsGoal = {
    ...goal,
    id: newSavingsGoalId(),
    createdAt: new Date().toISOString(),
  };
  update((goals) => [created, ...goals]);
  return created;
}

export function updateSavingsGoal(id: string, changes: SavingsGoalChanges): void {
  update((goals) =>
    goals.map((goal) => (goal.id === id ? { ...goal, ...changes } : goal)),
  );
}

export function deleteSavingsGoal(id: string): void {
  update((goals) => goals.filter((goal) => goal.id !== id));
}

export function contributeToSavingsGoal(id: string, amount: string): void {
  update((goals) =>
    goals.map((goal) =>
      goal.id === id
        ? { ...goal, saved: toMoneyString(new Decimal(goal.saved).plus(amount)) }
        : goal,
    ),
  );
}
