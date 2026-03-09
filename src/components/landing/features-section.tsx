"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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

const features = [
  {
    icon: Building2,
    title: "Gestion des immeubles",
    description:
      "Vue centralisée de vos bâtiments, appartements et lots avec hiérarchie complète.",
  },
  {
    icon: Users,
    title: "Copropriétaires",
    description:
      "Profils, accès au portail propriétaire et gestion des quotas de tantièmes.",
  },
  {
    icon: CreditCard,
    title: "Paiements & Charges",
    description:
      "Appels de charges, suivi en temps réel et gestion des créances par agrégation SQL.",
  },
  {
    icon: CalendarDays,
    title: "Réunions & AG",
    description:
      "Planifiez les assemblées générales, invitez les propriétaires et archivez les PV.",
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
      "JWT, RLS Supabase, journal d'audit immutable et chiffrement bout en bout.",
  },
];

export default function FeaturesSection() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";
  const gradientColor = isDark ? "#1f1f1f" : "#e8e8e6";

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
              <div className="cursor-default rounded-full border border-[--border-default] bg-[--bg-card] px-4 py-1.5">
                <span className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
                  Fonctionnalités
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
              Tout ce dont vous
              <br />
              <em>avez besoin</em>
            </h2>
          </div>
        </BlurFade>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <BlurFade key={feature.title} delay={0.2 + index * 0.1} inView>
                <MagicCard
                  className="rounded-[--radius-xl] border border-[--border-subtle] bg-[--bg-card] p-6 cursor-default"
                  gradientColor={gradientColor}
                  gradientOpacity={0.6}
                >
                  <div className="flex h-full min-h-[200px] flex-col">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[--radius-md] border border-[--border-default] bg-[--bg-subtle]">
                      <Icon className="h-4 w-4 text-[--text-secondary]" />
                    </div>
                    <h3 className="mb-2 text-[15px] font-medium leading-snug text-[--text-primary]">
                      {feature.title}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-[--text-muted]">
                      {feature.description}
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
