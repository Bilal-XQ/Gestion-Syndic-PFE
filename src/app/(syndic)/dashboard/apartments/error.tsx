"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function ApartmentsError({
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-[--text-primary]">
        {t("errorPage.title")}
      </h2>
      <p className="max-w-md text-center text-sm text-[--text-secondary]">
        {error.message || t("errorPage.loadFailed")}
      </p>
      <button
        onClick={reset}
        className="rounded-[10px] bg-[--btn-primary-bg] px-5 py-2.5 text-sm font-medium text-[--btn-primary-text] transition-transform duration-[150ms] hover:opacity-90 active:scale-[0.98]"
      >
        {t("errorPage.retry")}
      </button>
    </div>
  );
}
