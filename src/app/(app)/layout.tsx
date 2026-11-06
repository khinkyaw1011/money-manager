import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionUser } from "@/lib/session";

/**
 * Shell for all signed-in pages: sidebar + header + content.
 *
 * Signed-out visitors are sent to /login. This is a UX guard; every data
 * read/write will ALSO check the session on the server (Phase 3+), since
 * layouts alone are not a security boundary.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Remember collapsed/expanded state across reloads (cookie set by SidebarProvider).
  const sidebarState = (await cookies()).get("sidebar_state")?.value;

  return (
    <SidebarProvider defaultOpen={sidebarState !== "false"}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
