"use client";

import { formatMoney } from "@/lib/money";

/** Subset of a Recharts payload entry; values arrive as numbers. */
interface TooltipEntry {
  name?: unknown;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
}

interface MoneyTooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: unknown;
  currency: string;
  labels: Record<string, string>;
  formatLabel?: (label: string) => string;
}

/** Recharts tooltip body that formats values as currency. */
export function MoneyTooltip({ active, payload, label, currency, labels, formatLabel }: MoneyTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {label != null && (
        <p className="mb-1.5 font-medium">{formatLabel ? formatLabel(String(label)) : String(label)}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? entry.name);
          return (
            <li key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2.5 rounded-[2px]" style={{ background: entry.color }} aria-hidden />
                {labels[key] ?? key}
              </span>
              <span className="font-medium tabular-nums">{formatMoney(String(entry.value ?? 0), currency)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
