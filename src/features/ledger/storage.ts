import type { LedgerEntry, LedgerKind } from "./types";

/**
 * Manual entries live in localStorage until the database phase lands.
 * The key is versioned so a future migration can move stored data safely.
 */
export const LEDGER_STORAGE_KEY = "money-manager:ledger:v1";

function isEntry(value: unknown): value is LedgerEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    (entry.kind === "INCOME" || entry.kind === "EXPENSE") &&
    typeof entry.amount === "string" &&
    typeof entry.currency === "string" &&
    typeof entry.category === "string" &&
    typeof entry.description === "string" &&
    typeof entry.date === "string" &&
    typeof entry.createdAt === "string"
  );
}

export function readLedger(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function writeLedger(entries: LedgerEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota or privacy mode — the UI still works for this session.
  }
}

export function newLedgerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function splitByKind(entries: LedgerEntry[], kind: LedgerKind): LedgerEntry[] {
  return entries.filter((entry) => entry.kind === kind);
}
