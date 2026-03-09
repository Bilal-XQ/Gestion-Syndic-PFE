import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/features/auth/reset-password-form";
import { UpdatePasswordForm } from "@/components/features/auth/update-password-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("resetPassword.pageTitle") } satisfies Metadata;
}

/**
 * This page serves dual purpose:
 * 1. User lands here to REQUEST a reset (shows email form)
 * 2. User lands here FROM the reset email link (shows new-password form)
 *
 * When Supabase redirects from the reset email, the URL contains a
 * `code` search param. We use this to determine which form to show.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const t = await getTranslations("auth");
  const { code } = await searchParams;
  const hasCode = Boolean(code);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-base] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / App name */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[--border-default] bg-[--bg-card]">
            <span className="text-lg font-semibold text-[--text-primary]">
              S
            </span>
          </div>
          <h1 className="text-xl font-semibold text-[--text-primary]">
            {hasCode ? t("resetPassword.headingWithCode") : t("resetPassword.headingWithoutCode")}
          </h1>
          <p className="text-sm text-[--text-muted]">
            {hasCode
              ? t("resetPassword.subtitleWithCode")
              : t("resetPassword.subtitleWithoutCode")}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[16px] border border-[--border-default] bg-[--bg-card] p-6">
          {hasCode ? <UpdatePasswordForm /> : <ResetPasswordForm />}
        </div>
      </div>
    </div>
  );
}
