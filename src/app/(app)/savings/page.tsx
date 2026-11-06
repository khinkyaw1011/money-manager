import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SavingsGoals } from "@/components/savings/savings-goals";

export const metadata: Metadata = { title: "Savings Goals" };

export default function SavingsPage() {
  return (
    <>
      <PageHeader
        title="Savings Goals"
        description="Set targets, add contributions and track your progress."
      />
      <SavingsGoals />
    </>
  );
}
