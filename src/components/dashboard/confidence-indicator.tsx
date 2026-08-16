"use client";

import { ConfidenceResult } from "@/lib/scoring-engine/types";

interface ConfidenceIndicatorProps {
  confidence: ConfidenceResult;
}

const BREAKDOWN_ITEMS = [
  { key: "earningsCoverage",   label: "Earnings Coverage",    color: "#8b5cf6" },
  { key: "paymentCoverage",    label: "Payment Coverage",     color: "#10b981" },
  { key: "profileCompleteness", label: "Profile Completeness", color: "#3b82f6" },
  { key: "sourceDiversity",    label: "Source Diversity",     color: "#f59e0b" },
  { key: "dataValidity",       label: "Data Validity",        color: "#6366f1" },
] as const;

const TIER_CONFIG = {
  HIGH:   { label: "High Confidence",   bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  MEDIUM: { label: "Medium Confidence", bg: "bg-amber-100 dark:bg-amber-900/30",    text: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500"   },
  LOW:    { label: "Low Confidence",    bg: "bg-rose-100 dark:bg-rose-900/30",      text: "text-rose-700 dark:text-rose-400",     dot: "bg-rose-500"    },
};

export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const tier = TIER_CONFIG[confidence.tier];
  const overall = Math.round(confidence.score);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Data Confidence</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            How much data backs your score
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-2xl font-bold tabular-nums">{overall}%</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.bg} ${tier.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tier.dot}`} />
            {tier.label}
          </span>
        </div>
      </div>

      {/* Overall bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${overall}%`,
              background: "linear-gradient(90deg, #6366f1, #10b981)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>Score cap: {confidence.cap} / 900</span>
          <span>High</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5">
        {BREAKDOWN_ITEMS.map(({ key, label, color }) => {
          const val = Math.round(confidence.breakdown[key]);
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{val}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${val}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclosure */}
      <p className="text-xs text-muted-foreground/70 italic">
        This is a data completeness indicator, not a measure of statistical certainty.
      </p>
    </div>
  );
}
