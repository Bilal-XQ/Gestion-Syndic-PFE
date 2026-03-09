"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarUserMenuProps {
  firstName: string;
  lastName: string;
  roleLabel: string;
  profileHref: string;
}

export function SidebarUserMenu({
  firstName,
  lastName,
  roleLabel,
  profileHref,
}: SidebarUserMenuProps) {
  const t = useTranslations("common");
  const { open } = useSidebar();

  const initials =
    [firstName?.[0] ?? "", lastName?.[0] ?? ""]
      .join("")
      .toUpperCase() || "?";

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || t("fallbackUserName");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Avatar — always visible */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {initials}
          </div>

          {/* Name + role — hidden when sidebar is collapsed */}
          {open && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[--text-primary]">
                {fullName}
              </p>
              <p className="truncate text-xs text-[--text-muted]">{roleLabel}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={profileHref} className="flex items-center gap-2">
            <User className="size-4" />
            {t("userMenu.myProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={async () => {
            await signOut();
          }}
        >
          <LogOut className="size-4" />
          {t("userMenu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
