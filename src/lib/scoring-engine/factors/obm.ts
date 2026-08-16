import { WorkerData, OBMFactorResult } from "../types";
import { computeVerifiedMonthlyObligations } from "../financial-utils";
import { bayesianShrink, interpolate } from "../math-utils";
import { SCORING_CONSTANTS } from "../constants";

const BURDEN_BREAKPOINTS = [
  { value: 0.00, score: 100 },
  { value: 0.40, score: 95 },
  { value: 0.60, score: 85 },
  { value: 0.80, score: 70 },
  { value: 1.00, score: 50 },
  { value: 1.30, score: 20 },
];

const MULTIPLIER_BREAKPOINTS = [
  { value: 0, score: 1.75 },
  { value: 40, score: 1.30 },
  { value: 70, score: 1.00 },
  { value: 90, score: 0.55 },
  { value: 100, score: 0.35 },
];

export function evaluateOBM(
  worker: WorkerData,
  medianMonthlyEarnings: number | undefined,
  paymentRegularityValue: number | undefined
): OBMFactorResult {
  const { verified_monthly_obligations, n_months } = computeVerifiedMonthlyObligations(worker);

  // Excluded if median earnings are unavailable or no obligation records exist
  if (!medianMonthlyEarnings || medianMonthlyEarnings === 0 || n_months === 0) {
    return {
      value: 0,
      vobr: 0,
      raw: 0,
      burden_score: 0,
      multiplier: 1,
      verified_monthly_obligations: 0,
      excluded: true,
      months: 0,
      n: 0,
    };
  }

  const vobr = verified_monthly_obligations / medianMonthlyEarnings;
  
  const burdenHeadroomScore = interpolate(vobr, BURDEN_BREAKPOINTS, 100, 20);
  const burdenPenalty = 100 - burdenHeadroomScore;
  
  // Default to 1.0 (neutral) if payment regularity is not available for some reason
  const multiplier = paymentRegularityValue !== undefined
    ? interpolate(paymentRegularityValue, MULTIPLIER_BREAKPOINTS, 1.75, 0.35)
    : 1.0;
    
  const adjustedPenalty = Math.min(burdenPenalty * multiplier, 80);
  const rawOBM = 100 - adjustedPenalty;
  
  const K_OBM = 3;
  const PRIOR = SCORING_CONSTANTS.PRIOR;
  
  const finalScore = bayesianShrink(n_months, rawOBM, PRIOR, K_OBM);

  return {
    value: finalScore,
    vobr,
    raw: rawOBM,
    burden_score: burdenHeadroomScore,
    multiplier,
    verified_monthly_obligations,
    excluded: false,
    months: n_months,
    n: n_months,
  };
}
