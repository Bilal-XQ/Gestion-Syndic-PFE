import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/features/auth/login-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("login.pageTitle") } satisfies Metadata;
}

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[--bg-base] px-4">
      {/* Top-right controls */}
      <div className="absolute end-4 top-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo / App name */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[--border-default] bg-[--bg-card]">
            <span className="text-lg font-semibold text-[--text-primary]">
              S
            </span>
          </div>
          <h1 className="text-xl font-semibold text-[--text-primary]">
            Syndic
          </h1>
          <p className="text-sm text-[--text-muted]">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-[16px] border border-[--border-default] bg-[--bg-card] p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
