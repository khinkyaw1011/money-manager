import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon chip, e.g. "text-income bg-income/10". */
  iconClassName: string;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}

/** Headline number tile. Value text stays in neutral ink; the icon carries identity. */
export function StatTile({ label, value, icon: Icon, iconClassName, hint, children }: StatTileProps) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("rounded-md p-1.5", iconClassName)}>
          <Icon className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
