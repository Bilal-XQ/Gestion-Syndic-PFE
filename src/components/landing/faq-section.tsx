"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "À qui s'adresse Syndic ?",
    a: "À tous les syndics de copropriété qui veulent moderniser leur gestion et offrir un portail numérique à leurs copropriétaires.",
  },
  {
    q: "Faut-il installer quelque chose ?",
    a: "Non. Application web accessible depuis tout navigateur — desktop, tablette ou mobile. Aucune installation requise.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Supabase PostgreSQL avec Row Level Security. JWT signés, journal d'audit immutable, aucune valeur dérivée stockée.",
  },
  {
    q: "Combien de copropriétaires puis-je gérer ?",
    a: "Pas de limite technique. Architecture stateless et scalable sur Vercel + Supabase.",
  },
  {
    q: "Les copropriétaires peuvent-ils effectuer des paiements partiels ?",
    a: "Oui. Paiements partiels entièrement supportés — le solde est calculé en temps réel par agrégation SQL.",
  },
  {
    q: "Les notifications sont-elles en temps réel ?",
    a: "Oui. Via Supabase Realtime — sans rechargement de page, mise à jour instantanée.",
  },
  {
    q: "Puis-je générer des documents PDF ?",
    a: "Oui. Avis de paiement au format PDF via @react-pdf/renderer — pour le syndic comme pour le copropriétaire.",
  },
];

export default function FaqSection() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <section
      id="faq"
      className="py-32"
      style={{
        background: isDark
          ? "radial-gradient(ellipse 100% 60% at 50% 50%, #0f0f0f 0%, #0a0a0a 100%)"
          : "radial-gradient(ellipse 100% 60% at 50% 50%, #f3f3f1 0%, #f7f7f5 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Section header */}
        <BlurFade delay={0.1} inView>
          <div className="mb-16 text-center">
            <div className="mb-6 inline-flex items-center justify-center">
              <div className="cursor-default rounded-full border border-[--border-default] bg-[--bg-card] px-4 py-1.5">
                <span className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
                  FAQ
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
              Questions fréquentes
            </h2>
          </div>
        </BlurFade>

        {/* Accordion */}
        <BlurFade delay={0.2} inView>
          <div className="mx-auto max-w-2xl">
            <Accordion type="multiple" className="space-y-0">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-[--border-subtle] last:border-b-0"
                >
                  <AccordionTrigger className="py-5 text-[15px] font-medium text-[--text-primary] hover:no-underline hover:text-[--text-primary] [&>svg]:text-[--text-muted]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-relaxed text-[--text-secondary]">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
