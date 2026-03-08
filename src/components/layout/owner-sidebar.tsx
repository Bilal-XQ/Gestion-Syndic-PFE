"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Home, CreditCard, Bell } from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";

const portalNavItems = [
  { label: "Mon espace", href: "/portal", icon: Home },
  { label: "Paiements", href: "/payments", icon: CreditCard },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/notifications");
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unreadCount ?? 0;
}

interface OwnerSidebarProps extends React.ComponentProps<typeof Sidebar> {
  firstName?: string;
  lastName?: string;
}

export function OwnerSidebar({
  firstName = "",
  lastName = "",
  ...props
}: OwnerSidebarProps) {
  const pathname = usePathname();
  const { open } = useSidebar();
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });

  // Sync sidebar-07 state → Zustand store
  useEffect(() => {
    setCollapsed(!open);
  }, [open, setCollapsed]);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand + Theme Toggle */}
      <SidebarHeader>
        <div className="flex items-center gap-1">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="Mon espace">
                <Link href="/portal">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-[8px] border border-[--border-default] bg-[--bg-card]">
                    <span className="text-sm font-semibold text-[--text-primary]">
                      S
                    </span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-[--text-primary]">
                      Syndic
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="shrink-0 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[--text-muted]">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {portalNavItems.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      {item.href === "/notifications" && unreadCount > 0 && (
                        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[--accent-primary] px-1.5 text-[10px] font-semibold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user identity + logout */}
      <SidebarFooter>
        <SidebarUserMenu
          firstName={firstName}
          lastName={lastName}
          roleLabel="Copropriétaire"
          profileHref="/portal"
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { portalNavItems };
