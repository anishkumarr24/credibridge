"use client";

import { Link as LinkIcon, Activity, FileCheck, Share2 } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Connect Accounts securely",
      description: "Link your gig platform accounts, bank accounts, and utility providers. We only use read-only access.",
      icon: LinkIcon,
    },
    {
      number: "02",
      title: "Engine Analyzes Behaviour",
      description: "Our algorithm processes your earnings, consistency, and payment history to build a holistic profile.",
      icon: Activity,
    },
    {
      number: "03",
      title: "Get Your Score",
      description: "Receive a transparent credit score with a clear breakdown of every contributing factor.",
      icon: FileCheck,
    },
    {
      number: "04",
      title: "Share with Lenders",
      description: "Apply for micro-loans or credit cards by sharing your verified profile directly from the platform.",
      icon: Share2,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            How CrediBridge Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Four simple steps to transform your invisible financial behaviour into a verifiable credit identity.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-[2px] bg-border" />
              )}
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-card border shadow-sm flex items-center justify-center mb-6 text-primary">
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="text-sm font-bold text-primary/50 mb-2">{step.number}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
