import type { Metadata } from "next";
import { Target } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return (
    <>
      <PageHeader
        title="Budgets"
        description="Monthly spending limits per category, with warnings before you overspend."
      />
      <EmptyState
        icon={Target}
        title="No budgets set"
        description="Set a monthly limit for a category and see how much is left at a glance."
      />
    </>
  );
}
