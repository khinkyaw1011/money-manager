"use client";

import Decimal from "decimal.js";
import { Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { siteConfig } from "@/config/site";
import { categoriesFor, type LedgerEntry, type LedgerKind } from "@/features/ledger/types";
import { splitByKind } from "@/features/ledger/storage";
import type { PayPalCurrencyTotal } from "@/features/paypal/types";
import { useLedger } from "@/hooks/use-ledger";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DeleteEntryDialog } from "./delete-entry-dialog";
import { EntryFormDialog, type LedgerFormValues } from "./entry-form-dialog";

function formatEntryDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

interface LedgerSectionProps {
  kind: LedgerKind;
  /** Connected totals (e.g. PayPal) included in the card's grand total. */
  externalTotals?: PayPalCurrencyTotal[];
  /** Shown under the total when there is no connected activity. */
  externalEmptyHint?: string;
}

export function LedgerSection({
  kind,
  externalTotals = [],
  externalEmptyHint,
}: LedgerSectionProps) {
  const { entries, loaded, addEntry, updateEntry, deleteEntry } = useLedger();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const [deleting, setDeleting] = useState<LedgerEntry | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");

  const noun = kind === "INCOME" ? "income" : "expense";
  const label = kind === "INCOME" ? "Income" : "Expense";
  const sign = kind === "INCOME" ? "+" : "−";

  const kindEntries = useMemo(() => splitByKind(entries, kind), [entries, kind]);

  const categoryOptions = useMemo(() => {
    const presets: readonly string[] = categoriesFor(kind);
    const custom = [...new Set(kindEntries.map((entry) => entry.category))]
      .filter((name) => !presets.includes(name))
      .sort((a, b) => a.localeCompare(b));
    return [...presets, ...custom];
  }, [kind, kindEntries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return kindEntries
      .filter((entry) => {
        if (categoryFilter !== "all" && entry.category !== categoryFilter) return false;
        if (monthFilter && !entry.date.startsWith(monthFilter)) return false;
        if (query) {
          const haystack = `${entry.category} ${entry.description}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      );
  }, [kindEntries, search, categoryFilter, monthFilter]);

  const totals = useMemo(() => {
    const byCurrency = new Map<string, Decimal>();
    for (const entry of filtered) {
      byCurrency.set(
        entry.currency,
        (byCurrency.get(entry.currency) ?? new Decimal(0)).plus(entry.amount),
      );
    }
    return [...byCurrency.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const hasFilters = search.trim() !== "" || categoryFilter !== "all" || monthFilter !== "";

  // Grand total = manual rows + connected totals. While filtering, only the
  // filtered manual rows are summed so the number matches the visible table.
  const combinedTotals = useMemo(() => {
    const byCurrency = new Map<string, Decimal>();
    for (const [currency, total] of totals) byCurrency.set(currency, total);
    if (!hasFilters) {
      for (const total of externalTotals) {
        byCurrency.set(
          total.currency,
          (byCurrency.get(total.currency) ?? new Decimal(0)).plus(total.total),
        );
      }
    }
    return [...byCurrency.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [totals, externalTotals, hasFilters]);

  const externalCount = hasFilters
    ? 0
    : externalTotals.reduce((count, total) => count + total.count, 0);
  const totalText =
    combinedTotals.length === 0
      ? "—"
      : combinedTotals
          .map(
            ([currency, total]) =>
              `${sign}${formatMoney(total, currency, siteConfig.defaultLocale)}`,
          )
          .join(" · ");

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: LedgerEntry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setMonthFilter("");
  }

  function handleSubmit(values: LedgerFormValues) {
    if (editing) {
      updateEntry(editing.id, values);
      toast.success(`${label} updated`);
    } else {
      addEntry({ kind, ...values });
      toast.success(`${label} added`);
    }
    setEditing(null);
  }

  function handleDelete() {
    if (!deleting) return;
    deleteEntry(deleting.id);
    toast.success(`${label} deleted`);
    setDeleting(null);
  }

  if (!loaded) {
    return <Skeleton className="h-72 rounded-xl" aria-label={`Loading manual ${noun}`} />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Manual {noun}</CardTitle>
            <CardDescription>
              {kind === "INCOME"
                ? "Salary, freelance, business and other income."
                : "Food, rent, utilities, cosmetics, traffic, healthcare, entertainment and custom categories."}{" "}
              Saved in this browser.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus aria-hidden />
            Add {noun}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  name="ledger-search"
                  className="pl-8"
                  placeholder={`Search ${noun}`}
                  aria-label={`Search ${noun}`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Filter by category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="month"
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                aria-label="Filter by month"
                className="w-full sm:w-40"
              />
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              {hasFilters ? " (filtered)" : ""}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
              <Receipt className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                {kindEntries.length === 0
                  ? `No manual ${noun} yet. Add your first entry.`
                  : "No entries match your filters."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={kindEntries.length === 0 ? openAdd : clearFilters}
              >
                {kindEntries.length === 0 ? (
                  <>
                    <Plus aria-hidden />
                    Add {noun}
                  </>
                ) : (
                  "Clear filters"
                )}
              </Button>
            </div>
          ) : (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-20">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatEntryDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[20rem] truncate">
                        {entry.description || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums whitespace-nowrap",
                          kind === "INCOME" ? "text-income" : "text-expense",
                        )}
                      >
                        <span className="sr-only">{label} </span>
                        {sign}
                        {formatMoney(entry.amount, entry.currency, siteConfig.defaultLocale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${entry.category} entry`}
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${entry.category} entry`}
                            onClick={() => setDeleting(entry)}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          )}

          <div className="flex flex-col gap-1 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">
                {hasFilters
                  ? "Filtered manual total"
                  : kind === "INCOME"
                    ? "Total income"
                    : "Total expenses"}
              </p>
              {!hasFilters && externalCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {filtered.length} manual · {externalCount} PayPal
                </p>
              )}
              {!hasFilters && externalCount === 0 && externalEmptyHint && (
                <p className="text-xs text-muted-foreground">{externalEmptyHint}</p>
              )}
            </div>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                kind === "INCOME" ? "text-income" : "text-expense",
              )}
            >
              {totalText}
            </p>
          </div>
        </CardContent>
      </Card>

      {dialogOpen && (
        <EntryFormDialog
          key={editing?.id ?? "new"}
          kind={kind}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          entry={editing}
          categories={categoryOptions}
          onSubmit={handleSubmit}
        />
      )}

      <DeleteEntryDialog
        entry={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
