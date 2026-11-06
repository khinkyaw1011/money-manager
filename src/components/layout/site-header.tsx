import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { HeaderActions } from "@/components/layout/header-actions";

/**
 * Menu bar for public pages (home, sign-in). Signed-in pages use AppHeader
 * inside the sidebar layout instead.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <Logo size={28} showName />
        </Link>
        <HeaderActions />
      </div>
    </header>
  );
}
