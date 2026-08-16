import { describe, it, expect } from "vitest";
import { calculateLoanEligibility } from "../calculator";
import { EngineResult } from "@/lib/scoring-engine/types";

describe("Loan Eligibility Calculator", () => {
  it("calculates Rina's exact worked example from the specification", () => {
    // Rina inputs from the spec (Section 8)
    const mockPhase5Result: EngineResult = {
      score: 762,
      band: "Very Strong",
      status: "OK",
      confidence: {
        tier: "HIGH",
        score: 95,
        cap: 100,
        breakdown: {
          earningsCoverage: 100,
          paymentCoverage: 100,
          profileCompleteness: 100,
          sourceDiversity: 100,
          dataValidity: 100
        }
      },
      factors: {
        income: { value: 90.2, median_e: 15500, excluded: false },
        payment: { value: 95 },
        trend: { value: 85 },
        tenure: { value: 100 },
        obm: { value: 0, vobr: 0, raw: 0, burden_score: 0, multiplier: 0, verified_monthly_obligations: 0, excluded: true }
      },
      contributions: { income: null, payment: null, trend: null, tenure: null, obm: null },
      explanations: [],
      factorExplanations: { income: "", payment: "", trend: "", tenure: "", obm: "" }
    };

    const result = calculateLoanEligibility(mockPhase5Result);

    expect(result.status).toBe("ELIGIBLE");
    expect(result.recommended_amount).toBe(62000); // 15500 * 4.0
    expect(result.tenure_months).toBe(24);
    expect(result.binding_constraint).toBe("loan-to-income");
    
    // Affordability Check:
    // AffordabilityRatio = 0.20 + 0.15 * (90.2 / 100) = 0.3353
    // AffordableEMI = 15500 * 0.3353 = 5197.15
    expect(result.affordable_emi_ceiling).toBeCloseTo(5197.15, 0);

    // Actual EMI on 62000 over 24 months at 13% mid rate (0.13 / 12 = 0.0108333)
    // EMI = 62000 * 0.0108333 * (1.0108333^24) / (1.0108333^24 - 1) = 2949.65
    expect(result.estimated_emi).toBeCloseTo(2947.59, 0);
  });

  it("returns NOT_ELIGIBLE if confidence is INSUFFICIENT_DATA", () => {
    const mockPhase5Result: EngineResult = {
      score: null,
      band: null,
      status: "INSUFFICIENT_DATA",
      confidence: { tier: "LOW", score: 0, cap: 0, breakdown: { earningsCoverage: 0, paymentCoverage: 0, profileCompleteness: 0, sourceDiversity: 0, dataValidity: 0 } },
      factors: {
        income: { value: 0, median_e: undefined, excluded: true },
        payment: { value: 0 },
        trend: { value: 0 },
        tenure: { value: 0 },
        obm: { value: 0, vobr: 0, raw: 0, burden_score: 0, multiplier: 0, verified_monthly_obligations: 0, excluded: true }
      },
      contributions: { income: null, payment: null, trend: null, tenure: null, obm: null },
      explanations: [],
      factorExplanations: { income: "", payment: "", trend: "", tenure: "", obm: "" }
    };

    const result = calculateLoanEligibility(mockPhase5Result);
    expect(result.status).toBe("NOT_ELIGIBLE");
  });

  it("applies confidence tenure caps properly", () => {
    // Very Strong, but LOW confidence -> tenure capped at 6 months
    const mockPhase5Result: EngineResult = {
      score: 700,
      band: "Very Strong",
      status: "OK",
      confidence: {
        tier: "LOW",
        score: 30,
        cap: 100,
        breakdown: { earningsCoverage: 100, paymentCoverage: 100, profileCompleteness: 100, sourceDiversity: 100, dataValidity: 100 }
      },
      factors: {
        income: { value: 90, median_e: 10000, excluded: false },
        payment: { value: 90 },
        trend: { value: 80 },
        tenure: { value: 50 },
        obm: { value: 0, vobr: 0, raw: 0, burden_score: 0, multiplier: 0, verified_monthly_obligations: 0, excluded: true }
      },
      contributions: { income: null, payment: null, trend: null, tenure: null, obm: null },
      explanations: [],
      factorExplanations: { income: "", payment: "", trend: "", tenure: "", obm: "" }
    };

    const result = calculateLoanEligibility(mockPhase5Result);
    expect(result.status).toBe("ELIGIBLE");
    expect(result.tenure_months).toBe(6); // capped at 6 instead of 24
  });
});
