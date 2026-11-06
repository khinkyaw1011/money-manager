"use client";

import { usePathname } from "next/navigation";
import { findNavItem } from "@/config/site";

/** Current section name shown in the app header, derived from the URL. */
export function PageTitle() {
  const item = findNavItem(usePathname());
  return <span className="truncate text-sm font-medium">{item?.title ?? ""}</span>;
}
