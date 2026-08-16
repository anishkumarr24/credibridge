"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { APP_NAME, DISCLAIMER } from "@/config/constants";


const footerSections = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Methodology", href: "/#explainability" },
      { label: "Fairness", href: "/#explainability" },
      { label: "Demo", href: "/login" },
    ],
  },
  {
    title: "For Workers",
    links: [
      { label: "Build Your Profile", href: "/dashboard/worker" },
      { label: "Score Explainability", href: "/#explainability" },
      { label: "Data Privacy", href: "/#how-it-works" },
    ],
  },
  {
    title: "For Lenders",
    links: [
      { label: "Lender Dashboard", href: "/dashboard/lender" },
      { label: "Evidence-Based Review", href: "/#lenders" },
      { label: "Transparency", href: "/#explainability" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function Footer() {  
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Turning real financial behaviour into explainable credit access for
              gig and informal-sector workers.
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="border-t py-6">
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
            {DISCLAIMER}
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t py-4">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} {APP_NAME}. Built for SIH 2026.
          </p>
        </div>
      </div>
    </footer>
  );
}
