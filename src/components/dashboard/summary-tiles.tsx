"use client";

import Decimal from "decimal.js";
import { PiggyBank, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import { StatTile } from "@/components/dashboard/stat-tile";
import { siteConfig } from "@/config/site";
import type { DashboardSummary } from "@/features/dashboard/types";
import { useLedger } from "@/hooks/use-ledger";
import { formatMoney, toMoneyString } from "@/lib/money";

export function SummaryTiles({ summary }: { summary: DashboardSummary }) {
  const fmt = (value: string) => formatMoney(value, summary.currency);
  const { entries } = useLedger();

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

  /**
   * Total income and total expenses for the current month:
   * PayPal activity for the month plus manual entries in the display currency.
   */
  const monthly = useMemo(() => {
    let manualIncome = new Decimal(0);
    let manualExpenses = new Decimal(0);

    for (const entry of entries) {
      if (entry.currency !== summary.currency) continue;
      if (!entry.date.startsWith(currentMonth.key)) continue;
      if (entry.kind === "INCOME") manualIncome = manualIncome.plus(entry.amount);
      else manualExpenses = manualExpenses.plus(entry.amount);
    }

    const paypalCurrent =
      summary.trend[summary.trend.length - 1] ?? { income: "0.00", expenses: "0.00" };
    const income = new Decimal(paypalCurrent.income).plus(manualIncome);
    const expenses = new Decimal(paypalCurrent.expenses).plus(manualExpenses);

    return {
      income: toMoneyString(income),
      expenses: toMoneyString(expenses),
      remaining: toMoneyString(income.minus(expenses)),
    };
  }, [entries, summary.currency, summary.trend, currentMonth.key]);

  const savingsNegative = new Decimal(monthly.remaining).isNegative();

  return (
    <section aria-label="Monthly summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatTile
        label="Total balance"
        value={fmt(summary.totalBalance)}
        icon={Wallet}
        iconClassName="text-primary bg-primary/10"
        hint="Income minus expenses"
      />
      <StatTile
        label="Monthly income"
        value={fmt(monthly.income)}
        icon={TrendingUp}
        iconClassName="text-income bg-income/10"
        hint={currentMonth.label}
      />
      <StatTile
        label="Monthly expenses"
        value={fmt(monthly.expenses)}
        icon={TrendingDown}
        iconClassName="text-expense bg-expense/10"
        hint={currentMonth.label}
      />
      <StatTile
        label="Monthly savings"
        value={fmt(monthly.remaining)}
        icon={PiggyBank}
        iconClassName="text-savings bg-savings/10"
        hint={savingsNegative ? "Spending exceeded income this month" : "Income minus expenses"}
      />
      <StatTile
        label="Remaining budget"
        value={fmt(monthly.remaining)}
        icon={Target}
        iconClassName="text-warning bg-warning/10"
        hint={
          savingsNegative
            ? "Expenses exceed income this month"
            : "Total income − total expenses"
        }
      />
    </section>
  );
}
