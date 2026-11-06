"use client";

import Decimal from "decimal.js";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import type { PayPalCurrencyTotal, PayPalDirection } from "@/features/paypal/types";
import { useLedger } from "@/hooks/use-ledger";
import { formatMoney } from "@/lib/money";

const COPY = {
  INCOME: {
    label: "Total income",
    empty: "No income",
    icon: TrendingUp,
    tone: "text-income bg-income/10",
  },
  EXPENSE: {
    label: "Total expenses",
    empty: "No expense",
    icon: TrendingDown,
    tone: "text-expense bg-expense/10",
  },
} as const;

interface TotalActivityCardProps {
  direction: PayPalDirection;
  /** Connected totals (PayPal) for the current window. */
  paypalTotals: PayPalCurrencyTotal[];
  /** PayPal search window, shown in the hint. */
  days: number;
}

/**
 * One total per currency: manual entries plus PayPal transactions. Currencies
 * are never added together without an exchange rate.
 */
export function TotalActivityCard({
  direction,
  paypalTotals,
  days,
}: TotalActivityCardProps) {
  const { entries, loaded } = useLedger();
  const copy = COPY[direction];
  const Icon = copy.icon;

  const totals = useMemo(() => {
    const byCurrency = new Map<
      string,
      { total: Decimal; manualCount: number; paypalCount: number }
    >();

    for (const entry of entries) {
      if (entry.kind !== direction) continue;
      const current = byCurrency.get(entry.currency) ?? {
        total: new Decimal(0),
        manualCount: 0,
        paypalCount: 0,
      };
      current.total = current.total.plus(entry.amount);
      current.manualCount += 1;
      byCurrency.set(entry.currency, current);
    }

    for (const paypal of paypalTotals) {
      const current = byCurrency.get(paypal.currency) ?? {
        total: new Decimal(0),
        manualCount: 0,
        paypalCount: 0,
      };
      current.total = current.total.plus(paypal.total);
      current.paypalCount += paypal.count;
      byCurrency.set(paypal.currency, current);
    }

    return [...byCurrency.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [entries, direction, paypalTotals]);

  if (!loaded) {
    return <Skeleton className="h-32 rounded-xl" aria-label={`Loading ${copy.label}`} />;
  }

  const singleCurrency = totals.length === 1;
  const isExpense = direction === "EXPENSE";
  const valueClass = isExpense ? "text-expense" : undefined;
  const amountLabel = (amount: Decimal | string, currency: string) => {
    const formatted = formatMoney(amount, currency, siteConfig.defaultLocale);
    return isExpense && new Decimal(amount).greaterThan(0) ? `−${formatted}` : formatted;
  };

  return (
    <section aria-label={copy.label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {totals.length === 0 ? (
        <StatTile
          label={copy.label}
          value="—"
          icon={Icon}
          iconClassName={copy.tone}
          valueClassName={valueClass}
          hint={`${copy.empty} in the last ${days} days`}
        />
      ) : (
        totals.map(([currency, total]) => (
          <StatTile
            key={currency}
            label={singleCurrency ? copy.label : `${copy.label} (${currency})`}
            value={amountLabel(total.total, currency)}
            icon={Icon}
            iconClassName={copy.tone}
            valueClassName={valueClass}
            hint={`${total.manualCount} manual · ${total.paypalCount} PayPal (last ${days} days)`}
          />
        ))
      )}
    </section>
  );
}
