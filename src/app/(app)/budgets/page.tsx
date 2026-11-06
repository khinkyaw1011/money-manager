import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Budgets } from "@/components/budgets/budgets";
import { PageHeader } from "@/components/page-header";
import { createPayPalDataSource } from "@/features/dashboard/paypal-data-source";
import { getDashboardSummary } from "@/features/dashboard/service";
import type { DashboardSummary } from "@/features/dashboard/types";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let summary: DashboardSummary;
  try {
    summary = await getDashboardSummary(user.id, {
      source: createPayPalDataSource(),
    });
  } catch {
    summary = await getDashboardSummary(user.id);
  }

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Monthly spending limits and how much you can save."
      />
      <Budgets summary={summary} />
    </>
  );
}
