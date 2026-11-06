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
import {
  BUDGET_CATEGORIES,
  type BudgetLimits,
} from "@/features/budgets/types";
import { MONEY_PATTERN, toMoneyString } from "@/lib/money";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limits: BudgetLimits;
  onSubmit: (limits: BudgetLimits) => void;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  limits,
  onSubmit,
}: BudgetFormDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      BUDGET_CATEGORIES.map((category) => {
        const value = limits[category.label] ?? "0.00";
        return [category.label, value === "0.00" ? "" : value];
      }),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const next: BudgetLimits = {};
    for (const category of BUDGET_CATEGORIES) {
      const clean = (values[category.label] ?? "").replace(/,/g, "").trim();
      if (clean === "") {
        next[category.label] = "0.00";
        continue;
      }
      if (!MONEY_PATTERN.test(clean) || new Decimal(clean).isNegative()) {
        setError(`Enter a valid limit for ${category.label}.`);
        return;
      }
      next[category.label] = toMoneyString(clean);
    }

    onSubmit(next);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Monthly limits</DialogTitle>
            <DialogDescription>
              Set a monthly spending limit for each category.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {BUDGET_CATEGORIES.map((category) => (
              <div key={category.label} className="space-y-2">
                <Label htmlFor={`budget-${category.key}`}>{category.label}</Label>
                <Input
                  id={`budget-${category.key}`}
                  name={category.key}
                  inputMode="decimal"
                  placeholder="0"
                  value={values[category.label] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [category.label]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
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
            <Button type="submit">Save limits</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
