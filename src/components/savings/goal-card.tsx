import Decimal from "decimal.js";
import {
  CalendarDays,
  CheckCircle2,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { siteConfig } from "@/config/site";
import type { SavingsGoal } from "@/features/savings/types";
import { formatMoney } from "@/lib/money";

interface GoalCardProps {
  goal: SavingsGoal;
  onEdit: () => void;
  onContribute: () => void;
  onDelete: () => void;
}

function formatTargetDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function GoalCard({ goal, onEdit, onContribute, onDelete }: GoalCardProps) {
  const target = new Decimal(goal.target);
  const saved = new Decimal(goal.saved);
  const remaining = target.minus(saved);
  const completed = saved.greaterThanOrEqualTo(target);
  const percent = target.isZero()
    ? new Decimal(0)
    : saved.div(target).times(100).toDecimalPlaces(1);
  const barValue = Math.min(100, Math.max(0, Number(percent)));
  const fmt = (value: Decimal | string) =>
    formatMoney(value, goal.currency, siteConfig.defaultLocale);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2">
            <span className="rounded-md bg-savings/10 p-1.5 text-savings">
              <PiggyBank className="size-4" aria-hidden />
            </span>
            <span className="truncate">{goal.name}</span>
          </CardTitle>
          {goal.targetDate && (
            <CardDescription className="flex items-center gap-1">
              <CalendarDays className="size-3.5" aria-hidden />
              Target {formatTargetDate(goal.targetDate)}
            </CardDescription>
          )}
        </div>
        {completed ? (
          <Badge variant="secondary" className="text-income">
            <CheckCircle2 aria-hidden />
            Completed
          </Badge>
        ) : (
          <Badge variant="outline">{percent.toFixed(0)}%</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {fmt(saved)}
          </p>
          <p className="text-sm text-muted-foreground">of {fmt(target)}</p>
        </div>

        <Progress
          value={barValue}
          className="h-2"
          indicatorClassName={completed ? "bg-income" : "bg-savings"}
          aria-label={`${goal.name} progress`}
          aria-valuetext={`${percent.toFixed(1)}% saved`}
        />

        <p className="text-xs text-muted-foreground">
          {completed ? (
            "Goal reached"
          ) : (
            <>
              {fmt(remaining)} to go
            </>
          )}
          <span className="mx-1">·</span>
          {percent.toFixed(1)}%
        </p>

        <div className="flex items-center gap-1.5 pt-1">
          <Button size="sm" onClick={onContribute}>
            <Plus aria-hidden />
            Add funds
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${goal.name}`}
            onClick={onEdit}
          >
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${goal.name}`}
            onClick={onDelete}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
