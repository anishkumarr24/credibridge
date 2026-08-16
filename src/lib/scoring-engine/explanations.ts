import { ScoreFactorResult, ConfidenceResult, OBMFactorResult } from "./types";

export function generateExplanations(
  income: ScoreFactorResult,
  payment: ScoreFactorResult,
  trend: ScoreFactorResult,
  tenure: ScoreFactorResult,
  confidence: ConfidenceResult | null
): string[] {
  const explanations: string[] = [];

  if (!income.excluded && income.n && income.cv !== undefined && income.cv !== null) {
    const cvPct = Math.round(income.cv * 100);
    const bandLabel = getInterpolatedBandLabel(income.raw || 0);
    let str = `Your earnings varied by about ${cvPct}% relative to your typical month over the last ${income.n} months, which is considered ${bandLabel}.`;
    if (income.raw && Math.abs(income.value - income.raw) > 2) {
      str += ` A statistical adjustment was applied because ${income.n} months is still a relatively short history.`;
    }
    explanations.push(str);
  }

  if (!payment.excluded && payment.n && payment.onTimePct !== undefined) {
    const pct = Math.round(payment.onTimePct);
    let str = `${pct}% of your ${payment.n} recorded payments were made on or before the due date.`;
    if (payment.raw && Math.abs(payment.value - payment.raw) > 2) {
      str += ` A small statistical adjustment was applied because ${payment.n} records is not yet a long history.`;
    }
    explanations.push(str);
  }

  if (!trend.excluded && trend.n && trend.slopePct !== undefined) {
    const slope = trend.slopePct;
    const direction = slope > 1 ? "an upward" : slope < -1 ? "a downward" : "a stable";
    let str = `Your earnings show ${direction} trend of about ${Math.abs(slope).toFixed(1)}% per month over ${trend.n} months.`;
    if (trend.n < 12) {
      str += ` Seasonal adjustment was not applied because at least 12 months of history is needed.`;
    } else if (trend.seasonalAdjusted) {
      str += ` This trend has been adjusted for normal seasonal variations across the year.`;
    }
    explanations.push(str);
  }

  if (!tenure.excluded && tenure.months !== undefined) {
    explanations.push(`Your platform tenure is ${tenure.months} months.`);
  }

  if (confidence) {
    explanations.push(
      `Your score is based on ${income.n || 0} months of earnings data, ${payment.n || 0} payment records, and ${Math.round(confidence.breakdown.profileCompleteness)}% profile completeness — giving this score ${confidence.tier} confidence.`
    );
  }

  return explanations;
}

/**
 * Generates a single concise explanation string for a specific factor.
 * Called server-side only; result is passed to the frontend as a string.
 */
export function generateFactorExplanation(
  factorKey: "income" | "payment" | "trend" | "tenure" | "obm",
  factor: ScoreFactorResult | OBMFactorResult,
  contribution: number | null
): string {
  if (factor.excluded) {
    if (factorKey === "obm") {
      return "No verified recurring-obligation records are available yet, so this factor is not included in your score — the other factors' weights adjust accordingly, and this is not treated as a negative signal.";
    }
    return "This factor is excluded — not enough data available.";
  }

  switch (factorKey) {
    case "income": {
      if (factor.cv === null || factor.cv === undefined || factor.n === undefined) {
        return "Income consistency could not be calculated with the available data.";
      }
      const cvPct = Math.round(factor.cv * 100);
      const label = getInterpolatedBandLabel(factor.raw || 0);
      let msg = `Your monthly earnings varied by ${cvPct}% (${label} volatility) over ${factor.n} months.`;
      if (contribution !== null) msg += ` This contributed ${contribution > 0 ? "+" : ""}${contribution} points.`;
      return msg;
    }
    case "payment": {
      if (factor.onTimePct === undefined || factor.n === undefined) {
        return "Payment regularity could not be calculated with the available data.";
      }
      const pct = Math.round(factor.onTimePct);
      let msg = `${pct}% of your ${factor.n} payments were on time or early.`;
      if (contribution !== null) msg += ` This contributed ${contribution > 0 ? "+" : ""}${contribution} points.`;
      return msg;
    }
    case "trend": {
      if (factor.slopePct === undefined || factor.n === undefined) {
        return "Earnings trend could not be calculated with the available data.";
      }
      const slope = factor.slopePct;
      const direction = slope > 1 ? "growing" : slope < -1 ? "declining" : "stable";
      const seasonal = factor.seasonalAdjusted ? " (seasonally adjusted)" : "";
      let msg = `Your earnings trend is ${direction} at ${Math.abs(slope).toFixed(1)}% per month${seasonal} over ${factor.n} months.`;
      if (contribution !== null) msg += ` This contributed ${contribution > 0 ? "+" : ""}${contribution} points.`;
      return msg;
    }
    case "tenure": {
      if (factor.months === undefined) {
        return "Platform tenure data is not available.";
      }
      const years = factor.months >= 12 ? `${Math.floor(factor.months / 12)} year(s) and ` : "";
      const months = factor.months % 12;
      let msg = `You have ${years}${months} month(s) of verified platform activity.`;
      if (contribution !== null) msg += ` This contributed ${contribution > 0 ? "+" : ""}${contribution} points.`;
      return msg;
    }
    case "obm": {
      const obmFactor = factor as OBMFactorResult;
      const vobrPct = Math.round(obmFactor.vobr * 100);
      let msg = `Your verified recurring obligations (rent, utilities, and other recorded recurring payments) average ₹${obmFactor.verified_monthly_obligations} per month, against your typical monthly earnings of ₹${obmFactor.median_e || 0} — a ratio of ${vobrPct}%.`;
      
      if (obmFactor.multiplier < 1.0) {
        msg += " Your recorded obligations are generally paid on time, so the system applies only a reduced penalty for the size of that burden.";
      } else if (obmFactor.multiplier > 1.0) {
        msg += " Your verified obligations are high relative to your typical earnings, and a pattern of late or missed payments on those obligations increases the impact on this factor.";
      } else if (obmFactor.vobr < 0.4) {
        msg += " Your verified recurring obligations are modest relative to your typical earnings, so this factor contributes close to its maximum.";
      }

      if (obmFactor.raw && Math.abs(obmFactor.value - obmFactor.raw) > 2) {
        msg += ` This factor is based on ${obmFactor.n} month(s) of verified obligation records; a small statistical adjustment was applied because ${obmFactor.n} month(s) is not yet a long history.`;
      }

      if (contribution !== null) msg += ` This contributed ${contribution > 0 ? "+" : ""}${contribution} points.`;
      return msg;
    }
    default:
      return "Factor explanation unavailable.";
  }
}

function getInterpolatedBandLabel(rawScore: number): string {
  if (rawScore >= 90) return "excellent";
  if (rawScore >= 70) return "stable";
  if (rawScore >= 50) return "moderate";
  if (rawScore >= 30) return "volatile";
  return "highly erratic";
}

