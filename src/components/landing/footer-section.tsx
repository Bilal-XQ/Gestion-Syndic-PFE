import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="border-t border-[--border-subtle] bg-[--bg-subtle] py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Row 1 */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[--border-default] bg-[--bg-card]">
              <span className="font-[family-name:var(--font-syne)] text-xs font-bold text-[--text-primary]">
                S
              </span>
            </div>
            <span className="text-sm font-medium text-[--text-muted]">
              Syndic
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-[--text-muted] transition-colors duration-150 hover:text-[--text-secondary]"
            >
              Fonctionnalités
            </a>
            <Link
              href="/login"
              className="text-sm text-[--text-muted] transition-colors duration-150 hover:text-[--text-secondary]"
            >
              Connexion
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-[--border-subtle] pt-8">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-sm text-[--text-muted]">
              © {new Date().getFullYear()} Syndic. Tous droits réservés.
            </p>
            <p className="text-sm text-[--text-muted]">
              Built with Next.js &amp; Supabase
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
