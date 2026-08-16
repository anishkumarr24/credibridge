"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Wallet, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
              <ShieldCheck className="h-4 w-4" />
              Built for SIH 2026
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Your financial behaviour <br className="hidden sm:block" />
            <span className="text-gradient">deserves to be seen.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            CrediBridge converts real earnings and payment behaviour into an
            explainable credit profile for gig and informal-sector workers.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="xl" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Build My Credit Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Abstract animated visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-16 md:mt-24 relative mx-auto max-w-5xl"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl -z-10" />
          <div className="glass rounded-3xl border shadow-2xl p-6 sm:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Signals */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border">
                  <div className="bg-blue-500/10 p-2 rounded-md text-blue-500">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-muted rounded-full mb-2" />
                    <div className="h-1.5 w-16 bg-muted/60 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border opacity-75 translate-x-4">
                  <div className="bg-green-500/10 p-2 rounded-md text-green-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-20 bg-muted rounded-full mb-2" />
                    <div className="h-1.5 w-12 bg-muted/60 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Scoring Engine processing */}
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="h-20 w-20 sm:h-24 sm:w-24 bg-card border shadow-lg rounded-2xl flex items-center justify-center relative z-10">
                  <Activity className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                </div>
              </div>

              {/* Output Score */}
              <div className="flex-1 flex justify-end">
                <div className="bg-card border shadow-lg rounded-xl p-6 text-center min-w-[200px]">
                  <p className="text-sm text-muted-foreground font-medium mb-2">CrediBridge Score</p>
                  <p className="text-5xl font-bold text-gradient mb-2">742</p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3" />
                    Good Potential
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background gradients */}
      <div className="absolute top-0 -z-20 h-full w-full bg-background">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px] translate-x-1/3 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-chart-4/5 blur-[100px] -translate-x-1/3 translate-y-1/3" />
      </div>
    </section>
  );
}
