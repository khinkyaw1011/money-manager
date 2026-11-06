"use client";

import Decimal from "decimal.js";
import {
  CalendarRange,
  Car,
  Droplets,
  Flame,
  Home,
  PiggyBank,
  Receipt,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import {
  BUDGET_CATEGORIES,
  type BudgetLimits,
} from "@/features/budgets/types";
import type { DashboardSummary } from "@/features/dashboard/types";
import { useBudgets } from "@/hooks/use-budgets";
import { useLedger } from "@/hooks/use-ledger";
import { formatMoney, toMoneyString } from "@/lib/money";
import { BudgetCard } from "./budget-card";
import { BudgetFormDialog } from "./budget-form-dialog";

const ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  rent: Home,
  water: Droplets,
  gas: Flame,
  electric: Zap,
  cosmetics: Sparkles,
  traffic: Car,
};

export function Budgets({ summary }: { summary: DashboardSummary }) {
  const { limits, loaded, saveLimits } = useBudgets();
  const { entries, loaded: ledgerLoaded } = useLedger();
  const [formOpen, setFormOpen] = useState(false);

  const currency = siteConfig.defaultCurrency;

  const currentMonth = useMemo(() => {
    const now = new Date();
    return {
      key: new Intl.DateTimeFormat("en-CA", {
        timeZone: siteConfig.timeZone,
        year: "numeric",
        month: "2-digit",
      }).format(now),
      label: new Intl.DateTimeFormat("en-US", {
        timeZone: siteConfig.timeZone,
        month: "long",
        year: "numeric",
      }).format(now),
    };
  }, []);

  const data = useMemo(() => {
    let manualIncome = new Decimal(0);
    let spentThisMonth = new Decimal(0);
    const spentByCategory = new Map<string, Decimal>();
    for (const category of BUDGET_CATEGORIES) {
      spentByCategory.set(category.label, new Decimal(0));
    }

    for (const entry of entries) {
      if (entry.currency !== currency || !entry.date.startsWith(currentMonth.key)) {
        continue;
      }
      if (entry.kind === "INCOME") {
        manualIncome = manualIncome.plus(entry.amount);
        continue;
      }

      spentThisMonth = spentThisMonth.plus(entry.amount);
      const category = BUDGET_CATEGORIES.find((item) =>
        item.aliases.includes(entry.category),
      );
      if (!category) continue;
      spentByCategory.set(
        category.label,
        (spentByCategory.get(category.label) ?? new Decimal(0)).plus(entry.amount),
      );
    }

    let totalBudget = new Decimal(0);
    const limitByCategory = new Map<string, string>();
    for (const category of BUDGET_CATEGORIES) {
      const limit = limits[category.label] ?? "0.00";
      limitByCategory.set(category.label, limit);
      totalBudget = totalBudget.plus(limit);
    }

    const paypalCurrent =
      summary.trend[summary.trend.length - 1] ?? { income: "0.00", expenses: "0.00" };
    const monthlyIncome = new Decimal(paypalCurrent.income).plus(manualIncome);
    // Savings are based on actual spending, not on the limits.
    const monthlySaving = monthlyIncome.minus(spentThisMonth);

    return {
      monthlyIncome,
      spentThisMonth,
      totalBudget,
      monthlySaving,
      yearlySaving: monthlySaving.times(12),
      spentByCategory,
      limitByCategory,
    };
  }, [entries, limits, summary.trend, currentMonth.key, currency]);

  const fmt = (value: Decimal | string) =>
    formatMoney(value, currency, siteConfig.defaultLocale);

  function handleSave(next: BudgetLimits) {
    saveLimits(next);
    toast.success("Monthly limits saved");
  }

  if (!loaded || !ledgerLoaded) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <section
        aria-label="Monthly budget summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatTile
          label="Monthly income"
          value={fmt(data.monthlyIncome)}
          icon={TrendingUp}
          iconClassName="text-income bg-income/10"
          hint={currentMonth.label}
        />
        <StatTile
          label="Monthly budget"
          value={fmt(data.totalBudget)}
          icon={Target}
          iconClassName="text-warning bg-warning/10"
          hint="Sum of category limits"
        />
        <StatTile
          label="Spent this month"
          value={
            data.spentThisMonth.greaterThan(0)
              ? `−${fmt(data.spentThisMonth)}`
              : fmt("0")
          }
          icon={Receipt}
          iconClassName="text-expense bg-expense/10"
          valueClassName="text-expense"
          hint={currentMonth.label}
        />
        <StatTile
          label="Can save / month"
          value={fmt(data.monthlySaving)}
          icon={PiggyBank}
          iconClassName="text-savings bg-savings/10"
          hint={
            data.monthlySaving.isNegative()
              ? "Spending exceeds income"
              : "Income minus spending"
          }
        />
        <StatTile
          label="Can save / year"
          value={fmt(data.yearlySaving)}
          icon={CalendarRange}
          iconClassName="text-primary bg-primary/10"
          hint="Monthly savings × 12"
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Monthly limits</h2>
          <p className="text-sm text-muted-foreground">
            Set how much you can spend in each category.
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Target aria-hidden />
          Set limits
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BUDGET_CATEGORIES.map((category) => (
          <BudgetCard
            key={category.key}
            category={category}
            icon={ICONS[category.key] ?? Target}
            limit={data.limitByCategory.get(category.label) ?? "0.00"}
            spent={toMoneyString(data.spentByCategory.get(category.label) ?? 0)}
            currency={currency}
          />
        ))}
      </div>

      {formOpen && (
        <BudgetFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          limits={limits}
          onSubmit={handleSave}
        />
      )}
    </>
  );
}
