import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[--bg-base] px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[clamp(64px,10vw,120px)] font-semibold leading-none text-[--text-primary]">
          404
        </h1>
        <p className="text-lg text-[--text-secondary]">
          Page introuvable
        </p>
        <p className="max-w-md text-sm text-[--text-muted]">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-[10px] bg-[--btn-primary-bg] px-5 py-2.5 text-sm font-medium text-[--btn-primary-text] transition-transform duration-[150ms] hover:opacity-90 active:scale-[0.98]"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
