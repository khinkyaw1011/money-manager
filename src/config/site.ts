import {
  LayoutDashboard,
  PiggyBank,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const siteConfig = {
  name: "Money Manager",
  description:
    "Track income, expenses, savings goals and budgets in one secure place.",
  /** ISO 4217 code used when a user has not chosen one. */
  defaultCurrency: "JPY",
  defaultLocale: "ja-JP",
  /** IANA zone used to decide which month a transaction belongs to. */
  timeZone: "Asia/Tokyo",
} as const;

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** Single source of truth for sidebar navigation. */
export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Income", href: "/income", icon: TrendingUp },
  { title: "Expenses", href: "/expenses", icon: TrendingDown },
  { title: "Savings Goals", href: "/savings", icon: PiggyBank },
  { title: "Budgets", href: "/budgets", icon: Target },
];

/** Shown pinned at the bottom of the sidebar. */
export const secondaryNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];

/** Find the nav item for a pathname (exact match or nested route). */
export function findNavItem(pathname: string): NavItem | undefined {
  return [...mainNav, ...secondaryNav].find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
}
