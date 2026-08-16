import { WorkerData, EngineResult } from "./types";
import { SCORING_CONSTANTS } from "./constants";
import { computeIncomeConsistency, computePaymentRegularity, computeEarningsTrend, computePlatformTenure } from "./factors";
import { evaluateOBM } from "./factors/obm";
import { computeConfidence } from "./confidence";
import { generateExplanations, generateFactorExplanation } from "./explanations";

export function computeCrediBridgeScore(worker: WorkerData): EngineResult {
  const incomeFactor = computeIncomeConsistency(worker);
  const paymentFactor = computePaymentRegularity(worker);

  const factors = {
    income: incomeFactor,
    payment: paymentFactor,
    trend: computeEarningsTrend(worker),
    tenure: computePlatformTenure(worker),
    obm: evaluateOBM(worker, incomeFactor.median_e, paymentFactor.value),
  };

  const includedKeys = Object.keys(factors).filter(k => !factors[k as keyof typeof factors].excluded) as (keyof typeof factors)[];

  if (includedKeys.length < 2) {
    return {
      score: null,
      band: null,
      status: "INSUFFICIENT_DATA",
      confidence: null,
      factors,
      contributions: { income: null, payment: null, trend: null, tenure: null, obm: null },
      factorExplanations: {
        income: generateFactorExplanation("income", factors.income, null),
        payment: generateFactorExplanation("payment", factors.payment, null),
        trend: generateFactorExplanation("trend", factors.trend, null),
        tenure: generateFactorExplanation("tenure", factors.tenure, null),
        obm: generateFactorExplanation("obm", factors.obm, null),
      },
      explanations: ["We do not have enough financial data to generate a reliable score yet."]
    };
  }

  // Weight redistribution
  let totalW = 0;
  for (const k of includedKeys) {
    totalW += SCORING_CONSTANTS.WEIGHTS_PCT[k];
  }

  // Compute per-factor raw contribution (before confidence cap) — server-side
  const rawContributions: Record<string, number> = {};
  let rawScore900 = 0;
  for (const k of includedKeys) {
    const subscore = factors[k].value;
    const originalWeight = SCORING_CONSTANTS.WEIGHTS_PCT[k];
    const adjustedWeight = originalWeight / totalW;
    const contribution = (subscore / 100) * adjustedWeight * 900;
    rawContributions[k] = contribution;
    rawScore900 += contribution;
  }

  // Confidence
  const confidence = computeConfidence(worker, factors.income.n || 0, factors.payment.n || 0);

  // Cap
  const cappedScore = Math.min(rawScore900, confidence.cap);
  const displayedScore = Math.round(cappedScore);

  // Apply the same cap ratio proportionally to contributions so they sum to displayedScore
  const capRatio = rawScore900 > 0 ? cappedScore / rawScore900 : 1;

  const contributions = {
    income: includedKeys.includes("income") ? Math.round(rawContributions["income"] * capRatio) : null,
    payment: includedKeys.includes("payment") ? Math.round(rawContributions["payment"] * capRatio) : null,
    trend: includedKeys.includes("trend") ? Math.round(rawContributions["trend"] * capRatio) : null,
    tenure: includedKeys.includes("tenure") ? Math.round(rawContributions["tenure"] * capRatio) : null,
    obm: includedKeys.includes("obm") ? Math.round(rawContributions["obm"] * capRatio) : null,
  };

  // Band lookup
  let band = SCORING_CONSTANTS.BANDS[SCORING_CONSTANTS.BANDS.length - 1].label;
  for (const b of SCORING_CONSTANTS.BANDS) {
    if (displayedScore >= b.min && displayedScore <= b.max) {
      band = b.label;
      break;
    }
  }

  // Per-factor explanations (server-computed, not duplicated on client)
  const factorExplanations = {
    income: generateFactorExplanation("income", factors.income, contributions.income),
    payment: generateFactorExplanation("payment", factors.payment, contributions.payment),
    trend: generateFactorExplanation("trend", factors.trend, contributions.trend),
    tenure: generateFactorExplanation("tenure", factors.tenure, contributions.tenure),
    obm: generateFactorExplanation("obm", factors.obm, contributions.obm),
  };

  const explanations = generateExplanations(
    factors.income,
    factors.payment,
    factors.trend,
    factors.tenure,
    confidence
  );

  return {
    score: displayedScore,
    band,
    status: "OK",
    confidence,
    factors,
    contributions,
    factorExplanations,
    explanations,
  };
}
