"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";


export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 -z-10" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
          Ready to unlock your financial potential?
        </h2>
        <p className="text-xl text-muted-foreground mb-10">
          Join thousands of independent workers building their credit profiles and accessing fair financial services.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" asChild>
            <Link href="/register">
              Create Your Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/register?role=lender">I&apos;m a Lender</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
