import { EngineResult } from "@/lib/scoring-engine/types";

export type RiskTier = {
  lti: number;
  max_tenure: number;
  rate_mid: number;
  guarantor: string | boolean;
};

export const RISK_TIERS: Record<string, RiskTier> = {
  "Very Strong":      { lti: 4.0, max_tenure: 24, rate_mid: 0.13, guarantor: false },
  "Strong":           { lti: 3.0, max_tenure: 18, rate_mid: 0.155, guarantor: false },
  "Moderate":         { lti: 2.0, max_tenure: 12, rate_mid: 0.185, guarantor: "optional" },
  "Emerging":         { lti: 1.0, max_tenure: 6,  rate_mid: 0.22, guarantor: "recommended" },
  "Building History": { lti: 0.5, max_tenure: 3,  rate_mid: 0.26, guarantor: true },
};

export const CONFIDENCE_TENURE_CAP: Record<string, number | null> = {
  HIGH: null,
  MEDIUM: 18,
  LOW: 6,
};

export type LoanEligibilityResult = {
  status: "ELIGIBLE" | "NOT_ELIGIBLE";
  reason?: string;
  recommended_amount?: number;
  tenure_months?: number;
  indicative_rate_band?: [number, number];
  estimated_emi?: number;
  affordable_emi_ceiling?: number;
  affordability_ceiling?: number;
  binding_constraint?: "affordability" | "loan-to-income" | "expense-adjusted";
  guarantor_required?: string | boolean;
  explanations?: string[];
  lti_ceiling?: number;
  expense_adjusted_ceiling?: number;
};

function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

export function calculateLoanEligibility(phase5Result: EngineResult): LoanEligibilityResult {
  if (phase5Result.status === "INSUFFICIENT_DATA" || !phase5Result.confidence) {
    return {
      status: "NOT_ELIGIBLE",
      reason: "Not yet eligible for a loan recommendation — add at least 2 months of earnings data to unlock this."
    };
  }

  if (phase5Result.factors.income.excluded) {
    return {
      status: "NOT_ELIGIBLE",
      reason: "Not yet eligible for a loan recommendation — add at least 2 months of earnings data to unlock this."
    };
  }

  const band = phase5Result.band;
  if (!band || !RISK_TIERS[band]) {
    return {
      status: "NOT_ELIGIBLE",
      reason: "Invalid score band."
    };
  }

  const tier = RISK_TIERS[band];
  const conf_tier = phase5Result.confidence?.tier || "LOW";
  const conf_cap = CONFIDENCE_TENURE_CAP[conf_tier];

  const n = conf_cap !== null ? Math.min(tier.max_tenure, conf_cap) : tier.max_tenure;

  const income_consistency = phase5Result.factors.income.value;
  const median_earnings = phase5Result.factors.income.median_e;

  if (median_earnings === undefined) {
    return {
      status: "NOT_ELIGIBLE",
      reason: "Not yet eligible for a loan recommendation — add at least 2 months of earnings data to unlock this."
    };
  }

  // Affordability leg
  const ratio = 0.20 + 0.15 * (income_consistency / 100);
  const affordable_emi = median_earnings * ratio;
  const i = tier.rate_mid / 12;
  const p_affordability = affordable_emi * (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));

  // LTI leg
  const p_lti = median_earnings * tier.lti;

  // Expense-Adjusted leg
  const verified_monthly_obligations = phase5Result.factors.obm?.verified_monthly_obligations || 0;
  const net_monthly_capacity = median_earnings - verified_monthly_obligations;
  const expense_adjusted_emi = Math.max(net_monthly_capacity * 0.80, 0);
  const p_expense_adjusted = expense_adjusted_emi * (Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n));

  // Reconcile
  const candidates: Record<"affordability" | "loan-to-income" | "expense-adjusted", number> = {
    "affordability": p_affordability,
    "loan-to-income": p_lti,
    "expense-adjusted": p_expense_adjusted
  };

  let binding: "affordability" | "loan-to-income" | "expense-adjusted" = "affordability";
  let min_candidate = candidates[binding];
  for (const key of Object.keys(candidates) as Array<keyof typeof candidates>) {
    if (candidates[key] < min_candidate) {
      binding = key;
      min_candidate = candidates[key];
    }
  }

  const recommended = roundToNearest(min_candidate, 500);
  const actual_emi = recommended * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

  const formatCurrency = (val: number) => Math.round(val).toLocaleString('en-IN');

  const explanations = [
    `Based on your Income Consistency score, we use an affordability ratio of ${Math.round(ratio * 100)}%, giving an affordable monthly payment of ₹${formatCurrency(affordable_emi)}.`,
    `Your score band (${band}) allows up to ${tier.lti}× your average monthly earnings (₹${formatCurrency(median_earnings)}), which is ₹${formatCurrency(p_lti)}.`
  ];
  
  if (verified_monthly_obligations > 0) {
    explanations.push(`After your verified obligations, your estimated monthly surplus is ₹${formatCurrency(net_monthly_capacity)}; we recommend committing no more than 80% of that (₹${formatCurrency(expense_adjusted_emi)}) to a loan payment.`);
  }

  explanations.push(`Because your confidence tier is ${conf_tier}, the maximum tenure considered is ${n} months.`);

  if (binding === "expense-adjusted") {
    explanations.push(`Your recommended amount was set by your expense-adjusted limit, not your score or loan-to-income limit.`);
  } else {
    explanations.push(`Your recommended amount, ₹${formatCurrency(recommended)} over ${n} months, was set by your ${binding} limit.`);
  }

  if (actual_emi < affordable_emi) {
    explanations.push(`At this amount and tenure, your estimated monthly payment is ₹${formatCurrency(actual_emi)}, which is well within your affordable range of ₹${formatCurrency(affordable_emi)}.`);
  }

  return {
    status: "ELIGIBLE",
    recommended_amount: recommended,
    tenure_months: n,
    indicative_rate_band: [tier.rate_mid - 0.01, tier.rate_mid + 0.01],
    estimated_emi: actual_emi,
    affordable_emi_ceiling: affordable_emi,
    affordability_ceiling: p_affordability,
    binding_constraint: binding,
    guarantor_required: tier.guarantor,
    explanations: explanations,
    lti_ceiling: p_lti,
    expense_adjusted_ceiling: p_expense_adjusted
  };
}
