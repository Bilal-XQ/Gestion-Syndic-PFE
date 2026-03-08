"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  CalendarDays,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { useSidebarStore } from "@/lib/stores/sidebar";
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

const navItems = [
  {
    label: "Vue d'ensemble",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Copropriétaires",
    href: "/dashboard/owners",
    icon: Users,
  },
  {
    label: "Appartements",
    href: "/dashboard/apartments",
    icon: Building2,
  },
  {
    label: "Charges",
    href: "/dashboard/charges",
    icon: Receipt,
  },
  {
    label: "Réunions",
    href: "/dashboard/meetings",
    icon: CalendarDays,
  },
  {
    label: "Paiements",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { open } = useSidebar();
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);

  // Sync sidebar-07 state → Zustand store
  useEffect(() => {
    setCollapsed(!open);
  }, [open, setCollapsed]);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-[8px] border border-[--border-default] bg-[--bg-card]">
                  <span className="text-sm font-semibold text-[--text-primary]">
                    S
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-[--text-primary]">
                    Syndic
                  </span>
                  <span className="truncate text-xs text-[--text-muted]">
                    Gestion
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[--text-muted]">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
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
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — sign out */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Déconnexion"
              onClick={async () => {
                await signOut();
              }}
            >
              <LogOut />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { navItems };
