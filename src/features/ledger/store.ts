import { LEDGER_STORAGE_KEY, newLedgerId, readLedger, writeLedger } from "./storage";
import type { LedgerEntry } from "./types";

/**
 * Tiny external store over localStorage so React reads it with
 * `useSyncExternalStore` (no setState-in-effect, and cross-tab updates work).
 */

export interface LedgerSnapshot {
  entries: LedgerEntry[];
  /** False during the server render; true once the browser store is read. */
  loaded: boolean;
}

const SERVER_SNAPSHOT: LedgerSnapshot = { entries: [], loaded: false };

let snapshot: LedgerSnapshot | undefined;
const listeners = new Set<() => void>();

function current(): LedgerSnapshot {
  if (!snapshot) snapshot = { entries: readLedger(), loaded: true };
  return snapshot;
}

export function getLedgerSnapshot(): LedgerSnapshot {
  return current();
}

export function getServerLedgerSnapshot(): LedgerSnapshot {
  return SERVER_SNAPSHOT;
}

function commit(entries: LedgerEntry[]): void {
  snapshot = { entries, loaded: true };
  writeLedger(entries);
  for (const listener of listeners) listener();
}

function update(updater: (entries: LedgerEntry[]) => LedgerEntry[]): void {
  commit(updater(current().entries));
}

export function subscribeLedger(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== LEDGER_STORAGE_KEY) return;
    snapshot = { entries: readLedger(), loaded: true };
    for (const currentListener of listeners) currentListener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export type NewLedgerEntry = Omit<LedgerEntry, "id" | "createdAt">;
export type LedgerChanges = Partial<Omit<LedgerEntry, "id" | "kind" | "createdAt">>;

export function addLedgerEntry(entry: NewLedgerEntry): LedgerEntry {
  const created: LedgerEntry = {
    ...entry,
    id: newLedgerId(),
    createdAt: new Date().toISOString(),
  };
  update((entries) => [created, ...entries]);
  return created;
}

export function updateLedgerEntry(id: string, changes: LedgerChanges): void {
  update((entries) =>
    entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
  );
}

export function deleteLedgerEntry(id: string): void {
  update((entries) => entries.filter((entry) => entry.id !== id));
}
