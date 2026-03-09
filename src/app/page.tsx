import Navbar from "@/components/landing/navbar";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import HowItWorksSection from "@/components/landing/how-it-works-section";
import FaqSection from "@/components/landing/faq-section";
import CtaSection from "@/components/landing/cta-section";
import FooterSection from "@/components/landing/footer-section";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FaqSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
