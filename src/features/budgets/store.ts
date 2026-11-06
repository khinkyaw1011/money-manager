import {
  BUDGETS_STORAGE_KEY,
  readBudgetLimits,
  writeBudgetLimits,
} from "./storage";
import { DEFAULT_BUDGET_LIMITS, type BudgetLimits } from "./types";

/** External store over localStorage, read with `useSyncExternalStore`. */

export interface BudgetSnapshot {
  limits: BudgetLimits;
  loaded: boolean;
}

const SERVER_SNAPSHOT: BudgetSnapshot = {
  limits: { ...DEFAULT_BUDGET_LIMITS },
  loaded: false,
};

let snapshot: BudgetSnapshot | undefined;
const listeners = new Set<() => void>();

function current(): BudgetSnapshot {
  if (!snapshot) snapshot = { limits: readBudgetLimits(), loaded: true };
  return snapshot;
}

export function getBudgetSnapshot(): BudgetSnapshot {
  return current();
}

export function getServerBudgetSnapshot(): BudgetSnapshot {
  return SERVER_SNAPSHOT;
}

function commit(limits: BudgetLimits): void {
  snapshot = { limits, loaded: true };
  writeBudgetLimits(limits);
  for (const listener of listeners) listener();
}

export function subscribeBudgets(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== BUDGETS_STORAGE_KEY) return;
    snapshot = { limits: readBudgetLimits(), loaded: true };
    for (const currentListener of listeners) currentListener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setBudgetLimits(limits: BudgetLimits): void {
  commit(limits);
}
