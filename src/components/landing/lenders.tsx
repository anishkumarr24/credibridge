"use client";

import { Building2, Shield, Lock, FileSpreadsheet } from "lucide-react";

export function LendersSection() {
  return (
    <section id="lenders" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Trusted by Micro-Lenders & NBFCs
          </h2>
          <p className="text-lg text-muted-foreground">
            We bridge the gap between financial institutions and the gig economy with verifiable, risk-assessed data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* For Borrowers */}
          <div className="bg-card border rounded-3xl p-8 lg:p-12">
            <Shield className="h-10 w-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Your Data, Your Control</h3>
            <p className="text-muted-foreground mb-6">
              You own your financial data. We use bank-grade encryption to secure your connected accounts. Your score and underlying data are never shared with a lender unless you explicitly grant permission.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-primary" /> End-to-end encryption
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-primary" /> Read-only API access
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-primary" /> Revoke access anytime
              </li>
            </ul>
          </div>

          {/* For Lenders */}
          <div className="bg-muted/50 border rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Building2 className="h-48 w-48" />
            </div>
            <Building2 className="h-10 w-10 text-foreground mb-6 relative z-10" />
            <h3 className="text-2xl font-bold mb-4 relative z-10">Lender Portal</h3>
            <p className="text-muted-foreground mb-6 relative z-10">
              Access a new, untapped market of reliable borrowers. Our Lender Portal provides comprehensive risk profiles, income verification, and default probability metrics derived from alternative data.
            </p>
            <ul className="space-y-3 relative z-10">
              <li className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-foreground" /> Verified Income Reports
              </li>
              <li className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-foreground" /> Automated Risk Assessment
              </li>
              <li className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-foreground" /> API Integration Support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
