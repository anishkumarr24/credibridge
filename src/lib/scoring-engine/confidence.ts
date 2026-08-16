import { WorkerData, ConfidenceResult } from "./types";

export function computeConfidence(worker: WorkerData, monthsOfEarnings: number, paymentRecordsCount: number): ConfidenceResult {
  const earnCov = Math.min(monthsOfEarnings / 6, 1) * 100;
  const payCov = Math.min(paymentRecordsCount / 10, 1) * 100;
  
  const profilePct = worker.profile.totalRequiredFields > 0 
    ? (worker.profile.filledRequiredFields / worker.profile.totalRequiredFields) * 100 
    : 0;
    
  const diversity = Math.min(worker.sources.distinctSources / 3, 1) * 100;
  
  const validity = worker.sources.totalRecords > 0 
    ? (worker.sources.validRecords / worker.sources.totalRecords) * 100 
    : 0;

  const score = (0.30 * earnCov) + (0.30 * payCov) + (0.20 * profilePct) + (0.10 * diversity) + (0.10 * validity);

  let tier: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let cap = 650;

  if (score >= 75) {
    tier = "HIGH";
    cap = 900;
  } else if (score >= 40) {
    tier = "MEDIUM";
    cap = 820;
  }

  return {
    score,
    tier,
    cap,
    breakdown: {
      earningsCoverage: earnCov,
      paymentCoverage: payCov,
      profileCompleteness: profilePct,
      sourceDiversity: diversity,
      dataValidity: validity
    }
  };
}
