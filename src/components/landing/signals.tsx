"use client";

import { motion } from "framer-motion";
import { Bike, CreditCard, Droplets, Home, Star, TrendingUp } from "lucide-react";

const signals = [
  {
    title: "Platform Earnings",
    description: "Consistent income verified directly from platforms like Uber, Swiggy, or Upwork.",
    icon: Bike,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Utility Payments",
    description: "Regular payments for electricity, water, or broadband demonstrating financial reliability.",
    icon: Droplets,
    color: "bg-cyan-500/10 text-cyan-500",
  },
  {
    title: "Rent & Housing",
    description: "Historical rent payments showing long-term commitment and stability.",
    icon: Home,
    color: "bg-indigo-500/10 text-indigo-500",
  },
  {
    title: "Digital Transactions",
    description: "UPI and digital wallet history revealing cash flow and spending habits.",
    icon: CreditCard,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Work Tenure & Ratings",
    description: "Customer ratings and account age on gig platforms acting as trust proxies.",
    icon: Star,
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    title: "Earnings Trend",
    description: "Income trajectory and consistency over time rather than just static snapshots.",
    icon: TrendingUp,
    color: "bg-green-500/10 text-green-500",
  },
];

export function SignalsSection() {
  return (
    <section id="signals" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Scoring what actually matters.
            </h2>
            <p className="text-lg text-muted-foreground">
              We look beyond W-2s and formal loans. CrediBridge connects securely to the platforms you already use to build a comprehensive picture of your financial responsibility.
            </p>
          </div>
          <div className="flex-1 w-full flex justify-center md:justify-end">
            <div className="relative w-full max-w-md aspect-square rounded-full border border-dashed border-primary/30 flex items-center justify-center p-8">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
              <div className="w-3/4 h-3/4 rounded-full border border-dashed border-primary/40 flex items-center justify-center">
                <div className="w-1/2 h-1/2 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-md border border-primary/30 shadow-[0_0_40px_rgba(var(--primary),0.2)]">
                  <span className="font-bold text-xl">You</span>
                </div>
              </div>
              
              {/* Floating Icons */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border shadow-lg p-3 rounded-2xl">
                <Bike className="w-6 h-6 text-blue-500" />
              </div>
              <div className="absolute bottom-1/4 right-0 translate-x-1/2 bg-card border shadow-lg p-3 rounded-2xl">
                <Droplets className="w-6 h-6 text-cyan-500" />
              </div>
              <div className="absolute bottom-1/4 left-0 -translate-x-1/2 bg-card border shadow-lg p-3 rounded-2xl">
                <Home className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {signals.map((signal, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative bg-card hover:bg-accent/50 transition-colors border rounded-2xl p-6"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${signal.color}`}>
                <signal.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{signal.title}</h3>
              <p className="text-sm text-muted-foreground">
                {signal.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
