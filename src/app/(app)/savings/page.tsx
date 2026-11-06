import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Savings Goals" };

export default function SavingsPage() {
  return (
    <>
      <PageHeader
        title="Savings Goals"
        description="Set targets, add contributions and track your progress."
      />
      <EmptyState
        icon={PiggyBank}
        title="No savings goals yet"
        description="Create a goal, like an emergency fund or a trip, and track how close you are."
      />
    </>
  );
}
