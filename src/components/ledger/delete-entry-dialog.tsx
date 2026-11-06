"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { siteConfig } from "@/config/site";
import type { LedgerEntry } from "@/features/ledger/types";
import { formatMoney } from "@/lib/money";

interface DeleteEntryDialogProps {
  entry: LedgerEntry | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteEntryDialog({ entry, onClose, onConfirm }: DeleteEntryDialogProps) {
  return (
    <AlertDialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            {entry
              ? `${entry.category} · ${formatMoney(
                  entry.amount,
                  entry.currency,
                  siteConfig.defaultLocale,
                )} on ${entry.date}. This cannot be undone.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
