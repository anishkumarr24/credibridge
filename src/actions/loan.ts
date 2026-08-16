"use server";

import { calculateWorkerScore, calculateLenderApplicantScore } from "@/actions/scoring";
import { calculateLoanEligibility } from "@/lib/loan-eligibility/calculator";

/**
 * Calculates loan eligibility for the currently authenticated worker.
 */
export async function getWorkerLoanEligibility() {
  const scoreResult = await calculateWorkerScore();
  
  if (scoreResult.error || !scoreResult.result) {
    return { error: scoreResult.error || "Failed to calculate score" };
  }
  
  const eligibility = calculateLoanEligibility(scoreResult.result);
  return { success: true, eligibility };
}

/**
 * Calculates loan eligibility for an applicant, restricted to authorized lenders.
 */
export async function getLenderApplicantLoanEligibility(applicationId: string) {
  const scoreResult = await calculateLenderApplicantScore(applicationId);
  
  if (scoreResult.error || !scoreResult.result) {
    return { error: scoreResult.error || "Failed to calculate score" };
  }
  
  const eligibility = calculateLoanEligibility(scoreResult.result);
  return { success: true, eligibility };
}
