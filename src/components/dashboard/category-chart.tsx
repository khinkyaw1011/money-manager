"use client";

import Decimal from "decimal.js";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MoneyTooltip } from "@/components/dashboard/money-tooltip";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CategoryPoint } from "@/features/dashboard/types";
import { formatMonthKey } from "@/lib/format";
import { formatMoney, toMoneyString } from "@/lib/money";

const MAX_BARS = 6;

const config = {
  amount: { label: "Spent", color: "var(--chart-expense)" },
} satisfies ChartConfig;

/** Keep the top categories; fold the rest into "Other" so bars stay readable. */
function foldCategories(items: CategoryPoint[]): CategoryPoint[] {
  if (items.length <= MAX_BARS) return items;
  const head = items.slice(0, MAX_BARS - 1);
  const rest = items.slice(MAX_BARS - 1).reduce((acc, c) => acc.plus(c.amount), new Decimal(0));
  return [...head, { category: "Other", amount: toMoneyString(rest) }];
}

interface CategoryChartProps {
  items: CategoryPoint[];
  month: string;
  currency: string;
}

export function CategoryChart({ items, month, currency }: CategoryChartProps) {
  const folded = foldCategories(items);
  const data = folded.map((c) => ({ category: c.category, amount: Number(c.amount) }));

  return (
    <ChartCard
      title="Spending by category"
      description={formatMonthKey(month, "long")}
      isEmpty={data.length === 0}
      emptyText="No expenses recorded this month."
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={data} layout="vertical" margin={{ right: 72 }} accessibilityLayer>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              width={96}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.4 }}
              content={(props) => <MoneyTooltip {...props} currency={currency} labels={{ amount: "Spent" }} />}
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} barSize={18}>
              <LabelList
                dataKey="amount"
                position="right"
                className="fill-foreground"
                fontSize={12}
                formatter={(v: unknown) => formatMoney(String(v), currency)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.category}>
                <TableCell>{c.category}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(c.amount, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
