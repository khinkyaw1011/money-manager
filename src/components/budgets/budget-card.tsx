import Decimal from "decimal.js";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { siteConfig } from "@/config/site";
import type { BudgetCategory } from "@/features/budgets/types";
import { formatMoney } from "@/lib/money";

interface BudgetCardProps {
  category: BudgetCategory;
  icon: LucideIcon;
  /** Monthly limit, decimal string. */
  limit: string;
  /** Spending this month, decimal string. */
  spent: string;
  currency: string;
}

export function BudgetCard({
  category,
  icon: Icon,
  limit,
  spent,
  currency,
}: BudgetCardProps) {
  const limitAmount = new Decimal(limit);
  const spentAmount = new Decimal(spent);
  const hasLimit = limitAmount.greaterThan(0);
  const over = hasLimit && spentAmount.greaterThan(limitAmount);
  const percent = hasLimit
    ? spentAmount.div(limitAmount).times(100).toDecimalPlaces(1)
    : new Decimal(0);
  const barValue = Math.min(100, Math.max(0, Number(percent)));
  const remaining = limitAmount.minus(spentAmount);
  const fmt = (value: Decimal | string) =>
    formatMoney(value, currency, siteConfig.defaultLocale);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <span className="rounded-md bg-savings/10 p-1.5 text-savings">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="truncate">{category.label}</span>
        </CardTitle>
        {!hasLimit ? (
          <Badge variant="outline">No limit</Badge>
        ) : over ? (
          <Badge variant="destructive">Over budget</Badge>
        ) : (
          <Badge variant="outline">{percent.toFixed(0)}%</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold tracking-tight text-expense tabular-nums">
            {spentAmount.greaterThan(0) ? `−${fmt(spentAmount)}` : fmt("0")}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasLimit ? `of ${fmt(limitAmount)}` : "no monthly limit"}
          </p>
        </div>

        <Progress
          value={barValue}
          className="h-2"
          indicatorClassName={over ? "bg-expense" : "bg-savings"}
          aria-label={`${category.label} budget use`}
          aria-valuetext={`${percent.toFixed(1)}% used`}
        />

        <p className="text-xs text-muted-foreground">
          {!hasLimit
            ? "Set a monthly limit to track this category."
            : over
              ? `${fmt(remaining.abs())} over budget`
              : `${fmt(remaining)} left`}
          {hasLimit && (
            <>
              <span className="mx-1">·</span>
              {percent.toFixed(1)}% used
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
