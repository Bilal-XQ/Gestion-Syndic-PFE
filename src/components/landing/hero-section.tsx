"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { LightRays } from "@/components/ui/light-rays";
import { BlurFade } from "@/components/ui/blur-fade";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { BorderBeam } from "@/components/ui/border-beam";

export default function HeroSection() {
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
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Layer 1 — Base gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 130% 80% at 50% -10%, #1f1f1f 0%, #111111 40%, #0a0a0a 70%)"
            : "radial-gradient(ellipse 130% 80% at 50% -10%, #e8e8e6 0%, #efefed 40%, #f7f7f5 70%)",
        }}
      />

      {/* Layer 2 — LightRays */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ opacity: isDark ? 0.4 : 0.2 }}
      >
        <LightRays />
      </div>

      {/* Layer 3 — Particles */}
      {mounted && (
        <Particles
          className="absolute inset-0 z-[2]"
          quantity={80}
          staticity={30}
          ease={60}
          size={0.5}
          color={particleColor}
          refresh
        />
      )}

      {/* Layer 4 — Centre glow (amber) */}
      {isDark && (
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            background:
              "radial-gradient(ellipse 50% 35% at 50% 45%, var(--accent-glow), transparent 70%)",
          }}
        />
      )}

      {/* Layer 5 — Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[4] h-40"
        style={{
          background: "linear-gradient(to top, var(--bg-base), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-32 text-center">
        {/* 1. Top badge */}
        <BlurFade delay={0.1} inView>
          <div className="mb-8 inline-flex items-center justify-center">
            <div className="cursor-default rounded-full border border-[--accent-border] bg-[--accent-bg] px-4 py-1.5">
              <AnimatedShinyText className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
                ✦ Gestion de copropriété
              </AnimatedShinyText>
            </div>
          </div>
        </BlurFade>

        {/* 2. Headline */}
        <BlurFade delay={0.2} inView>
          <h1
            className="font-[family-name:var(--font-instrument-serif)] text-[--text-primary]"
            style={{
              fontSize: "clamp(52px, 6.5vw, 88px)",
              lineHeight: "1.02",
              letterSpacing: "-0.03em",
            }}
          >
            La gestion de
            <br />
            <em>copropriété,</em>
            <br />
            <em>réinventée.</em>
          </h1>
        </BlurFade>

        {/* 3. Subheadline */}
        <BlurFade delay={0.35} inView>
          <p className="mx-auto mt-7 max-w-[440px] text-lg leading-[1.65] text-[--text-secondary]">
            Une plateforme moderne pour syndics et copropriétaires.
            Paiements, réunions, charges — centralisés et sécurisés.
          </p>
        </BlurFade>

        {/* 4. CTA row */}
        <BlurFade delay={0.5} inView>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {/* Primary CTA with BorderBeam */}
            <div className="relative">
              <Link
                href="/login"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-[--radius-md] bg-[--btn-primary-bg] px-8 py-3 text-sm font-medium text-[--btn-primary-text] shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all duration-[250ms] hover:bg-[--btn-primary-hover] active:scale-[0.98]"
              >
                Commencer maintenant
                <BorderBeam
                  size={100}
                  duration={8}
                  colorFrom={beamFrom}
                  colorTo={beamTo}
                />
              </Link>
            </div>

            {/* Ghost CTA */}
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-[--radius-md] border border-[--border-default] bg-transparent px-8 py-3 text-sm font-medium text-[--text-secondary] transition-all duration-[250ms] hover:border-[--border-strong] hover:bg-[--bg-card] hover:text-[--text-primary]"
            >
              Voir les fonctionnalités
              <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
            </a>
          </div>
        </BlurFade>

        {/* 5. Scroll indicator */}
        <BlurFade delay={0.7} inView>
          <div className="mt-20 flex flex-col items-center gap-2 text-[--text-muted]">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-[--accent] to-transparent opacity-60" />
            </motion.div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
