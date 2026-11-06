import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import type { RecentTransaction } from "@/features/dashboard/types";
import { formatShortDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function RecentTransactions({ items, currency }: { items: RecentTransaction[]; currency: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Your latest income and expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Receipt className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((t) => {
              const income = t.type === "INCOME";
              const Icon = income ? ArrowDownLeft : ArrowUpRight;
              return (
                <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className={cn(
                      "rounded-full p-2",
                      income ? "bg-income/10 text-income" : "bg-expense/10 text-expense",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description || t.categoryName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.categoryName} · {formatShortDate(t.date, siteConfig.timeZone)}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    <span className="sr-only">{income ? "Income" : "Expense"} </span>
                    {income ? "+" : "−"}
                    {formatMoney(t.amount, currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
