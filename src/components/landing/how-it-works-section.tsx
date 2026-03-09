"use client";

import { BlurFade } from "@/components/ui/blur-fade";

const steps = [
  {
    n: 1,
    title: "Configurez votre immeuble",
    description:
      "Enregistrez votre bâtiment, ajoutez les appartements et définissez les paramètres de votre syndic en quelques minutes.",
  },
  {
    n: 2,
    title: "Invitez les copropriétaires",
    description:
      "Créez les comptes — ils reçoivent automatiquement un email avec leurs identifiants d'accès au portail personnel.",
  },
  {
    n: 3,
    title: "Gérez en temps réel",
    description:
      "Émettez des charges, suivez les paiements, organisez vos assemblées et recevez des notifications instantanées via Supabase Realtime.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden border-y border-[--border-subtle] bg-[--bg-subtle] py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Section header */}
        <BlurFade delay={0.1} inView>
          <div className="mb-20 text-center">
            <div className="mb-6 inline-flex items-center justify-center">
              <div className="cursor-default rounded-full border border-[--border-default] bg-[--bg-card] px-4 py-1.5">
                <span className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
                  Comment ça marche
                </span>
              </div>
            </div>
            <h2
              className="font-[family-name:var(--font-instrument-serif)] text-[--text-primary]"
              style={{
                fontSize: "clamp(32px, 4vw, 58px)",
                lineHeight: "1.1",
                letterSpacing: "-0.03em",
              }}
            >
              Trois étapes
              <br />
              <em>simples</em>
            </h2>
          </div>
        </BlurFade>

        {/* Steps */}
        <div className="mx-auto max-w-2xl space-y-0">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const delays = [0.2, 0.35, 0.5];

            return (
              <BlurFade key={step.n} delay={delays[index]} inView>
                <div className="relative flex items-start gap-8 pb-16 last:pb-0">
                  {/* Left column */}
                  <div className="flex shrink-0 flex-col items-center gap-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[--border-default] bg-[--bg-card] shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
                      <span className="font-[family-name:var(--font-syne)] text-xs font-bold text-[--text-primary]">
                        {step.n}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="mt-2 min-h-[60px] w-px bg-gradient-to-b from-[--border-default] to-transparent" />
                    )}
                  </div>

                  {/* Right column */}
                  <div className="pb-8 pt-1.5">
                    <p className="mb-1 font-[family-name:var(--font-syne)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">
                      Étape 0{step.n}
                    </p>
                    <h3 className="mb-3 text-xl font-medium leading-snug text-[--text-primary]">
                      {step.title}
                    </h3>
                    <p className="max-w-sm text-[15px] leading-relaxed text-[--text-secondary]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
