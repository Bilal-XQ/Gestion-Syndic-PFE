"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";

export default function CtaSection() {
  const t = useTranslations("landing");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";
  const particleColor = isDark ? "#ffffff" : "#000000";
  const beamFrom = isDark ? "#D4A853" : "#8B6520";
  const beamTo = isDark ? "#A07A32" : "#6B4E18";

  return (
    <section className="relative overflow-hidden border-y border-[--border-subtle] bg-[--bg-card] py-28">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, var(--accent-glow), transparent 70%)",
        }}
      />

      {/* Particles */}
      {mounted && (
        <Particles
          className="absolute inset-0 z-[1]"
          quantity={60}
          staticity={40}
          ease={80}
          color={particleColor}
        />
      )}

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        <BlurFade delay={0.1} inView>
          <h2
            className="font-[family-name:var(--font-instrument-serif)] text-[--text-primary]"
            style={{
              fontSize: "clamp(36px, 4.5vw, 62px)",
              lineHeight: "1.05",
              letterSpacing: "-0.03em",
            }}
          >
            {t("cta.heading")}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[--text-secondary]">
            {t("cta.description")}
          </p>
        </BlurFade>

        <BlurFade delay={0.3} inView>
          <div className="relative mt-10 inline-block">
            <Link
              href="/login"
              className="relative inline-flex items-center overflow-hidden rounded-[--radius-md] bg-[--btn-primary-bg] px-10 py-3.5 text-sm font-medium text-[--btn-primary-text] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-[250ms] hover:bg-[--btn-primary-hover] active:scale-[0.98]"
            >
              {t("cta.button")}
              <ArrowRight className="ml-2 h-4 w-4" />
              <BorderBeam
                size={120}
                duration={6}
                colorFrom={beamFrom}
                colorTo={beamTo}
              />
            </Link>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
