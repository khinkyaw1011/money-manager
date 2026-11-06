"use client";

import Decimal from "decimal.js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SavingsGoal } from "@/features/savings/types";
import { MONEY_PATTERN, toMoneyString } from "@/lib/money";

export interface GoalFormValues {
  name: string;
  target: string;
  saved: string;
  targetDate: string | null;
}

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null for a new goal, a goal for edit mode. */
  goal: SavingsGoal | null;
  onSubmit: (values: GoalFormValues) => void;
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  onSubmit,
}: GoalFormDialogProps) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target ?? "");
  const [saved, setSaved] = useState(goal?.saved ?? "0");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Enter a goal name.");
      return;
    }

    const cleanTarget = target.replace(/,/g, "").trim();
    if (!MONEY_PATTERN.test(cleanTarget) || !new Decimal(cleanTarget).greaterThan(0)) {
      setError("Enter a positive target amount.");
      return;
    }

    const cleanSaved = saved.replace(/,/g, "").trim() || "0";
    if (!MONEY_PATTERN.test(cleanSaved) || new Decimal(cleanSaved).isNegative()) {
      setError("Enter a valid amount already saved.");
      return;
    }

    onSubmit({
      name: name.trim(),
      target: toMoneyString(cleanTarget),
      saved: toMoneyString(cleanSaved),
      targetDate: targetDate || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{goal ? "Edit savings goal" : "Add savings goal"}</DialogTitle>
            <DialogDescription>
              Set a target and track how close you are.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input
              id="goal-name"
              name="name"
              placeholder="e.g. Emergency fund"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">Target amount (JPY)</Label>
            <Input
              id="goal-target"
              name="target"
              inputMode="decimal"
              placeholder="500000"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-saved">Already saved (JPY)</Label>
            <Input
              id="goal-saved"
              name="saved"
              inputMode="decimal"
              placeholder="0"
              value={saved}
              onChange={(event) => setSaved(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input
              id="goal-date"
              name="targetDate"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{goal ? "Save changes" : "Add goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
