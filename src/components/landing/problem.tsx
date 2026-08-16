"use client";

import { motion } from "framer-motion";
import { AlertCircle, FileX, Landmark } from "lucide-react";

export function ProblemSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            The Invisible Economy
          </h2>
          <p className="text-lg text-muted-foreground">
            Millions of gig workers and informal earners are financially active and responsible, yet remain invisible to traditional credit bureaus.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card border rounded-2xl p-8"
          >
            <div className="bg-destructive/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-destructive">
              <Landmark className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Traditional Bureaus Fail</h3>
            <p className="text-muted-foreground">
              Legacy scoring models rely entirely on formal loans and credit cards. If you haven&apos;t had credit before, you can&apos;t get credit now.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card border rounded-2xl p-8"
          >
            <div className="bg-orange-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-orange-500">
              <FileX className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No Formal Payslips</h3>
            <p className="text-muted-foreground">
              Income is real but variable. Without standard W-2s or corporate salary slips, lenders automatically reject applications.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card border rounded-2xl p-8"
          >
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-primary">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">The Opportunity Cost</h3>
            <p className="text-muted-foreground">
              Hardworking individuals are forced into predatory lending, paying exorbitant interest rates despite actually being low-risk borrowers.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
