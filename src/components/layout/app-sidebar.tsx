"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { mainNav, secondaryNav, siteConfig, type NavItem } from "@/config/site";

function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {items.map(({ title, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={active} tooltip={title}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                // Close the slide-over drawer after choosing a page on mobile.
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <Icon />
                <span>{title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

/**
 * Main navigation. Collapses to an icon rail on desktop (Ctrl/Cmd+B or the
 * header button) and becomes a slide-over drawer on mobile.
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={siteConfig.name}>
              <Link href="/dashboard">
                <Logo size={32} decorative className="shrink-0" />
                <span className="font-semibold tracking-tight">{siteConfig.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavLinks items={mainNav} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavLinks items={secondaryNav} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
