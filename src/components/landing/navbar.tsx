"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Globe, LayoutDashboard, LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { setTheme, resolvedTheme } = useTheme();
  const locale = useLocale() as Locale;

  useEffect(() => {
    setMounted(true);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!langOpen) return;

    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);

  const switchLanguage = (code: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setLangOpen(false);
    window.location.href = window.location.pathname + window.location.search;
  };

  const localeLabels: Record<Locale, { short: string; full: string }> = {
    fr: { short: "FR", full: tc("languageSwitcher.fr") },
    en: { short: "EN", full: tc("languageSwitcher.en") },
    ar: { short: "ع", full: tc("languageSwitcher.ar") },
  };

  const isDark = !mounted || resolvedTheme === "dark";

  const pillBg = isDark
    ? scrolled
      ? "rgba(15,15,15,0.92)"
      : "rgba(12,12,12,0.75)"
    : scrolled
      ? "rgba(250,250,248,0.95)"
      : "rgba(247,247,245,0.80)";

  const pillBorder = isDark
    ? scrolled
      ? "rgba(255,255,255,0.12)"
      : "rgba(255,255,255,0.07)"
    : scrolled
      ? "rgba(0,0,0,0.12)"
      : "rgba(0,0,0,0.07)";

  const pillShadow = scrolled
    ? isDark
      ? "0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)"
      : "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)"
    : isDark
      ? "0 4px 20px rgba(0,0,0,0.4)"
      : "0 4px 20px rgba(0,0,0,0.06)";

  const userRole = user?.app_metadata?.user_role ?? user?.user_metadata?.role ?? null;
  const dashboardHref = userRole === "proprietaire" ? "/portal" : "/dashboard";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className="relative flex h-12 w-full max-w-4xl items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-500"
        style={{
          background: pillBg,
          border: `1px solid ${pillBorder}`,
          boxShadow: pillShadow,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[--accent-border] bg-[--bg-card]">
            <Image
              src="/logo.svg"
              alt={t("nav.brandAlt")}
              width={20}
              height={20}
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <span className="font-[family-name:var(--font-syne)] text-[13px] font-semibold tracking-tight text-[--text-primary]">
            Syndic
          </span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex">
          {[
            { label: t("nav.features"), href: "#features" },
            { label: t("nav.howItWorks"), href: "#how-it-works" },
            { label: t("nav.faq"), href: "#faq" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium text-[--text-muted] transition-all duration-150 hover:bg-white/[0.06] hover:text-[--text-secondary]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {mounted && (
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((prev) => !prev)}
                className="flex h-7 items-center gap-1 rounded-lg border border-[--border-subtle] bg-transparent px-2 font-[family-name:var(--font-syne)] text-[11px] font-medium uppercase tracking-wide text-[--text-muted] transition-all duration-150 hover:border-[--border-default] hover:text-[--text-secondary]"
              >
                <Globe className="h-3 w-3" />
                {localeLabels[locale]?.short ?? "FR"}
              </button>

              {langOpen && (
                <div
                  className="absolute end-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden rounded-[--radius-lg] border border-[--border-default] bg-[--bg-elevated] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                  style={{
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                >
                  {locales.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => switchLanguage(lang)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left",
                        "text-[13px] transition-colors duration-100",
                        "hover:bg-[--bg-card-hover]",
                        locale === lang
                          ? "text-[--accent] font-medium"
                          : "text-[--text-secondary]"
                      )}
                    >
                      <span className="w-5 shrink-0 text-center font-[family-name:var(--font-syne)] text-[11px] uppercase tracking-widest text-[--text-muted]">
                        {localeLabels[lang].short}
                      </span>
                      <span>{localeLabels[lang].full}</span>
                      {locale === lang && (
                        <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[--accent]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[--border-subtle] bg-transparent text-[--text-muted] transition-all duration-150 hover:border-[--border-default] hover:text-[--text-secondary]"
              aria-label={t("nav.themeToggleLabel")}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {mounted &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[--accent-border] bg-[--accent-bg] text-[12px] font-semibold uppercase text-[--accent-muted] transition-all duration-150 hover:bg-[--accent-border] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]"
                    title={t("nav.mySpace")}
                  >
                    {user.email?.charAt(0).toUpperCase() ?? "U"}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-52 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-elevated] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                  style={{
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                >
                  <div className="mb-1 border-b border-[--border-subtle] px-3 py-2.5">
                    <p className="truncate text-[12px] font-medium text-[--text-primary]">
                      {user.email}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium capitalize text-[--accent]">
                      {userRole === "proprietaire"
                        ? t("nav.roleOwner")
                        : t("nav.roleSyndic")}
                    </p>
                  </div>

                  <DropdownMenuItem asChild>
                    <Link
                      href={dashboardHref}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[--radius-md] px-3 py-2 text-[13px] text-[--text-secondary] transition-colors duration-100 hover:bg-[--bg-card-hover] hover:text-[--text-primary] focus:bg-[--bg-card-hover] focus:outline-none"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-[--text-muted]" />
                      {userRole === "proprietaire"
                        ? t("nav.myPortal")
                        : t("nav.dashboard")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="-mx-1 my-1 bg-[--border-subtle]" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex cursor-pointer items-center gap-2.5 rounded-[--radius-md] px-3 py-2 text-[13px] text-[--status-error] transition-colors duration-100 hover:bg-[rgba(239,68,68,0.08)] hover:text-[--status-error] focus:bg-[rgba(239,68,68,0.08)] focus:outline-none"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="flex h-7 items-center rounded-lg bg-[--btn-primary-bg] px-3.5 text-[12px] font-medium text-[--btn-primary-text] transition-colors duration-[250ms] hover:bg-[--btn-primary-hover]"
              >
                Connexion
              </Link>
            ))}
        </div>

        <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[--accent-border] to-transparent opacity-50" />
      </nav>
    </header>
  );
}
