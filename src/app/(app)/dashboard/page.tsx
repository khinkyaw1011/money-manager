import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryTiles } from "@/components/dashboard/summary-tiles";
import { PageHeader } from "@/components/page-header";
import { PayPalErrorCard } from "@/components/paypal/paypal-error-card";
import { createPayPalDataSource } from "@/features/dashboard/paypal-data-source";
import { getDashboardSummary } from "@/features/dashboard/service";
import type { DashboardSummary } from "@/features/dashboard/types";
import type { PayPalErrorInfo } from "@/features/paypal/types";
import { getSessionUser } from "@/lib/session";
import { PayPalIntegrationError } from "@/server/integrations/paypal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Authorization lives next to the data read, not only in the layout.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let summary: DashboardSummary;
  let paypalError: PayPalErrorInfo | null = null;

  try {
    summary = await getDashboardSummary(user.id, { source: createPayPalDataSource() });
  } catch (cause) {
    if (cause instanceof PayPalIntegrationError) {
      paypalError = {
        code: cause.code,
        message: cause.message,
        status: cause.status,
        debugId: cause.debugId,
      };
    } else {
      paypalError = {
        code: "API_ERROR",
        message: "Unexpected error while loading PayPal activity.",
      };
    }
    summary = await getDashboardSummary(user.id);
  }

  const firstName = user.name?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Your balance, income, expenses and savings. PayPal amounts are converted to JPY."
      />
      {paypalError && <PayPalErrorCard error={paypalError} />}
      <SummaryTiles summary={summary} />
      <div className="grid gap-4 lg:grid-cols-2">
        <IncomeExpenseChart trend={summary.trend} currency={summary.currency} />
        <CategoryChart items={summary.expensesByCategory} month={summary.month} currency={summary.currency} />
      </div>
      <RecentTransactions items={summary.recentTransactions} currency={summary.currency} />
    </>
  );
}
