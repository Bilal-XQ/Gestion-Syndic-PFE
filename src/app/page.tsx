import Link from "next/link";
import {
  Building2,
  CreditCard,
  Users,
  Shield,
  CalendarDays,
  BarChart3,
} from "lucide-react";

/* ─────────────── Feature data ─────────────── */
const features = [
  {
    icon: Building2,
    title: "Gestion des immeubles",
    description:
      "Suivez vos bâtiments, appartements et lots avec une vue centralisée et hiérarchique.",
  },
  {
    icon: Users,
    title: "Copropriétaires",
    description:
      "Gérez les profils, les quotas de tantièmes et invitez les propriétaires à leur portail.",
  },
  {
    icon: CreditCard,
    title: "Paiements & Charges",
    description:
      "Générez des appels de charges, enregistrez les paiements et suivez les créances en temps réel.",
  },
  {
    icon: CalendarDays,
    title: "Réunions & PV",
    description:
      "Planifiez des assemblées, rédigez les ordres du jour et archivez les procès-verbaux.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    description:
      "Indicateurs clés, taux de recouvrement et tendances de paiement en un coup d'œil.",
  },
  {
    icon: Shield,
    title: "Sécurité & Audit",
    description:
      "Authentification sécurisée, journal d'audit immutable et contrôle d'accès par rôle.",
  },
];

/* ─────────────── Stats ─────────────── */
const stats = [
  { value: "100%", label: "Open Source" },
  { value: "2", label: "Rôles sécurisés" },
  { value: "10+", label: "Modules intégrés" },
  { value: "0", label: "Frais cachés" },
];

/* ─────────────── Page ─────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[--bg-base] font-[family-name:var(--font-dm-sans)]">
      {/* ── Navbar ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent transition-colors duration-[250ms]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[--border-default] bg-[--bg-card]">
              <span className="font-[family-name:var(--font-syne)] text-sm font-bold text-[--text-primary]">
                S
              </span>
            </div>
            <span className="font-[family-name:var(--font-syne)] text-sm font-semibold text-[--text-primary]">
              Syndic
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] bg-[--btn-primary-bg] px-5 py-2.5 text-sm font-medium text-[--btn-primary-text] transition-colors duration-[250ms] hover:bg-[--btn-primary-hover]"
          >
            Connexion
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pt-14">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.08), transparent 60%)",
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Badge */}
          <span className="mb-6 inline-block rounded-full border border-[--border-default] bg-[--bg-card] px-4 py-1.5 font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
            Gestion de copropriété
          </span>

          {/* Headline */}
          <h1
            className="mx-auto max-w-2xl font-[family-name:var(--font-instrument-serif)] text-[--text-primary]"
            style={{
              fontSize: "clamp(44px, 5.5vw, 76px)",
              lineHeight: "1.05",
              letterSpacing: "-0.03em",
            }}
          >
            Simplifiez la gestion de votre copropriété
          </h1>

          {/* Sub-headline */}
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[--text-secondary]">
            Une plateforme moderne pour les syndics et les copropriétaires.
            Paiements, réunions, charges — tout au même endroit.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-[10px] bg-[--btn-primary-bg] px-8 py-3 text-sm font-medium text-[--btn-primary-text] transition-all duration-[250ms] hover:bg-[--btn-primary-hover]"
            >
              Commencer maintenant
            </Link>
            <a
              href="#features"
              className="rounded-[10px] border border-[--btn-secondary-border] bg-[--btn-secondary-bg] px-8 py-3 text-sm font-medium text-[--text-secondary] transition-all duration-[250ms] hover:border-[--btn-secondary-hover-border] hover:bg-[--btn-secondary-hover-bg]"
            >
              Découvrir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-[--border-subtle] bg-[--bg-subtle]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4 md:px-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[--text-primary]">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-[--text-muted]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-[--bg-base] py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full border border-[--border-default] bg-[--bg-card] px-4 py-1.5 font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
              Fonctionnalités
            </span>
            <h2
              className="mx-auto max-w-md font-[family-name:var(--font-instrument-serif)] text-[--text-primary]"
              style={{
                fontSize: "clamp(28px, 3.5vw, 48px)",
                lineHeight: "1.15",
                letterSpacing: "-0.03em",
              }}
            >
              Tout ce dont vous avez besoin
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[16px] border border-[--border-subtle] bg-[--bg-card] p-6 transition-all duration-[250ms] hover:border-[--border-default] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border border-[--border-default] bg-[--bg-subtle]">
                  <feature.icon className="h-5 w-5 text-[--text-secondary]" />
                </div>
                <h3 className="mb-2 text-base font-medium text-[--text-primary]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[--text-muted]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="border-y border-[--border-subtle] bg-[--bg-card]">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-6">
          <h2
            className="mx-auto max-w-lg font-[family-name:var(--font-instrument-serif)] text-[--text-primary]"
            style={{
              fontSize: "clamp(28px, 3.5vw, 48px)",
              lineHeight: "1.15",
              letterSpacing: "-0.03em",
            }}
          >
            Prêt à moderniser votre gestion&nbsp;?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-[--text-secondary]">
            Rejoignez les syndics qui ont choisi une solution simple, sécurisée
            et efficace.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-[10px] bg-[--btn-primary-bg] px-8 py-3 text-sm font-medium text-[--btn-primary-text] transition-colors duration-[250ms] hover:bg-[--btn-primary-hover]"
          >
            Accéder à la plateforme
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[--bg-subtle] py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[--border-default] bg-[--bg-card]">
                <span className="font-[family-name:var(--font-syne)] text-xs font-bold text-[--text-primary]">
                  S
                </span>
              </div>
              <span className="text-sm text-[--text-muted]">
                Syndic — Gestion de Copropriété
              </span>
            </div>
            <p className="text-sm text-[--text-muted]">
              © {new Date().getFullYear()} Syndic. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
