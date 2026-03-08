"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[--bg-base] px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-[--text-primary]">
          Une erreur est survenue
        </h1>
        <p className="max-w-md text-sm text-[--text-secondary]">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-[10px] bg-[--btn-primary-bg] px-5 py-2.5 text-sm font-medium text-[--btn-primary-text] transition-transform duration-[150ms] hover:opacity-90 active:scale-[0.98]"
      >
        Réessayer
      </button>
    </div>
  );
}
