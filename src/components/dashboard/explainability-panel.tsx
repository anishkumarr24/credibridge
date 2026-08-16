"use client";

import { EngineResult, ChartData } from "@/lib/scoring-engine/types";
import { SCORING_CONSTANTS } from "@/lib/scoring-engine/constants";
import { ScoreDial } from "./score-dial";
import { FactorCard, FactorKey, FactorCardProps } from "./factor-card";
import { ConfidenceIndicator } from "./confidence-indicator";
import { AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ExplainabilityPanelProps {
  engineResult: EngineResult;
  chartData: ChartData;
  userName: string;
}

// Max contribution for each factor (used only to size the score bar, never to compute the score)
// Derived from the factor's weight × 900 (max possible if all factors present and score = 100)
const MAX_CONTRIBUTIONS = {
  income:  SCORING_CONSTANTS.WEIGHTS_PCT.income  / 100 * 900,
  payment: SCORING_CONSTANTS.WEIGHTS_PCT.payment / 100 * 900,
  trend:   SCORING_CONSTANTS.WEIGHTS_PCT.trend   / 100 * 900,
  tenure:  SCORING_CONSTANTS.WEIGHTS_PCT.tenure  / 100 * 900,
  obm:     SCORING_CONSTANTS.WEIGHTS_PCT.obm     / 100 * 900,
};

const FACTOR_LABELS: Record<FactorKey, string> = {
  income:  "Income Consistency",
  payment: "Payment Regularity",
  trend:   "Earnings Trend",
  tenure:  "Platform Tenure",
  obm:     "Obligation Burden & Mgt",
};

export function ExplainabilityPanel({ engineResult, chartData, userName }: ExplainabilityPanelProps) {
  if (engineResult.status === "INSUFFICIENT_DATA" || engineResult.score === null) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Not enough data yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {engineResult.explanations[0] ?? "Add more financial data to generate your score."}
          </p>
        </div>
        <Link
          href="/dashboard/worker/financial-data"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
        >
          Add Financial Data
        </Link>
      </div>
    );
  }

  const { score, band, factors, contributions, factorExplanations, confidence } = engineResult;
  const { monthlyEarnings, paymentBreakdown, summary } = chartData;

  // Payment bar chart data for the payment factor card
  const paymentChartData = [
    { name: "On-time", value: paymentBreakdown.onTime,      color: "#10b981" },
    { name: "≤5d late", value: paymentBreakdown.lateUnder5, color: "#f59e0b" },
    { name: "≤15d", value: paymentBreakdown.lateUnder15,    color: "#f97316" },
    { name: ">15d", value: paymentBreakdown.lateOver15,     color: "#ef4444" },
    { name: "Missed",   value: paymentBreakdown.unpaid,     color: "#6b7280" },
  ].filter(d => d.value > 0);

  // Build factor card configs
  const factorCards: FactorCardProps[] = ([
    "income", "payment", "trend", "tenure", "obm"
  ] as FactorKey[]).map(key => {
    const factor = factors[key];
    const contribution = contributions[key];
    const isPositive = (contribution ?? 0) >= MAX_CONTRIBUTIONS[key] * 0.5;

    const card: FactorCardProps = {
      factorKey: key,
      label: FACTOR_LABELS[key],
      rawScore: factor.excluded ? 0 : factor.value,
      contribution,
      maxContribution: MAX_CONTRIBUTIONS[key],
      explanation: factorExplanations[key],
      excluded: factor.excluded ?? false,
      isPositive,
    };

    // Attach chart data only to relevant factors
    if (key === "trend" || key === "income") {
      card.earningsChart = monthlyEarnings;
      if (key === "income") {
        card.evidence = {
          "Avg. Monthly":   `₹${summary.avgMonthlyEarnings.toLocaleString()}`,
          "Median Monthly": `₹${summary.medianMonthlyEarnings.toLocaleString()}`,
          "Volatility":     `${summary.earningsVolatilityPct}%`,
          "Months of data": String(factor.n ?? 0),
        };
      } else {
        card.evidence = {
          "Months of data": String(factor.n ?? 0),
          "Seasonal adj.":  factor.seasonalAdjusted ? "Yes (≥12 mo.)" : "No (<12 mo.)",
        };
      }
    }

    if (key === "payment") {
      card.paymentChart = paymentChartData;
      card.evidence = {
        "Total payments":   String(paymentBreakdown.total),
        "On-time":          String(paymentBreakdown.onTime),
        "Missed / Unpaid":  String(paymentBreakdown.unpaid),
        "On-time rate":     `${summary.onTimePaymentPct}%`,
      };
    }

    if (key === "tenure") {
      const months = summary.platformTenureMonths ?? 0;
      card.evidence = {
        "Tenure (months)": String(months),
        "Years":           months >= 12 ? `${(months / 12).toFixed(1)} yrs` : "< 1 yr",
      };
    }

    if (key === "obm" && !factor.excluded) {
      const obmFactor = factor as import("@/lib/scoring-engine/types").OBMFactorResult;
      card.evidence = {
        "Verified Obs.": `₹${obmFactor.verified_monthly_obligations}`,
        "VOBR Ratio": `${Math.round(obmFactor.vobr * 100)}%`,
        "Burden Penalty": String(Math.round(100 - obmFactor.burden_score)),
        "Multiplier": String(obmFactor.multiplier.toFixed(2)),
      };
    }

    return card;
  });

  // Identify what is hurting the score (factors with rawScore < 60 and not excluded)
  const hurtingFactors = (["income", "payment", "trend", "tenure", "obm"] as FactorKey[]).filter(key => {
    const f = factors[key];
    return !f.excluded && f.value < 60;
  });

  // Identify what is helping (rawScore >= 70 and not excluded)
  const helpingFactors = (["income", "payment", "trend", "tenure", "obm"] as FactorKey[]).filter(key => {
    const f = factors[key];
    return !f.excluded && f.value >= 70;
  });

  return (
    <div className="space-y-8">
      {/* Score hero */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Score dial */}
          <div className="shrink-0">
            <ScoreDial score={score!} band={band!} />
          </div>

          {/* Score meta */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <h2 className="text-xl font-bold">
                {score! >= 750
                  ? `Great work, ${userName.split(" ")[0]}!`
                  : score! >= 500
                  ? `Your score is growing, ${userName.split(" ")[0]}.`
                  : `Keep building your profile, ${userName.split(" ")[0]}.`}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                CrediBridge demonstration score — not an official credit bureau score.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Stat label="Score" value={String(score)} />
              <Stat label="Out of" value="900" />
              <Stat label="Band" value={band!} />
              {confidence && (
                <Stat label="Confidence" value={`${Math.round(confidence.score)}%`} />
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-1">
              <Link
                href="/dashboard/worker/history"
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
              >
                <TrendingUp className="h-4 w-4" />
                Improve My Score
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
              >
                <RefreshCw className="h-4 w-4" />
                Recalculate
              </button>
            </div>
          </div>

          {/* Confidence indicator (desktop) */}
          {confidence && (
            <div className="hidden lg:block w-64 shrink-0">
              <ConfidenceIndicator confidence={confidence} />
            </div>
          )}
        </div>
      </div>

      {/* Helping / hurting summary bar */}
      {(helpingFactors.length > 0 || hurtingFactors.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {helpingFactors.length > 0 && (
            <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                ✅ What is helping your score
              </h3>
              <ul className="space-y-1">
                {helpingFactors.map(key => (
                  <li key={key} className="text-xs text-emerald-700 dark:text-emerald-300">
                    • <strong>{FACTOR_LABELS[key]}</strong>: {factorExplanations[key]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hurtingFactors.length > 0 && (
            <div className="rounded-xl border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                ⚠️ What is limiting your score
              </h3>
              <ul className="space-y-1">
                {hurtingFactors.map(key => (
                  <li key={key} className="text-xs text-rose-700 dark:text-rose-300">
                    • <strong>{FACTOR_LABELS[key]}</strong>: {factorExplanations[key]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Explainability heading */}
      <div>
        <h2 className="text-xl font-bold">Why your score is {score}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Each factor below is independently calculated from your financial data.
          No factor is hidden or combined into a black box.
        </p>
      </div>

      {/* Factor cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {factorCards.map(props => (
          <FactorCard key={props.factorKey} {...props} />
        ))}
      </div>

      {/* Confidence indicator (mobile) */}
      {confidence && (
        <div className="lg:hidden">
          <ConfidenceIndicator confidence={confidence} />
        </div>
      )}

      {/* Score explanations detail */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">Full Explanation</h3>
        <ul className="space-y-2">
          {engineResult.explanations.map((exp, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {exp}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
