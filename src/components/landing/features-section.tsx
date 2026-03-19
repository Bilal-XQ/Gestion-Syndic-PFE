"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  Building2,
  Users,
  CreditCard,
  CalendarDays,
  BarChart3,
  Shield,
} from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { BlurFade } from "@/components/ui/blur-fade";

export default function FeaturesSection() {
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";
  const gradientColor = isDark ? "#1f1f1f" : "#e8e8e6";

  const featureKeys = [
    { key: "buildings" as const, icon: Building2 },
    { key: "owners" as const, icon: Users },
    { key: "payments" as const, icon: CreditCard },
    { key: "meetings" as const, icon: CalendarDays },
    { key: "dashboard" as const, icon: BarChart3 },
    { key: "security" as const, icon: Shield },
  ];

  return (
    <section
      id="features"
      className="relative overflow-hidden py-32"
      style={{
        background: isDark
          ? "radial-gradient(ellipse 80% 50% at 50% 100%, #161616 0%, #0d0d0d 50%, #0a0a0a 100%)"
          : "radial-gradient(ellipse 80% 50% at 50% 100%, #efefed 0%, #f3f3f1 50%, #f7f7f5 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Section header */}
        <BlurFade delay={0.1} inView>
          <div className="mb-20 text-center">
            <div className="mb-6 inline-flex items-center justify-center">
              <div className="cursor-default rounded-full border border-[--accent-border] bg-[--accent-bg] px-4 py-1.5">
                <span className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
                  {t("features.badge")}
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
              {t("features.heading")}
            </h2>
          </div>
        </BlurFade>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <BlurFade key={feature.key} delay={0.2 + index * 0.1} inView>
                <MagicCard
                  className="rounded-[--radius-xl] border border-[--border-subtle] bg-[--bg-card] p-6 cursor-default group"
                  gradientColor={gradientColor}
                  gradientOpacity={0.6}
                >
                  <div className="flex h-full min-h-[200px] flex-col">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[--radius-md] border border-[--border-default] bg-[--bg-subtle] transition-colors duration-[250ms] group-hover:border-[--accent-border] group-hover:bg-[--accent-bg]">
                      <Icon className="h-4 w-4 text-[--text-secondary] transition-colors duration-[250ms] group-hover:text-[--accent]" />
                    </div>
                    <h3 className="mb-2 text-[15px] font-medium leading-snug text-[--text-primary]">
                      {t(`features.${feature.key}.title`)}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-[--text-muted]">
                      {t(`features.${feature.key}.description`)}
                    </p>
                  </div>
                </MagicCard>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
