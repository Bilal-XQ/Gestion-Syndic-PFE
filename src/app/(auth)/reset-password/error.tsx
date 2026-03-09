"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function ResetPasswordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("auth");
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-base] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[--border-default] bg-[--bg-card]">
            <span className="text-lg font-semibold text-[--text-primary]">
              S
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-[16px] border border-[--border-default] bg-[--bg-card] p-6 text-center">
          <h1 className="text-lg font-semibold text-[--text-primary]">
            {t("errorPage.heading")}
          </h1>
          <p className="text-sm text-[--text-secondary]">
            {error.message || t("errorPage.message")}
          </p>
          <button
            onClick={reset}
            className="rounded-[10px] bg-[--btn-primary-bg] px-5 py-2.5 text-sm font-medium text-[--btn-primary-text] transition-transform duration-[150ms] hover:opacity-90 active:scale-[0.98]"
          >
            {t("errorPage.retry")}
          </button>
        </div>
      </div>
    </div>
  );
}
