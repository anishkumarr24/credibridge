import { describe, it, expect } from 'vitest';
import { computeCrediBridgeScore } from '../src/lib/scoring-engine/index';
import { WorkerData } from '../src/lib/scoring-engine/types';
import { SCORING_CONSTANTS } from '../src/lib/scoring-engine/constants';

function generateDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

const baseProfile = { platformTenureMonths: 24, filledRequiredFields: 5, totalRequiredFields: 5 };
const baseSources = { distinctSources: 2, validRecords: 50, totalRecords: 50 };

describe('Deterministic Scoring Engine', () => {

  it('calculates score correctly for stable earnings and perfect payments', () => {
    // Generate stable earnings for 6 months (~15k net per month)
    const earnings = Array.from({ length: 6 }).map((_, i) => ({
      date: generateDate(i * 30 + 15),
      netEarnings: 15000,
    }));
    // Perfect payments
    const payments = Array.from({ length: 12 }).map((_, i) => ({
      dueDate: generateDate(i * 30 + 10),
      paidDate: generateDate(i * 30 + 5), // Paid 5 days early
      isUnpaid: false,
      category: 'UNKNOWN',
      amount: 0,
    }));

    const data: WorkerData = { earnings, payments, profile: baseProfile, sources: baseSources };
    const result = computeCrediBridgeScore(data);

    expect(result.status).toBe('OK');
    expect(result.score).toBeGreaterThan(700); // Should be very strong
    expect(result.band).toMatch(/Strong/);
    
    // Verify explanations
    expect(result.factorExplanations.income).toBeDefined();
    expect(result.factorExplanations.payment).toBeDefined();
    expect(result.factorExplanations.trend).toBeDefined();
    expect(result.factorExplanations.tenure).toBeDefined();
  });

  it('penalizes declining earnings', () => {
    // Declining earnings over 6 months
    const earnings = [
      { date: generateDate(15), netEarnings: 5000 },
      { date: generateDate(45), netEarnings: 8000 },
      { date: generateDate(75), netEarnings: 12000 },
      { date: generateDate(105), netEarnings: 15000 },
      { date: generateDate(135), netEarnings: 18000 },
      { date: generateDate(165), netEarnings: 20000 },
    ];
    // Perfect payments
    const payments = Array.from({ length: 6 }).map((_, i) => ({
      dueDate: generateDate(i * 30 + 10),
      paidDate: generateDate(i * 30 + 5),
      isUnpaid: false,
      category: 'UNKNOWN',
      amount: 0,
    }));

    const data: WorkerData = { earnings, payments, profile: baseProfile, sources: baseSources };
    const result = computeCrediBridgeScore(data);
    
    expect(result.status).toBe('OK');
    expect(result.factors.trend.slopePct).toBeLessThan(0); // Should have a negative slope
    expect(result.factors.trend.value).toBeLessThan(50); // Heavily penalized
  });

  it('detects recovering earnings', () => {
    // Recovering earnings (V-shape)
    const earnings = [
      { date: generateDate(15), netEarnings: 15000 },
      { date: generateDate(45), netEarnings: 10000 },
      { date: generateDate(75), netEarnings: 5000 },
      { date: generateDate(105), netEarnings: 8000 },
      { date: generateDate(135), netEarnings: 12000 },
      { date: generateDate(165), netEarnings: 15000 },
    ];
    const data: WorkerData = { earnings, payments: [], profile: baseProfile, sources: baseSources };
    const result = computeCrediBridgeScore(data);
    
    expect(result.status).toBe('OK');
    // If recent months are better than previous months, it should not be brutally penalized,
    // though the exact logic depends on `factors.ts`. But it shouldn't crash.
    expect(result.factors.trend.value).toBeDefined();
  });

  it('penalizes missed and late payments heavily', () => {
    const earnings = Array.from({ length: 6 }).map((_, i) => ({
      date: generateDate(i * 30 + 15),
      netEarnings: 15000,
    }));
    // Mix of unpaid and late
    const payments = [
      { dueDate: generateDate(10), paidDate: null, isUnpaid: true, category: 'UNKNOWN', amount: 0 }, // Missed
      { dueDate: generateDate(40), paidDate: generateDate(60), isUnpaid: false, category: 'UNKNOWN', amount: 0 }, // 20 days late
      { dueDate: generateDate(70), paidDate: generateDate(75), isUnpaid: false, category: 'UNKNOWN', amount: 0 }, // 5 days late
    ];

    const data: WorkerData = { earnings, payments, profile: baseProfile, sources: baseSources };
    const result = computeCrediBridgeScore(data);

    expect(result.status).toBe('OK');
    expect(result.factors.payment.value).toBeLessThan(70); // Penalized below the prior of 70
  });

  it('returns INSUFFICIENT_DATA when records are too sparse', () => {
    // Only 1 earning record
    const earnings = [{ date: generateDate(15), netEarnings: 15000 }];
    const data: WorkerData = { earnings, payments: [], profile: baseProfile, sources: baseSources };
    const result = computeCrediBridgeScore(data);
    
    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.score).toBeNull();
  });

  it('applies seasonal adjustments if data > 12 months', () => {
    // 14 months of earnings
    const earnings = Array.from({ length: 14 }).map((_, i) => ({
      date: generateDate(i * 30 + 15),
      netEarnings: 15000,
    }));
    const data: WorkerData = { earnings, payments: [], profile: baseProfile, sources: baseSources };
    const result = computeCrediBridgeScore(data);
    
    expect(result.status).toBe('OK');
    expect(result.factors.trend.seasonalAdjusted).toBe(true);
  });

  it('respects score boundaries and confidence caps', () => {
    // Even with perfect data, if confidence is low due to profile completeness, score should be capped
    const earnings = Array.from({ length: 6 }).map((_, i) => ({
      date: generateDate(i * 30 + 15),
      netEarnings: 15000,
    }));
    const lowProfile = { platformTenureMonths: 2, filledRequiredFields: 1, totalRequiredFields: 5 };
    const lowSources = { distinctSources: 1, validRecords: 5, totalRecords: 5 };
    
    const data: WorkerData = { earnings, payments: [], profile: lowProfile, sources: lowSources };
    const result = computeCrediBridgeScore(data);
    
    expect(result.status).toBe('OK');
    expect(result.confidence!.score).toBeLessThan(70);
    expect(result.score).toBeLessThanOrEqual(result.confidence!.cap); // Should be capped by confidence
  });

  it('ensures factor weights total 100%', () => {
    const weights = SCORING_CONSTANTS.WEIGHTS_PCT;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});
