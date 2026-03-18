"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/actions/auth";
import { Home, CreditCard, Bell, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function PortalTopBar() {
  const t = useTranslations("common");
  const pathname = usePathname();

  const portalNavItems = [
    { label: t("ownerNav.mySpace"), href: "/portal", icon: Home },
    { label: t("ownerNav.payments"), href: "/payments", icon: CreditCard },
    { label: t("ownerNav.notifications"), href: "/notifications", icon: Bell },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[--border-subtle] bg-[--bg-base] px-4 md:px-6">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <Link
          href="/portal"
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[--border-default] bg-[--bg-card]">
            <Image
              src="/logo.svg"
              alt="Syndic"
              width={22}
              height={22}
              className="text-[--text-primary]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <span className="hidden text-sm font-semibold text-[--text-primary] sm:inline">
            Syndic
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1">
          {portalNavItems.map((item) => {
            const isActive =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm transition-colors duration-[150ms] ${
                  isActive
                    ? "bg-[--bg-card] text-[--text-primary]"
                    : "text-[--text-muted] hover:bg-[--bg-card] hover:text-[--text-secondary]"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <form
          action={async () => {
            await signOut();
          }}
        >
          <button
            type="submit"
            className="flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm text-[--text-muted] transition-colors duration-[150ms] hover:bg-[--bg-card] hover:text-[--text-secondary]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("userMenu.signOut")}</span>
          </button>
        </form>
      </div>
    </header>
  );
}
