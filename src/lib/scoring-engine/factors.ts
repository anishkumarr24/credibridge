import { SCORING_CONSTANTS } from "./constants";
import { ScoreFactorResult, WorkerData } from "./types";
import { median, mad, bayesianShrink, interpolate, daysBetween, theilSenSlope, deseasonalize } from "./math-utils";

export function computeIncomeConsistency(worker: WorkerData): ScoreFactorResult {
  const earnings = worker.earnings;
  const n = earnings.length;
  if (n < 2) return { value: 0, excluded: true, n };

  const amounts = earnings.map(e => e.netEarnings);
  const med = median(amounts);
  
  if (med <= 0) {
    // Edge case where earnings are 0, CV is essentially infinite or ill-defined
    const raw = 10;
    const shrunk = bayesianShrink(n, raw, SCORING_CONSTANTS.PRIOR, SCORING_CONSTANTS.SHRINKAGE_K_INCOME);
    return { value: shrunk, n, raw, cv: null };
  }

  const madValue = mad(amounts);
  const cv = madValue / med;
  
  const raw = interpolate(cv, SCORING_CONSTANTS.CV_BREAKPOINTS, 100, 10);
  const shrunk = bayesianShrink(n, raw, SCORING_CONSTANTS.PRIOR, SCORING_CONSTANTS.SHRINKAGE_K_INCOME);

  return { value: shrunk, n, raw, cv, median_e: med };
}

export function computePaymentRegularity(worker: WorkerData): ScoreFactorResult {
  const payments = worker.payments;
  const n = payments.length;
  if (n === 0) return { value: 0, excluded: true, n };

  let totalPoints = 0;
  let onTimeCount = 0;

  for (const p of payments) {
    if (p.isUnpaid) {
      // Unpaid gets 0 points
      continue;
    }
    
    // Safety check: if paidDate is null but not explicitly marked unpaid, it shouldn't be included as usable per spec
    // However, our worker.payments filtering should exclude them. If they slip through, skip them.
    if (!p.paidDate) continue;

    const delta = daysBetween(p.paidDate, p.dueDate);
    if (delta <= 0) {
      totalPoints += 100;
      onTimeCount++;
    } else if (delta <= 5) {
      totalPoints += 85;
    } else if (delta <= 15) {
      totalPoints += 50;
    } else {
      totalPoints += 15;
    }
  }

  const raw = totalPoints / n;
  const onTimePct = (onTimeCount / n) * 100;
  const shrunk = bayesianShrink(n, raw, SCORING_CONSTANTS.PRIOR, SCORING_CONSTANTS.SHRINKAGE_K_PAYMENT);

  return { value: shrunk, n, raw, onTimePct };
}

export function computeEarningsTrend(worker: WorkerData): ScoreFactorResult {
  // Spec says ordered chronologically
  const earnings = [...worker.earnings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const n = earnings.length;
  
  if (n < 2) return { value: 0, excluded: true, n };

  let amounts = earnings.map(e => e.netEarnings);
  const med = median(amounts);
  
  let seasonalAdjusted = false;
  if (n >= 12) {
    const dates = earnings.map(e => e.date);
    amounts = deseasonalize(amounts, dates);
    seasonalAdjusted = true;
  }

  const slope = theilSenSlope(amounts);
  
  // Normalized slope: percentage of median per month
  const normSlopePct = med > 0 ? (slope / med) * 100 : 0;
  
  const raw = interpolate(normSlopePct, SCORING_CONSTANTS.TREND_BREAKPOINTS, 10, 100);
  const shrunk = bayesianShrink(n, raw, SCORING_CONSTANTS.PRIOR, SCORING_CONSTANTS.SHRINKAGE_K_TREND);

  return { value: shrunk, n, raw, slopePct: normSlopePct, seasonalAdjusted };
}

export function computePlatformTenure(worker: WorkerData): ScoreFactorResult {
  if (worker.profile.platformTenureMonths === null) {
    return { value: 0, excluded: true };
  }

  const m = Math.max(0, worker.profile.platformTenureMonths);
  const raw = 100 * Math.log(1 + m) / Math.log(1 + SCORING_CONSTANTS.TENURE_CAP_MONTHS);
  const cappedValue = Math.min(raw, 100);

  return { value: cappedValue, months: m };
}
