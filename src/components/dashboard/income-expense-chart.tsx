"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MoneyTooltip } from "@/components/dashboard/money-tooltip";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MonthlyPoint } from "@/features/dashboard/types";
import { formatCompactMoney, formatMonthKey } from "@/lib/format";
import { formatMoney } from "@/lib/money";

const config = {
  income: { label: "Income", color: "var(--chart-income)" },
  expenses: { label: "Expenses", color: "var(--chart-expense)" },
} satisfies ChartConfig;

const labels = { income: "Income", expenses: "Expenses" };

export function IncomeExpenseChart({ trend, currency }: { trend: MonthlyPoint[]; currency: string }) {
  // Strings → numbers only here, at the rendering edge (Recharts needs numbers).
  const data = trend.map((p) => ({ month: p.month, income: Number(p.income), expenses: Number(p.expenses) }));
  const isEmpty = data.every((d) => d.income === 0 && d.expenses === 0);

  return (
    <ChartCard
      title="Income vs expenses"
      description={`Last ${trend.length} months`}
      isEmpty={isEmpty}
      emptyText="No income or expenses recorded in the last 6 months."
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={data} barGap={2} barCategoryGap="28%" accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(k: string) => formatMonthKey(k)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => formatCompactMoney(v, currency)}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.4 }}
              content={(props) => (
                <MoneyTooltip
                  {...props}
                  currency={currency}
                  labels={labels}
                  formatLabel={(k) => formatMonthKey(k, "long")}
                />
              )}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      }
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trend.map((p) => (
              <TableRow key={p.month}>
                <TableCell>{formatMonthKey(p.month, "long")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(p.income, currency)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(p.expenses, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
