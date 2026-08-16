"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Scale, XCircle } from "lucide-react";

export function ExplainabilitySection() {
  return (
    <section id="explainability" className="py-24 bg-muted/30 border-y">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
              <Scale className="h-4 w-4" />
              100% Transparent
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              No black boxes. <br />
              Just math you can see.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Credit scores shouldn&apos;t be a mystery. CrediBridge provides a clear, itemized breakdown of exactly what is impacting your score, positively or negatively. We specifically design our algorithms to accommodate the natural income volatility of gig work, without unfair penalties.
            </p>
            
            <ul className="space-y-4">
              {[
                "See the exact weight of each financial signal.",
                "Understand why your score changed.",
                "Get actionable tips to improve your profile.",
                "Volatility-aware algorithms that don't punish off-weeks.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Visual (Interactive-looking Scorecard) */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-3xl blur-2xl -z-10" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card border shadow-xl rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b bg-muted/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Score Breakdown</h3>
                    <p className="text-sm text-muted-foreground">Updated Today</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gradient">742</p>
                    <p className="text-sm font-medium text-green-500">+12 this month</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[74.2%] rounded-full" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>300</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Excellent</span>
                  <span>850</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Consistent Platform Earnings</p>
                      <p className="text-xs text-muted-foreground">High impact</p>
                    </div>
                  </div>
                  <span className="text-green-500 font-medium text-sm">+45 pts</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">On-time Utility Payments</p>
                      <p className="text-xs text-muted-foreground">Medium impact</p>
                    </div>
                  </div>
                  <span className="text-green-500 font-medium text-sm">+20 pts</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-sm">High Credit Utilization</p>
                      <p className="text-xs text-muted-foreground">Medium impact</p>
                    </div>
                  </div>
                  <span className="text-orange-500 font-medium text-sm">-15 pts</span>
                </div>

                <button className="w-full text-center text-sm font-medium text-primary flex items-center justify-center gap-1 mt-4 hover:underline">
                  View Full Report <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
