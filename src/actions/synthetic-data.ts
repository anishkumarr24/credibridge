"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role, DataCategory, DataSourceType, PaymentStatus } from "@prisma/client";

// ──────────────────────────────────────────────
//  Preset configurations
//  All amounts in INR — realistic for Indian gig workers
// ──────────────────────────────────────────────

export type SyntheticPreset = "stable_worker" | "seasonal_worker" | "irregular_worker";

interface PresetConfig {
  label: string;
  description: string;
  baseMonthlyIncome: number;   // INR
  incomeVariance: number;      // 0–1 (fraction of base)
  seasonalMultipliers: number[]; // index 0 = Jan … 11 = Dec
  paymentReliability: number;  // 0–1 (probability of on-time payment)
  hoursPerWeek: number;
  tripsPerHour: number;
  platform: string;
  rentAmount: number;          // INR/month base
  utilityAmount: number;       // INR/month base
}

const PRESETS: Record<SyntheticPreset, PresetConfig> = {
  stable_worker: {
    label: "Stable Gig Worker",
    description:
      "Consistent income with minimal seasonal variation. High payment reliability. Good for demonstrating a strong credit profile.",
    baseMonthlyIncome: 38000,
    incomeVariance: 0.10,
    seasonalMultipliers: [1, 1, 1, 1, 1.05, 1.05, 1, 1, 1, 1, 1, 1],
    paymentReliability: 0.94,
    hoursPerWeek: 42,
    tripsPerHour: 2.5,
    platform: "Swiggy",
    rentAmount: 9000,
    utilityAmount: 900,
  },
  seasonal_worker: {
    label: "Seasonal Gig Worker",
    description:
      "Higher income during peak seasons, lower during off-peak months. Some late payments in slow periods. Moderate credit profile.",
    baseMonthlyIncome: 32000,
    incomeVariance: 0.22,
    seasonalMultipliers: [0.65, 0.65, 0.75, 0.90, 1.20, 1.35, 1.40, 1.30, 1.10, 0.95, 0.75, 0.65],
    paymentReliability: 0.72,
    hoursPerWeek: 36,
    tripsPerHour: 2.0,
    platform: "Ola",
    rentAmount: 7500,
    utilityAmount: 750,
  },
  irregular_worker: {
    label: "Irregular Gig Worker",
    description:
      "Highly variable income with significant gaps. Mix of on-time, late, and missed payments. Shows challenges of irregular gig work.",
    baseMonthlyIncome: 24000,
    incomeVariance: 0.42,
    seasonalMultipliers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    paymentReliability: 0.52,
    hoursPerWeek: 26,
    tripsPerHour: 1.8,
    platform: "Urban Company",
    rentAmount: 6000,
    utilityAmount: 600,
  },
};

/** Export preset metadata so the UI can render preset cards without re-defining them. */
export async function getSyntheticPresets() {
  return Object.entries(PRESETS).map(([key, cfg]) => ({
    key: key as SyntheticPreset,
    label: cfg.label,
    description: cfg.description,
    platform: cfg.platform,
  }));
}

// ──────────────────────────────────────────────
//  Simple deterministic PRNG (LCG)
//  Gives reproducible sequences from a seed.
// ──────────────────────────────────────────────

function makePrng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return (s >>> 0) / 0xffffffff;
  };
}

// ──────────────────────────────────────────────
//  Check if synthetic data already generated
// ──────────────────────────────────────────────

export async function getSyntheticDataStatus() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.WORKER) return null;

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return null;

  const datasets = await prisma.syntheticDataset.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    select: { preset: true, recordCount: true, createdAt: true },
  });

  return datasets;
}

// ──────────────────────────────────────────────
//  Generate synthetic demo data
// ──────────────────────────────────────────────

