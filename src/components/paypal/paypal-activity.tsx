import { Receipt, TrendingDown, TrendingUp } from "lucide-react";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { siteConfig } from "@/config/site";
import type {
  PayPalCurrencyTotal,
  PayPalDirection,
  PayPalTransaction,
} from "@/features/paypal/types";
import { formatMoney } from "@/lib/money";

const STATUS_LABELS: Record<string, string> = {
  S: "Completed",
  P: "Pending",
  V: "Reversed",
  D: "Denied",
};

const COPY = {
  INCOME: {
    title: "PayPal income",
    totalLabel: "Total income",
    rowLabel: "Income",
    sign: "+",
    tone: "text-income",
    empty: "No PayPal income found",
  },
  EXPENSE: {
    title: "PayPal transactions",
    totalLabel: "Total expenses",
    rowLabel: "Expense",
    sign: "−",
    tone: "text-expense",
    empty: "No PayPal expenses found",
  },
} as const;

function formatTransactionDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: siteConfig.timeZone,
  }).format(new Date(iso));
}

function statusBadge(status: string) {
  switch (status) {
    case "S":
      return <Badge variant="secondary">{STATUS_LABELS.S}</Badge>;
    case "P":
      return <Badge variant="outline">{STATUS_LABELS.P}</Badge>;
    case "D":
      return <Badge variant="destructive">{STATUS_LABELS.D}</Badge>;
    case "V":
      return <Badge variant="outline">{STATUS_LABELS.V}</Badge>;
    default:
      return <Badge variant="outline">{status || "Unknown"}</Badge>;
  }
}

function counterparty(transaction: PayPalTransaction): string {
  return transaction.payer
    ? `${transaction.description} · ${transaction.payer}`
    : transaction.description;
}

interface PayPalActivityProps {
  direction: PayPalDirection;
  transactions: PayPalTransaction[];
  totals: PayPalCurrencyTotal[];
  scanned: number;
  days: number;
  /** Hide the headline total tiles when another card already shows the total. */
  showTotals?: boolean;
}

/** Shared income / expense view over the PayPal Transaction Search feed. */
export function PayPalActivity({
  direction,
  transactions,
  totals,
  scanned,
  days,
  showTotals = true,
}: PayPalActivityProps) {
  const copy = COPY[direction];
  const Icon = direction === "INCOME" ? TrendingUp : TrendingDown;
  const iconClassName =
    direction === "INCOME" ? "text-income bg-income/10" : "text-expense bg-expense/10";
  const singleCurrency = totals.length === 1;
  const noun = direction === "INCOME" ? "income" : "expense";
  const countLabel = (count: number) =>
    direction === "INCOME"
      ? `${count} ${count === 1 ? "income transaction" : "income transactions"}`
      : `${count} ${count === 1 ? "expense" : "expenses"}`;
  const scannedNoun = scanned === 1 ? "transaction" : "transactions";

  return (
    <>
      {showTotals && (
        <section aria-label={`PayPal ${noun} totals`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {totals.length === 0 ? (
            <StatTile
              label={copy.totalLabel}
              value="—"
              icon={Icon}
              iconClassName={iconClassName}
              hint={`No ${noun} in the last ${days} days`}
            />
          ) : (
            totals.map((total) => (
              <StatTile
                key={total.currency}
                label={singleCurrency ? copy.totalLabel : `${copy.totalLabel} (${total.currency})`}
                value={formatMoney(total.total, total.currency, siteConfig.defaultLocale)}
                icon={Icon}
                iconClassName={iconClassName}
                hint={`${countLabel(total.count)} · last ${days} days`}
              />
            ))
          )}
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>
            {transactions.length === 0
              ? `No ${noun} found in ${scanned} PayPal ${scannedNoun} from the last ${days} days.`
              : `${countLabel(transactions.length)} from ${scanned} PayPal ${scannedNoun} in the last ${days} days.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
              <Receipt className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                {copy.empty}. Completed sandbox payments appear within a few hours.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground">
                      {formatTransactionDate(transaction.date)}
                    </TableCell>
                    <TableCell className="max-w-[22rem] truncate font-medium">
                      {counterparty(transaction)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{transaction.typeLabel}</TableCell>
                    <TableCell>{statusBadge(transaction.status)}</TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums whitespace-nowrap ${copy.tone}`}
                    >
                      <span className="sr-only">{copy.rowLabel} </span>
                      {copy.sign}
                      {formatMoney(
                        transaction.amount,
                        transaction.currency,
                        siteConfig.defaultLocale,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                {totals.map((total) => (
                  <TableRow key={total.currency}>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      {copy.totalLabel} ({total.currency}) · {total.count}{" "}
                      {total.count === 1 ? "transaction" : "transactions"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums whitespace-nowrap ${copy.tone}`}
                    >
                      {copy.sign}
                      {formatMoney(total.total, total.currency, siteConfig.defaultLocale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
