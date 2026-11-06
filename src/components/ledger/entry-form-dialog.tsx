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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import type { LedgerEntry, LedgerKind } from "@/features/ledger/types";
import { CUSTOM_CATEGORY } from "@/features/ledger/types";
import { MONEY_PATTERN, toMoneyString } from "@/lib/money";

export interface LedgerFormValues {
  amount: string;
  currency: string;
  category: string;
  description: string;
  date: string;
}

interface EntryFormDialogProps {
  kind: LedgerKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null for a new entry, an entry for edit mode. */
  entry: LedgerEntry | null;
  /** Preset + existing custom categories. */
  categories: string[];
  onSubmit: (values: LedgerFormValues) => void;
}

function todayInAppZone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: siteConfig.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function EntryFormDialog({
  kind,
  open,
  onOpenChange,
  entry,
  categories,
  onSubmit,
}: EntryFormDialogProps) {
  const noun = kind === "INCOME" ? "income" : "expense";
  const [amount, setAmount] = useState(entry?.amount ?? "");
  const [currency] = useState<string>(
    entry?.currency ?? siteConfig.defaultCurrency,
  );
  const [category, setCategory] = useState<string>(
    entry?.category ?? categories[0] ?? CUSTOM_CATEGORY,
  );
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState(entry?.date ?? todayInAppZone());
  const [description, setDescription] = useState(entry?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const cleanAmount = amount.replace(/,/g, "").trim();
    if (!MONEY_PATTERN.test(cleanAmount) || !new Decimal(cleanAmount).greaterThan(0)) {
      setError("Enter a positive amount with up to 2 decimal places.");
      return;
    }

    const chosenCategory = category === CUSTOM_CATEGORY ? customCategory.trim() : category;
    if (!chosenCategory) {
      setError("Choose a category or type a custom one.");
      return;
    }

    if (!date) {
      setError("Choose a date.");
      return;
    }

    onSubmit({
      amount: toMoneyString(cleanAmount),
      currency,
      category: chosenCategory,
      description: description.trim(),
      date,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{entry ? `Edit ${noun}` : `Add ${noun}`}</DialogTitle>
            <DialogDescription>
              {entry
                ? `Update this ${noun} entry.`
                : `Record ${noun === "income" ? "money you received" : "money you spent"}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="entry-amount">Amount (JPY)</Label>
            <Input
              id="entry-amount"
              name="amount"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-category">Category</Label>
            <Select name="category" value={category} onValueChange={setCategory}>
              <SelectTrigger id="entry-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_CATEGORY}>Custom category…</SelectItem>
              </SelectContent>
            </Select>
            {category === CUSTOM_CATEGORY && (
              <Input
                name="customCategory"
                placeholder="Custom category name"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                autoFocus
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-date">Date</Label>
            <Input
              id="entry-date"
              name="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-description">Description (optional)</Label>
            <Textarea
              id="entry-description"
              name="description"
              rows={2}
              placeholder="e.g. October salary"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
            <Button type="submit">{entry ? "Save changes" : `Add ${noun}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
