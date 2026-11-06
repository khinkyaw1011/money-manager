"use client";

import Decimal from "decimal.js";
import { PiggyBank, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import type { SavingsGoal } from "@/features/savings/types";
import { useSavingsGoals } from "@/hooks/use-savings-goals";
import { formatMoney } from "@/lib/money";
import { ContributeDialog } from "./contribute-dialog";
import { DeleteGoalDialog } from "./delete-goal-dialog";
import { GoalCard } from "./goal-card";
import { GoalFormDialog, type GoalFormValues } from "./goal-form-dialog";

export function SavingsGoals() {
  const { goals, loaded, addGoal, updateGoal, deleteGoal, contribute } =
    useSavingsGoals();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);

  const fmt = (value: Decimal | string) =>
    formatMoney(value, "JPY", siteConfig.defaultLocale);

  const totals = useMemo(() => {
    let saved = new Decimal(0);
    let target = new Decimal(0);
    for (const goal of goals) {
      saved = saved.plus(goal.saved);
      target = target.plus(goal.target);
    }
    const percent = target.isZero()
      ? new Decimal(0)
      : saved.div(target).times(100).toDecimalPlaces(1);
    return { saved, target, percent };
  }, [goals]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(goal: SavingsGoal) {
    setEditing(goal);
    setFormOpen(true);
  }

  function handleSubmit(values: GoalFormValues) {
    if (editing) {
      updateGoal(editing.id, values);
      toast.success("Savings goal updated");
      setEditing(null);
    } else {
      addGoal({ ...values, currency: "JPY" });
      toast.success("Savings goal added");
    }
  }

  function handleContribute(goal: SavingsGoal, amount: string) {
    contribute(goal.id, amount);
    toast.success(`${fmt(amount)} added to ${goal.name}`);
  }

  function handleDelete() {
    if (!deleting) return;
    deleteGoal(deleting.id);
    toast.success("Savings goal deleted");
    setDeleting(null);
  }

  if (!loaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create a goal, like an emergency fund or a trip, and track how close you are."
          action={
            <Button size="sm" onClick={openAdd}>
              <Plus aria-hidden />
              Add goal
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Savings progress</CardTitle>
                <CardDescription>Total saved across all goals.</CardDescription>
              </div>
              <Button size="sm" onClick={openAdd}>
                <Plus aria-hidden />
                Add goal
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {fmt(totals.saved)}
                </p>
                <p className="text-sm text-muted-foreground">of {fmt(totals.target)}</p>
              </div>
              <Progress
                value={Math.min(100, Math.max(0, Number(totals.percent)))}
                className="h-2"
                indicatorClassName="bg-savings"
                aria-label="Overall savings progress"
                aria-valuetext={`${totals.percent.toFixed(1)}% saved`}
              />
              <p className="text-sm text-muted-foreground">
                {totals.percent.toFixed(1)}% of all goals
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEdit(goal)}
                onContribute={() => setContributing(goal)}
                onDelete={() => setDeleting(goal)}
              />
            ))}
          </div>
        </>
      )}

      {formOpen && (
        <GoalFormDialog
          key={editing?.id ?? "new"}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          goal={editing}
          onSubmit={handleSubmit}
        />
      )}

      {contributing && (
        <ContributeDialog
          key={contributing.id}
          goal={contributing}
          onClose={() => setContributing(null)}
          onContribute={(amount) => handleContribute(contributing, amount)}
        />
      )}

      <DeleteGoalDialog
        goal={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
