"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[--bg-base] px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-[--text-primary]">
          {t("errorPage.title")}
        </h1>
        <p className="max-w-md text-sm text-[--text-secondary]">
          {error.message || t("somethingWentWrong")}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-[10px] bg-[--btn-primary-bg] px-5 py-2.5 text-sm font-medium text-[--btn-primary-text] transition-transform duration-[150ms] hover:opacity-90 active:scale-[0.98]"
      >
        {t("errorPage.retry")}
      </button>
    </div>
  );
}
