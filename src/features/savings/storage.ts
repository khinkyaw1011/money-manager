import type { SavingsGoal } from "./types";

export const SAVINGS_STORAGE_KEY = "money-manager:savings-goals:v1";

function isGoal(value: unknown): value is SavingsGoal {
  if (!value || typeof value !== "object") return false;
  const goal = value as Record<string, unknown>;
  return (
    typeof goal.id === "string" &&
    typeof goal.name === "string" &&
    typeof goal.target === "string" &&
    typeof goal.saved === "string" &&
    typeof goal.currency === "string" &&
    (goal.targetDate === null || typeof goal.targetDate === "string") &&
    typeof goal.createdAt === "string"
  );
}

export function readSavingsGoals(): SavingsGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isGoal) : [];
  } catch {
    return [];
  }
}

export function writeSavingsGoals(goals: SavingsGoal[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVINGS_STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // Quota or privacy mode — the UI still works for this session.
  }
}

export function newSavingsGoalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
