import { describe, it, expect } from "vitest";
import { evaluateOBM } from "../factors/obm";
import { WorkerData } from "../types";

function createWorkerData(payments: { amount: number; category: string; dueDate: Date }[]): WorkerData {
  return {
    earnings: [],
    payments: payments.map(p => ({
      ...p,
      paidDate: new Date(),
      isUnpaid: false
    })),
    profile: { platformTenureMonths: 12, filledRequiredFields: 5, totalRequiredFields: 5 },
    sources: { distinctSources: 1, validRecords: 10, totalRecords: 10 }
  };
}

const d = new Date();

describe("OBM Factor - T1 to T11 validation", () => {
  it("T1: No verified obligations -> OBM excluded", () => {
    const worker = createWorkerData([]);
    const res = evaluateOBM(worker, 50000, 100);
    expect(res.excluded).toBe(true);
    expect(res.value).toBe(0);
  });

  it("T2: High obligations, perfect payment history -> Penalty reduced", () => {
    // High VOBR > 1.30 => BurdenPenalty = 80
    // Multiplier at 100 PR = 0.35
    // AdjustedPenalty = 80 * 0.35 = 28 -> Raw OBM = 72
    const worker = createWorkerData(Array.from({ length: 6 }).map((_, i) => ({
      amount: 15000,
      category: "RENT",
      dueDate: new Date(d.getFullYear(), d.getMonth() - i, 1)
    })));
    const medianE = 10000; // vobr = 15000/10000 = 1.5 > 1.30
    
    const res = evaluateOBM(worker, medianE, 100);
    expect(res.excluded).toBe(false);
    expect(res.vobr).toBe(1.5);
    expect(res.burden_score).toBe(20);
    expect(res.multiplier).toBe(0.35);
    expect(res.raw).toBe(72);
  });

  it("T3: High obligations, terrible payment history -> Penalty amplified", () => {
    // Multiplier at 0 PR = 1.75
    // AdjustedPenalty = 80 * 1.75 = 140 (capped at 80) -> Raw OBM = 20
    const worker = createWorkerData(Array.from({ length: 6 }).map((_, i) => ({
      amount: 15000,
      category: "RENT",
      dueDate: new Date(d.getFullYear(), d.getMonth() - i, 1)
    })));
    const medianE = 10000;
    
    const res = evaluateOBM(worker, medianE, 0);
    expect(res.raw).toBe(20);
  });

  it("T4: Low obligations (VOBR < 0.40) -> BurdenScore 95+, Raw OBM near 100", () => {
    const worker = createWorkerData(Array.from({ length: 6 }).map((_, i) => ({
      amount: 2000,
      category: "RENT",
      dueDate: new Date(d.getFullYear(), d.getMonth() - i, 1)
    })));
    const medianE = 10000; // vobr = 0.20
    
    const res = evaluateOBM(worker, medianE, 100);
    expect(res.vobr).toBe(0.20);
    expect(res.burden_score).toBeGreaterThanOrEqual(95);
    expect(res.raw).toBeGreaterThanOrEqual(95);
  });

  it("T5: Low history shrinks towards 70", () => {
    const worker = createWorkerData([{
      amount: 15000,
      category: "RENT",
      dueDate: new Date(d.getFullYear(), d.getMonth(), 1)
    }]); // n = 1
    const medianE = 10000; 
    const res = evaluateOBM(worker, medianE, 100);
    expect(res.value).toBe(70.5);
  });

  it("T6: 1-2 months of verified obligation records -> Included, heavily shrunk", () => {
    const worker = createWorkerData([
      { amount: 15000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth(), 1) },
      { amount: 15000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth() - 1, 1) }
    ]);
    const medianE = 10000;
    const res = evaluateOBM(worker, medianE, 100);
    // n=2, raw=72, prior=70, k=3
    // (2*72 + 3*70)/5 = (144 + 210)/5 = 354/5 = 70.8
    expect(res.excluded).toBe(false);
    expect(res.value).toBeCloseTo(70.8);
  });

  it("T7: 6+ months, high VOBR, good reliability -> Mild reduction", () => {
    const worker = createWorkerData(Array.from({ length: 8 }).map((_, i) => ({
      amount: 16000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth() - i, 1)
    })));
    const medianE = 20000; // vobr = 0.8
    const res = evaluateOBM(worker, medianE, 95); // Example 2 in spec
    // raw = 86.5, n=8
    // final = (8*86.5 + 3*70)/11 = 82
    expect(res.raw).toBeCloseTo(86.5);
    expect(res.value).toBeCloseTo(82);
  });

  it("T8: 6+ months, high VOBR, poor reliability -> Material reduction", () => {
    const worker = createWorkerData(Array.from({ length: 8 }).map((_, i) => ({
      amount: 16000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth() - i, 1)
    })));
    const medianE = 20000; // vobr = 0.8
    const res = evaluateOBM(worker, medianE, 35); // Example 3 in spec
    // raw = 59.31, n=8
    // final = (8*59.31 + 3*70)/11 = 62.225
    expect(res.raw).toBeCloseTo(59.31);
    expect(res.value).toBeCloseTo(62.23, 2);
  });

  it("T9: Median earnings is 0 or unavailable -> OBM excluded", () => {
    const worker = createWorkerData(Array.from({ length: 6 }).map((_, i) => ({
      amount: 15000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth() - i, 1)
    })));
    const res = evaluateOBM(worker, 0, 100);
    expect(res.excluded).toBe(true);
    
    const res2 = evaluateOBM(worker, undefined, 100);
    expect(res2.excluded).toBe(true);
  });

  it("T10: Payment regularity excluded -> Multiplier defaults to 1.0", () => {
    const worker = createWorkerData(Array.from({ length: 6 }).map((_, i) => ({
      amount: 8000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth() - i, 1)
    })));
    const medianE = 10000; // vobr = 0.80 -> Burden penalty = 30
    // multiplier = 1.0 -> AdjustedPenalty = 30 -> Raw = 70
    const res = evaluateOBM(worker, medianE, undefined);
    expect(res.multiplier).toBe(1.0);
    expect(res.raw).toBe(70);
  });

  it("T11: Inconsistent categorizations do not break median", () => {
    const worker = createWorkerData([
      { amount: 5000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth(), 1) },
      { amount: 1000, category: "UTILITY", dueDate: new Date(d.getFullYear(), d.getMonth(), 1) }, // Same month, total = 6000
      { amount: 5000, category: "RENT", dueDate: new Date(d.getFullYear(), d.getMonth() - 1, 1) },
      { amount: 500, category: "IGNORED", dueDate: new Date(d.getFullYear(), d.getMonth() - 1, 1) } // Ignored, total = 5000
    ]);
    const medianE = 10000;
    const res = evaluateOBM(worker, medianE, 100);
    // med(6000, 5000) = 5500
    expect(res.verified_monthly_obligations).toBe(5500);
    expect(res.months).toBe(2);
  });
});
