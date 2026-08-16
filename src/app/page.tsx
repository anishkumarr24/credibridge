import { HeroSection } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { SignalsSection } from "@/components/landing/signals";
import { ExplainabilitySection } from "@/components/landing/explainability";
import { LendersSection } from "@/components/landing/lenders";
import { CTASection } from "@/components/landing/cta";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <SignalsSection />
      <ExplainabilitySection />
      <LendersSection />
      <CTASection />
    </main>
  );
}
