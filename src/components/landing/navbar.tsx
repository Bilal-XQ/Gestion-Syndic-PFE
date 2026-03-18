"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

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
    <nav className="fixed inset-x-0 top-0 z-50 h-14">
      {/* Glass panel — always-on frosted glass */}
      <div
        className={cn(
          "absolute inset-0 border-b transition-all duration-500",
          "[mask-image:linear-gradient(to_bottom,black_85%,transparent)]",
          scrolled
            ? "dark:bg-[rgba(10,10,10,0.80)] dark:border-white/[0.10] bg-[rgba(247,247,245,0.90)] border-black/[0.10]"
            : "dark:bg-[rgba(10,10,10,0.60)] dark:border-white/[0.06] bg-[rgba(247,247,245,0.70)] border-black/[0.06]"
        )}
        style={{
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      />

      {/* Bottom gradient edge */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Inner content */}
      <div className="relative z-10 mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Left: Logo + wordmark */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[--accent-border] bg-[--bg-card]">
            <Image
              src="/logo.svg"
              alt="Syndic"
              width={28}
              height={28}
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <span className="font-[family-name:var(--font-syne)] text-sm font-semibold tracking-tight text-[--text-primary]">
            Syndic
          </span>
        </Link>

        {/* Center: Navigation links (desktop only) */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: "Fonctionnalités", href: "#features" },
            { label: "Comment ça marche", href: "#how-it-works" },
            { label: "FAQ", href: "#faq" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-[13px] font-medium text-[--text-muted] rounded-[--radius-md] hover:bg-white/[0.06] hover:text-[--text-secondary] transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: theme toggle + CTA */}
        <div className="flex items-center gap-3">
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

          <Link
            href="/login"
            className="rounded-[--radius-md] bg-[--btn-primary-bg] px-5 py-2 text-sm font-medium text-[--btn-primary-text] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-colors duration-250 hover:bg-[--btn-primary-hover]"
          >
            Connexion
          </Link>
        </div>
      </div>
    </nav>
  );
}
