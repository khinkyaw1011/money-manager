import { HeaderActions } from "@/components/layout/header-actions";
import { PageTitle } from "@/components/layout/page-title";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Menu bar for signed-in pages: sidebar toggle, section title, actions. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <PageTitle />
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </header>
  );
}
