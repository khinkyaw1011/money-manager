import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();

  return (
    <>
      <PageHeader title="Settings" description="Your profile and app preferences." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Managed by your Google account.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="size-14">
              {user?.image && <AvatarImage src={user.image} alt="" />}
              <AvatarFallback className="bg-primary/10 text-primary">
                {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user?.name ?? "—"}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Appearance and regional formats.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <div className="flex items-center justify-between py-3 first:pt-0">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">Light, dark or match your system.</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between py-3 last:pb-0">
              <div>
                <p className="text-sm font-medium">Currency</p>
                <p className="text-xs text-muted-foreground">
                  Changing currency becomes available once data is saved to the database.
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">{siteConfig.defaultCurrency}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
