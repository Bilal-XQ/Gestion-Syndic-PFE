"use client";

import { useEffect } from "react";

export default function SettingsError({
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-[--text-primary]">
        Erreur de chargement
      </h2>
      <p className="max-w-md text-center text-sm text-[--text-secondary]">
        {error.message || "Impossible de charger les paramètres."}
      </p>
      <button
        onClick={reset}
        className="rounded-[10px] bg-[--btn-primary-bg] px-5 py-2.5 text-sm font-medium text-[--btn-primary-text] transition-transform duration-[150ms] hover:opacity-90 active:scale-[0.98]"
      >
        Réessayer
      </button>
    </div>
  );
}
