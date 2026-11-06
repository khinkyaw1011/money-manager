"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addLedgerEntry,
  deleteLedgerEntry,
  getLedgerSnapshot,
  getServerLedgerSnapshot,
  subscribeLedger,
  updateLedgerEntry,
  type LedgerChanges,
  type NewLedgerEntry,
} from "@/features/ledger/store";

export type { LedgerChanges, NewLedgerEntry } from "@/features/ledger/store";

/**
 * Reads/writes the browser-persisted manual ledger. Kept client-side until the
 * database phase lands, and kept in sync across open tabs.
 */
export function useLedger() {
  const snapshot = useSyncExternalStore(
    subscribeLedger,
    getLedgerSnapshot,
    getServerLedgerSnapshot,
  );

  const addEntry = useCallback((entry: NewLedgerEntry) => addLedgerEntry(entry), []);
  const updateEntry = useCallback(
    (id: string, changes: LedgerChanges) => updateLedgerEntry(id, changes),
    [],
  );
  const deleteEntry = useCallback((id: string) => deleteLedgerEntry(id), []);

  return {
    entries: snapshot.entries,
    loaded: snapshot.loaded,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
