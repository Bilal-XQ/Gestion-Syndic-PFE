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
} from "lucide-react";
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  firstName?: string;
  lastName?: string;
}

export function AppSidebar({
  firstName = "",
  lastName = "",
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const { open } = useSidebar();
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);

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
              <SidebarMenuButton size="lg" asChild tooltip="Accueil">
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

      {/* Footer — user identity + logout */}
      <SidebarFooter>
        <SidebarUserMenu
          firstName={firstName}
          lastName={lastName}
          roleLabel="Administrateur"
          profileHref="/dashboard/settings"
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { navItems };
