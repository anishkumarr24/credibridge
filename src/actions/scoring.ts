"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { computeCrediBridgeScore } from "@/lib/scoring-engine";
import { WorkerData, ChartData } from "@/lib/scoring-engine/types";
import { SCORING_CONSTANTS } from "@/lib/scoring-engine/constants";
import { median, mad, daysBetween } from "@/lib/scoring-engine/math-utils";
import { format } from "date-fns";

// ─── Engine version — bump when scoring algorithm changes ───────────────────
const ENGINE_VERSION = "1.0.0";

// ─── Factor metadata (labels, weights) ──────────────────────────────────────
const FACTOR_META = {
  income:  { label: "Income Consistency",  weight: SCORING_CONSTANTS.WEIGHTS_PCT.income  / 100 },
  payment: { label: "Payment Regularity",  weight: SCORING_CONSTANTS.WEIGHTS_PCT.payment / 100 },
  trend:   { label: "Earnings Trend",      weight: SCORING_CONSTANTS.WEIGHTS_PCT.trend   / 100 },
  tenure:  { label: "Platform Tenure",     weight: SCORING_CONSTANTS.WEIGHTS_PCT.tenure  / 100 },
  obm:     { label: "Obligation Burden & Management", weight: SCORING_CONSTANTS.WEIGHTS_PCT.obm / 100 },
} as const;

type FactorKey = keyof typeof FACTOR_META;

// ─── Shared data-preparation helper ─────────────────────────────────────────
async function prepareWorkerData(userId: string) {
  const profile = await prisma.workerProfile.findUnique({
    where: { userId },
    include: {
      financialSources: true,
      earningRecords: { orderBy: { date: "asc" } },
      paymentRecords:  { orderBy: { dueDate: "asc" } },
    },
  });

  if (!profile) return null;

  // Aggregate monthly earnings
  const monthlyEarningsMap = new Map<string, { date: Date; netEarnings: number }>();
  for (const e of profile.earningRecords) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyEarningsMap.has(key)) {
      monthlyEarningsMap.set(key, { date: new Date(e.date.getFullYear(), e.date.getMonth(), 1), netEarnings: 0 });
    }
    monthlyEarningsMap.get(key)!.netEarnings += e.netEarnings;
  }
  const aggregatedEarnings = Array.from(monthlyEarningsMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Map payments
  const payments = profile.paymentRecords.map(p => ({
    dueDate:  p.dueDate,
    paidDate: p.paidDate,
    isUnpaid: p.status === "MISSED" || p.status === "PENDING" || (p.paidDate === null && p.dueDate < new Date()),
    category: p.category,
    amount:   p.amount,
  }));

  // Profile completeness
  const profileFields = ["phone", "location", "occupationType", "primaryPlatform", "monthlyExpenses"] as const;
  type ProfileField = typeof profileFields[number];
  const filledFields = profileFields.filter(f => profile[f as ProfileField] !== null && profile[f as ProfileField] !== undefined).length;

  // Source diversity
  const distinctSources = new Set(profile.financialSources.map(s => s.category)).size;
  const validRecords = profile.earningRecords.length + profile.paymentRecords.length;

  const workerData: WorkerData = {
    earnings: aggregatedEarnings,
    payments,
    profile: {
      platformTenureMonths:  profile.platformTenure,
      filledRequiredFields:  filledFields,
      totalRequiredFields:   profileFields.length,
    },
    sources: {
      distinctSources,
      validRecords,
      totalRecords: validRecords,
    },
  };

  return { profile, workerData, aggregatedEarnings, payments };
}

// ─── Shared chart-data builder ───────────────────────────────────────────────
function buildChartData(
  aggregatedEarnings: { date: Date; netEarnings: number }[],
  payments: { dueDate: Date; paidDate: Date | null; isUnpaid: boolean; category: string; amount: number }[],
  platformTenure: number | null
): ChartData {
  const earningsAmounts = aggregatedEarnings.map(e => e.netEarnings);
  const medianEarnings  = earningsAmounts.length > 0 ? median(earningsAmounts) : 0;
  const madValue        = earningsAmounts.length > 0 ? mad(earningsAmounts)    : 0;
  const cvPct           = medianEarnings > 0 ? (madValue / medianEarnings) * 100 : 0;
  const avgEarnings     = earningsAmounts.length > 0
    ? earningsAmounts.reduce((a, b) => a + b, 0) / earningsAmounts.length
    : 0;

  const paymentBreakdown = { onTime: 0, lateUnder5: 0, lateUnder15: 0, lateOver15: 0, unpaid: 0, total: payments.length };
  let onTimeCount = 0;
  for (const p of payments) {
    if (p.isUnpaid || !p.paidDate) { paymentBreakdown.unpaid++; continue; }
    const delta = daysBetween(p.paidDate, p.dueDate);
    if (delta <= 0)       { paymentBreakdown.onTime++;      onTimeCount++; }
    else if (delta <= 5)  { paymentBreakdown.lateUnder5++;  }
    else if (delta <= 15) { paymentBreakdown.lateUnder15++; }
    else                  { paymentBreakdown.lateOver15++;  }
  }
  const onTimePaymentPct = payments.length > 0 ? (onTimeCount / payments.length) * 100 : 0;

  return {
    monthlyEarnings: aggregatedEarnings.map(e => ({
      month:    format(e.date, "MMM yy"),
      earnings: Math.round(e.netEarnings),
    })),
    paymentBreakdown,
    summary: {
      avgMonthlyEarnings:    Math.round(avgEarnings),
      medianMonthlyEarnings: Math.round(medianEarnings),
      earningsVolatilityPct: Math.round(cvPct),
      onTimePaymentPct:      Math.round(onTimePaymentPct),
      platformTenureMonths:  platformTenure,
    },
  };
}

