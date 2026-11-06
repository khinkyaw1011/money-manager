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
import type { SavingsGoal } from "@/features/savings/types";
import { formatMoney } from "@/lib/money";

interface DeleteGoalDialogProps {
  goal: SavingsGoal | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteGoalDialog({ goal, onClose, onConfirm }: DeleteGoalDialogProps) {
  return (
    <AlertDialog open={goal !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this savings goal?</AlertDialogTitle>
          <AlertDialogDescription>
            {goal
              ? `${goal.name} · ${formatMoney(
                  goal.saved,
                  goal.currency,
                  siteConfig.defaultLocale,
                )} of ${formatMoney(
                  goal.target,
                  goal.currency,
                  siteConfig.defaultLocale,
                )}. This cannot be undone.`
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
