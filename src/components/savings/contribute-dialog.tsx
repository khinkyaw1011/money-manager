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
import { siteConfig } from "@/config/site";
import type { SavingsGoal } from "@/features/savings/types";
import { formatMoney, MONEY_PATTERN, toMoneyString } from "@/lib/money";

const QUICK_AMOUNTS = ["1000", "5000", "10000"];

interface ContributeDialogProps {
  goal: SavingsGoal;
  onClose: () => void;
  onContribute: (amount: string) => void;
}

export function ContributeDialog({ goal, onClose, onContribute }: ContributeDialogProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fmt = (value: string) =>
    formatMoney(value, goal.currency, siteConfig.defaultLocale);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = amount.replace(/,/g, "").trim();
    if (!MONEY_PATTERN.test(clean) || !new Decimal(clean).greaterThan(0)) {
      setError("Enter a positive amount.");
      return;
    }
    onContribute(toMoneyString(clean));
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add funds</DialogTitle>
            <DialogDescription>
              {goal.name}: {fmt(goal.saved)} of {fmt(goal.target)} saved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="contribution-amount">Amount (JPY)</Label>
            <Input
              id="contribution-amount"
              name="amount"
              inputMode="decimal"
              placeholder="5000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setAmount(value)}
                >
                  {fmt(value)}
                </Button>
              ))}
            </div>
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
            <Button type="submit">Add funds</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