// ─── calculateWorkerScore (read-only compute path) ────────────────────────────
export async function calculateWorkerScore() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.WORKER) return { error: "Unauthorized access" };

  const prepared = await prepareWorkerData(session.user.id);
  if (!prepared) return { error: "Profile not found" };

  const { profile, workerData, aggregatedEarnings, payments } = prepared;
  const result    = computeCrediBridgeScore(workerData);
  const chartData = buildChartData(aggregatedEarnings, payments, profile.platformTenure);

  return { success: true, result, chartData };
}

// ─── calculateLenderApplicantScore (read-only compute path for lenders) ────
export async function calculateLenderApplicantScore(applicationId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.LENDER) return { error: "Unauthorized access" };

  // Verify application exists and lender has access
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { worker: { include: { user: true } } }
  });

  if (!application) return { error: "Application not found" };
  
  const lenderProfile = await prisma.lenderProfile.findUnique({
    where: { userId: session.user.id }
  });
  
  if (application.lenderId && application.lenderId !== lenderProfile?.id) {
    return { error: "Forbidden: Application belongs to another lender" };
  }

  const prepared = await prepareWorkerData(application.worker.userId);
  if (!prepared) return { error: "Profile not found" };

  const { profile, workerData, aggregatedEarnings, payments } = prepared;
  const result    = computeCrediBridgeScore(workerData);
  const chartData = buildChartData(aggregatedEarnings, payments, profile.platformTenure);

  return { success: true, result, chartData, worker: application.worker };
}

// ─── calculateAndSaveScore (persists snapshot for history) ────────────────────
export async function calculateAndSaveScore() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.WORKER) return { error: "Unauthorized access" };
  return await computeAndSaveScoreForProfile(session.user.id);
}

// ─── computeAndSaveScoreForProfile (used by synthetic data generator) ────────
export async function computeAndSaveScoreForProfile(userId: string) {
  const prepared = await prepareWorkerData(userId);
  if (!prepared) return { error: "Profile not found" };

  const { profile, workerData, aggregatedEarnings, payments } = prepared;
  const result    = computeCrediBridgeScore(workerData);
  const chartData = buildChartData(aggregatedEarnings, payments, profile.platformTenure);

  // Only persist if the engine produced a valid score
  if (result.status !== "OK" || result.score === null || !result.confidence) {
    return { success: true, result, chartData, persisted: false };
  }

  // Check the latest persisted score to avoid duplicate entries on the same day
  const latestSaved = await prisma.score.findFirst({
    where:   { profileId: profile.id },
    orderBy: { calculatedAt: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alreadySavedToday =
    latestSaved &&
    latestSaved.calculatedAt >= today &&
    Math.abs(latestSaved.totalScore - result.score) < 1;

  if (alreadySavedToday) {
    return { success: true, result, chartData, persisted: false, existingId: latestSaved.id };
  }

  // Persist score snapshot
  const factorKeys: FactorKey[] = ["income", "payment", "trend", "tenure", "obm"];
  const includedKeys = factorKeys.filter(k => !result.factors[k].excluded);
  let totalW = 0;
  for (const k of includedKeys) totalW += SCORING_CONSTANTS.WEIGHTS_PCT[k];

  const savedScore = await prisma.score.create({
    data: {
      profileId:     profile.id,
      totalScore:    result.score,
      bandLabel:     result.band!,
      confidence:    Math.round(result.confidence.score),
      engineVersion: ENGINE_VERSION,
      factors: {
        create: factorKeys.map(k => {
          const f    = result.factors[k];
          const meta = FACTOR_META[k];
          const adjustedWeight = includedKeys.includes(k)
            ? (SCORING_CONSTANTS.WEIGHTS_PCT[k] / totalW)
            : 0;
          return {
            factorKey:    k,
            factorLabel:  meta.label,
            rawScore:     f.excluded ? 0 : f.value,
            weight:       adjustedWeight,
            contribution: result.contributions[k] ?? 0,
            explanation:  result.factorExplanations[k],
            evidenceJson: JSON.stringify(f),
            isPositive:   !f.excluded && f.value >= 50,
          };
        }),
      },
    },
  });

  return { success: true, result, persisted: true, savedId: savedScore.id };
}
