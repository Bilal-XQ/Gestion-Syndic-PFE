"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const locale = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const languages = [
    { code: "fr", label: "FR", fullLabel: "Français" },
    { code: "en", label: "EN", fullLabel: "English" },
    { code: "ar", label: "ع", fullLabel: "العربية" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchLanguage = (code: string) => {
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000`;
    window.location.reload();
    setLangOpen(false);
  };

  // Close language dropdown on Escape key
  useEffect(() => {
    if (!langOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [langOpen]);

  const glassClass = mounted
    ? resolvedTheme === "dark"
      ? scrolled
        ? "border-white/[0.12] bg-[rgba(10,10,10,0.88)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        : "border-white/[0.06] bg-[rgba(10,10,10,0.55)] shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
      : scrolled
        ? "border-black/[0.10] bg-[rgba(247,247,245,0.92)] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        : "border-black/[0.06] bg-[rgba(247,247,245,0.75)] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
    : "border-white/[0.06] bg-[rgba(10,10,10,0.55)]";

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center pt-4 px-4">
      <nav
        className={cn(
          "relative flex items-center justify-between gap-6",
          "h-12 w-full max-w-4xl rounded-[--radius-2xl] px-3",
          "border transition-all duration-500",
          "backdrop-blur-[24px] backdrop-saturate-[180%]",
          glassClass,
        )}
        style={{ WebkitBackdropFilter: "blur(24px) saturate(180%)" }}
      >
        {/* Left: Logo + wordmark */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[--accent-border] bg-[--bg-card]">
            <Image
              src="/logo.svg"
              alt="Syndic"
              width={18}
              height={18}
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <span className="font-[family-name:var(--font-syne)] text-[13px] font-semibold text-[--text-primary] tracking-tight">
            Syndic
          </span>
        </Link>

        {/* Center: Nav links (desktop only) */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {[
            { label: "Fonctionnalités", href: "#features" },
            { label: "Comment ça marche", href: "#how-it-works" },
            { label: "FAQ", href: "#faq" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-[13px] font-medium text-[--text-muted] rounded-[--radius-md] hover:bg-white/[0.06] hover:text-[--text-secondary] transition-all duration-150 whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Language + Theme + CTA */}
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-8 items-center gap-1.5 rounded-[--radius-md] px-2.5 border border-[--border-subtle] bg-transparent text-[12px] font-medium text-[--text-muted] hover:border-[--border-default] hover:text-[--text-secondary] transition-all duration-150"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="font-[family-name:var(--font-syne)] uppercase tracking-wide">
                {languages.find((l) => l.code === locale)?.label ?? "FR"}
              </span>
            </button>

            {langOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangOpen(false)}
                />
                {/* Dropdown */}
                <div className="absolute end-0 top-full mt-2 z-50 min-w-[130px] rounded-[--radius-lg] border border-[--border-default] bg-[--bg-elevated] shadow-[var(--shadow-md)] py-1 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLanguage(lang.code)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                        "text-[13px] transition-colors duration-100",
                        "hover:bg-[--bg-card-hover]",
                        locale === lang.code
                          ? "text-[--accent] font-medium"
                          : "text-[--text-secondary]"
                      )}
                    >
                      <span className="font-[family-name:var(--font-syne)] text-[11px] uppercase tracking-widest w-5 text-center shrink-0 text-[--text-muted]">
                        {lang.label}
                      </span>
                      <span>{lang.fullLabel}</span>
                      {locale === lang.code && (
                        <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[--accent]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-[--radius-md] border border-[--border-subtle] bg-transparent text-[--text-muted] transition-all duration-150 hover:border-[--border-default] hover:text-[--text-secondary]"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Auth-aware CTA */}
          {mounted && (
            user ? (
              <Link
                href={
                  user.app_metadata?.user_role === "proprietaire"
                    ? "/portal"
                    : "/dashboard"
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[--accent-border] bg-[--accent-bg] text-[13px] font-semibold uppercase hover:bg-[--accent-border] transition-all duration-150"
                style={{ color: "var(--accent)" }}
                title="Accéder à mon espace"
                aria-label={`Accéder à mon espace (${user.email})`}
              >
                {user.email?.charAt(0).toUpperCase() ?? "U"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-[--radius-md] bg-[--btn-primary-bg] px-4 py-1.5 text-[13px] font-medium text-[--btn-primary-text] hover:bg-[--btn-primary-hover] transition-colors duration-[250ms] shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
              >
                Connexion
              </Link>
            )
          )}
        </div>

        {/* Bottom shimmer line */}
        <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </nav>
    </header>
  );
}
