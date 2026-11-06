"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Info,
  Link2,
  OctagonAlert,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types/notification";

const typeStyles: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  BUDGET_WARNING: { icon: AlertTriangle, className: "text-warning bg-warning/10" },
  BUDGET_EXCEEDED: { icon: OctagonAlert, className: "text-expense bg-expense/10" },
  GOAL_REACHED: { icon: Trophy, className: "text-income bg-income/10" },
  CONNECTION: { icon: Link2, className: "text-savings bg-savings/10" },
  SYSTEM: { icon: Info, className: "text-primary bg-primary/10" },
};

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

interface NotificationBellProps {
  notifications: AppNotification[];
  /** Wired to a Server Action once notifications are stored (Phase 6). */
  onMarkAllRead?: () => void;
}

export function NotificationBell({ notifications, onMarkAllRead }: NotificationBellProps) {
  const unread = notifications.filter((n) => !n.read).length;
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className="relative">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {onMarkAllRead && unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <BellOff className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">
              Budget warnings and goal updates will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto py-1">
            {notifications.map((n) => {
              const { icon: Icon, className } = typeStyles[n.type];
              const body = (
                <>
                  <span className={cn("mt-0.5 rounded-full p-1.5", className)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                    <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                  )}
                </>
              );
              return (
                <DropdownMenuItem key={n.id} asChild={!!n.href} className="items-start gap-3 px-3 py-2">
                  {n.href ? <Link href={n.href}>{body}</Link> : body}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
