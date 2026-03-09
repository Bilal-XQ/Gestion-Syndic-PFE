"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-14 transition-all duration-300 ease-in-out",
        scrolled
          ? "border-b border-[--border-subtle] bg-[--bg-overlay] backdrop-blur-[16px] saturate-150"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[--border-default] bg-[--bg-card] shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <span className="font-[family-name:var(--font-syne)] text-sm font-bold leading-none text-[--text-primary]">
              S
            </span>
          </div>
          <span className="font-[family-name:var(--font-syne)] text-sm font-semibold tracking-tight text-[--text-primary]">
            Syndic
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
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

          {/* CTA */}
          <Link
            href="/login"
            className="rounded-[--radius-md] bg-[--btn-primary-bg] px-5 py-2 text-sm font-medium text-[--btn-primary-text] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-colors duration-250 hover:bg-[--btn-primary-hover]"
          >
            Connexion
          </Link>
        </div>
      </div>
    </header>
  );
}