export async function generateSyntheticData(preset: SyntheticPreset) {
  try {
    // Auth check — derive profile from session, never from client
    const session = await auth();
    if (!session?.user || session.user.role !== Role.WORKER) {
      return { error: "Unauthorized" };
    }

    const profile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) return { error: "Worker profile not found" };

    const cfg = PRESETS[preset];
    if (!cfg) return { error: "Unknown preset" };

    const seed = Date.now() % 999983; // deterministic but unique per generation
    const rand = makePrng(seed);

    // Generate 12 months of data ending last month
    const now = new Date();
    const MONTHS = 12;

    const earningRows: {
      date: Date;
      platform: string;
      grossEarnings: number;
      incentives: number;
      deductions: number;
      netEarnings: number;
      workingHours: number;
      trips: number;
    }[] = [];

    const paymentRows: {
      category: string;
      amount: number;
      dueDate: Date;
      paidDate: Date | null;
      status: PaymentStatus;
      dataCategory: DataCategory;
    }[] = [];

    for (let mOffset = MONTHS - 1; mOffset >= 0; mOffset--) {
      // Start from (MONTHS-1) months ago up to last month
      const baseDate = new Date(now.getFullYear(), now.getMonth() - mOffset, 1);
      const monthIdx = baseDate.getMonth(); // 0–11
      const year = baseDate.getFullYear();

      const seasonal = cfg.seasonalMultipliers[monthIdx];
      const monthVariance = (rand() * 2 - 1) * cfg.incomeVariance;
      const monthlyGross = cfg.baseMonthlyIncome * seasonal * (1 + monthVariance);

      // 4 weekly earning records per month
      for (let week = 0; week < 4; week++) {
        const day = 1 + week * 7;
        const weekDate = new Date(year, monthIdx, day);

        const weekVariance = (rand() * 2 - 1) * 0.15;
        const weeklyGross = Math.max(0, (monthlyGross / 4) * (1 + weekVariance));
        const incentives = Math.round(weeklyGross * 0.06 * rand() * 100) / 100;
        const deductions = Math.round(weeklyGross * 0.04 * rand() * 100) / 100;
        const net = Math.round((weeklyGross + incentives - deductions) * 100) / 100;
        const hours =
          Math.round((cfg.hoursPerWeek / 4) * (1 + (rand() - 0.5) * 0.25) * 10) / 10;
        const trips = Math.max(0, Math.floor(hours * cfg.tripsPerHour * (0.8 + rand() * 0.4)));

        earningRows.push({
          date: weekDate,
          platform: cfg.platform,
          grossEarnings: Math.round(weeklyGross * 100) / 100,
          incentives,
          deductions,
          netEarnings: net,
          workingHours: hours,
          trips,
        });
      }

      // Rent payment (due 1st of month)
      const rentDue = new Date(year, monthIdx, 1);
      const rentAmt = Math.round((cfg.rentAmount + (rand() - 0.5) * 1500) * 100) / 100;
      const rentOnTime = rand() < cfg.paymentReliability;
      const rentEventuallyPaid = rand() < 0.88;
      let rentStatus: PaymentStatus;
      let rentPaid: Date | null = null;

      if (rentOnTime && rentEventuallyPaid) {
        rentStatus = PaymentStatus.PAID;
        rentPaid = new Date(year, monthIdx, Math.floor(rand() * 4) + 1);
      } else if (rentEventuallyPaid) {
        const daysLate = Math.floor(rand() * 20) + 5;
        rentStatus = PaymentStatus.LATE;
        rentPaid = new Date(rentDue.getTime() + daysLate * 86400_000);
      } else {
        rentStatus = PaymentStatus.MISSED;
        rentPaid = null;
      }

      paymentRows.push({
        category: "Rent",
        amount: Math.max(1000, rentAmt),
        dueDate: rentDue,
        paidDate: rentPaid,
        status: rentStatus,
        dataCategory: DataCategory.RENT_PAYMENTS,
      });

      // Utility payment (due 15th of month)
      const utilDue = new Date(year, monthIdx, 15);
      const utilAmt =
        Math.round((cfg.utilityAmount + (rand() - 0.5) * 400) * 100) / 100;
      const utilOnTime = rand() < cfg.paymentReliability;
      const utilEventuallyPaid = rand() < 0.93;
      let utilStatus: PaymentStatus;
      let utilPaid: Date | null = null;

      if (utilOnTime && utilEventuallyPaid) {
        utilStatus = PaymentStatus.PAID;
        utilPaid = new Date(year, monthIdx, 12 + Math.floor(rand() * 5));
      } else if (utilEventuallyPaid) {
        utilStatus = PaymentStatus.LATE;
        utilPaid = new Date(utilDue.getTime() + Math.floor(rand() * 12 + 3) * 86400_000);
      } else {
        utilStatus = PaymentStatus.MISSED;
        utilPaid = null;
      }

      paymentRows.push({
        category: "Utility (Electricity)",
        amount: Math.max(200, utilAmt),
        dueDate: utilDue,
        paidDate: utilPaid,
        status: utilStatus,
        dataCategory: DataCategory.UTILITY_PAYMENTS,
      });
    }

    const latestEarningDate = earningRows[earningRows.length - 1]?.date ?? new Date();
    const latestPaymentDate = paymentRows[paymentRows.length - 1]?.dueDate ?? new Date();
    const totalRecords = earningRows.length + paymentRows.length;

    await prisma.$transaction(async (tx) => {
      // Create earnings financial source (SYNTHETIC)
      const earningsSource = await tx.financialSource.create({
        data: {
          profileId: profile.id,
          category: DataCategory.GIG_EARNINGS,
          sourceType: DataSourceType.SYNTHETIC,
          fileName: `[SYNTHETIC] ${cfg.label} — earnings`,
          recordCount: earningRows.length,
          latestDate: latestEarningDate,
          dataQuality: "Synthetic",
        },
      });

      // Rent source (SYNTHETIC)
      const rentRows = paymentRows.filter((p) => p.dataCategory === DataCategory.RENT_PAYMENTS);
      const rentSource = await tx.financialSource.create({
        data: {
          profileId: profile.id,
          category: DataCategory.RENT_PAYMENTS,
          sourceType: DataSourceType.SYNTHETIC,
          fileName: `[SYNTHETIC] ${cfg.label} — rent`,
          recordCount: rentRows.length,
          latestDate: latestPaymentDate,
          dataQuality: "Synthetic",
        },
      });

      // Utility source (SYNTHETIC)
      const utilRows = paymentRows.filter(
        (p) => p.dataCategory === DataCategory.UTILITY_PAYMENTS
      );
      const utilSource = await tx.financialSource.create({
        data: {
          profileId: profile.id,
          category: DataCategory.UTILITY_PAYMENTS,
          sourceType: DataSourceType.SYNTHETIC,
          fileName: `[SYNTHETIC] ${cfg.label} — utilities`,
          recordCount: utilRows.length,
          latestDate: latestPaymentDate,
          dataQuality: "Synthetic",
        },
      });

      // Bulk insert earning records
      await tx.earningRecord.createMany({
        data: earningRows.map((r) => ({
          profileId: profile.id,
          sourceId: earningsSource.id,
          date: r.date,
          platform: r.platform,
          grossEarnings: r.grossEarnings,
          incentives: r.incentives,
          deductions: r.deductions,
          netEarnings: r.netEarnings,
          workingHours: r.workingHours,
          trips: r.trips,
        })),
      });

      // Bulk insert payment records
      await tx.paymentRecord.createMany({
        data: paymentRows.map((r) => ({
          profileId: profile.id,
          sourceId:
            r.dataCategory === DataCategory.RENT_PAYMENTS
              ? rentSource.id
              : utilSource.id,
          category: r.category,
          amount: r.amount,
          dueDate: r.dueDate,
          paidDate: r.paidDate,
          status: r.status,
        })),
      });

      // Track synthetic generation in SyntheticDataset
      await tx.syntheticDataset.create({
        data: {
          preset,
          seed,
          profileId: profile.id,
          recordCount: totalRecords,
        },
      });
    });

    revalidatePath("/dashboard/worker/financial-data");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      preset: cfg.label,
      earningCount: earningRows.length,
      paymentCount: paymentRows.length,
    };
  } catch (error) {
    console.error("Failed to generate synthetic data:", error);
    return { error: "An unexpected error occurred while generating demo data." };
  }
}
