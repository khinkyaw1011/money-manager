import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/features/auth/actions";
import { getSessionUser } from "@/lib/session";
import type { AppNotification } from "@/types/notification";

/** Right side of every header: notifications (signed-in only), theme, account. */
export async function HeaderActions({ notifications = [] }: { notifications?: AppNotification[] }) {
  const user = await getSessionUser();
  return (
    <nav aria-label="Header actions" className="flex items-center gap-1">
      {user && <NotificationBell notifications={notifications} />}
      <ThemeToggle />
      <UserMenu user={user} signOutAction={signOutAction} />
    </nav>
  );
}
