"use client";

import { useTranslations } from "next-intl";
import { BlurFade } from "@/components/ui/blur-fade";

export default function HowItWorksSection() {
  const t = useTranslations("landing");

  const stepKeys = [
    { key: "step1" as const, n: 1 },
    { key: "step2" as const, n: 2 },
    { key: "step3" as const, n: 3 },
  ];
  return (
    <section id="how-it-works" className="relative overflow-hidden border-y border-[--border-subtle] bg-[--bg-subtle] py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Section header */}
        <BlurFade delay={0.1} inView>
          <div className="mb-20 text-center">
            <div className="mb-6 inline-flex items-center justify-center">
              <div className="cursor-default rounded-full border border-[--border-default] bg-[--bg-card] px-4 py-1.5">
                <span className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
                  {t("howItWorks.badge")}
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
              {t("howItWorks.heading")}
            </h2>
          </div>
        </BlurFade>

        {/* Steps */}
        <div className="mx-auto max-w-2xl space-y-0">
          {stepKeys.map((step, index) => {
            const isLast = index === stepKeys.length - 1;
            const delays = [0.2, 0.35, 0.5];

            return (
              <BlurFade key={step.n} delay={delays[index]} inView>
                <div className="relative flex items-start gap-8 pb-16 last:pb-0">
                  {/* Left column */}
                  <div className="flex shrink-0 flex-col items-center gap-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[--accent-border] bg-[--accent-bg] shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
                      <span className="font-[family-name:var(--font-syne)] text-xs font-bold text-[--accent]">
                        {step.n}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="mt-2 min-h-[60px] w-px bg-gradient-to-b from-[--accent-border] to-transparent" />
                    )}
                  </div>

                  {/* Right column */}
                  <div className="pb-8 pt-1.5">
                    <p className="mb-1 font-[family-name:var(--font-syne)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[--accent-muted]">
                      Step 0{step.n}
                    </p>
                    <h3 className="mb-3 text-xl font-medium leading-snug text-[--text-primary]">
                      {t(`howItWorks.${step.key}Title`)}
                    </h3>
                    <p className="max-w-sm text-[15px] leading-relaxed text-[--text-secondary]">
                      {t(`howItWorks.${step.key}Description`)}
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