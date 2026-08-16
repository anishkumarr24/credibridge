"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role, DataCategory, DataSourceType } from "@prisma/client";

import { earningRecordSchema, paymentRecordSchema, EarningRecordValues, PaymentRecordValues } from "@/lib/schemas";

// ──────────────────────────────────────────────
//  Internal: get authenticated worker profile
//  Never trust client-supplied worker IDs.
// ──────────────────────────────────────────────

async function getAuthenticatedWorkerProfile() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.WORKER) return null;

  return prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
  });
}

// ──────────────────────────────────────────────
//  Manual Entry — Earnings
// ──────────────────────────────────────────────

export async function addManualEarning(data: EarningRecordValues) {
  try {
    const profile = await getAuthenticatedWorkerProfile();
    if (!profile) return { error: "Unauthorized" };

    const parsed = earningRecordSchema.safeParse(data);
    if (!parsed.success) return { error: "Invalid data provided" };

    const val = parsed.data;

    // Additional server-side validation
    const recordDate = new Date(val.date);
    if (isNaN(recordDate.getTime())) return { error: "Invalid date" };
    if (recordDate > new Date()) return { error: "Date cannot be in the future" };
    if (recordDate.getFullYear() < 2000) return { error: "Date is too far in the past" };
    if (val.grossEarnings > 10_000_000) return { error: "Earnings value is unrealistically large" };

    const source = await prisma.financialSource.create({
      data: {
        profileId: profile.id,
        category: DataCategory.GIG_EARNINGS,
        sourceType: DataSourceType.MANUAL_ENTRY,
        recordCount: 1,
        latestDate: recordDate,
      },
    });

    await prisma.earningRecord.create({
      data: {
        profileId: profile.id,
        sourceId: source.id,
        date: recordDate,
        platform: val.platform || profile.primaryPlatform,
        grossEarnings: val.grossEarnings,
        incentives: val.incentives,
        deductions: val.deductions,
        netEarnings: val.netEarnings,
        workingHours: val.workingHours ?? null,
        trips: val.trips ?? null,
      },
    });

    revalidatePath("/dashboard/worker/financial-data");
    revalidatePath("/dashboard/worker");
    return { success: true };
  } catch (error) {
    console.error("Failed to add manual earning:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ──────────────────────────────────────────────
//  Manual Entry — Payments
// ──────────────────────────────────────────────

export async function addManualPayment(
  data: PaymentRecordValues,
  dataCategory: DataCategory
) {
  try {
    const profile = await getAuthenticatedWorkerProfile();
    if (!profile) return { error: "Unauthorized" };

    const parsed = paymentRecordSchema.safeParse(data);
    if (!parsed.success) return { error: "Invalid data provided" };

    const val = parsed.data;

    const dueDate = new Date(val.dueDate);
    if (isNaN(dueDate.getTime())) return { error: "Invalid due date" };
    if (dueDate.getFullYear() < 2000) return { error: "Due date is too far in the past" };
    if (val.amount > 10_000_000) return { error: "Amount is unrealistically large" };

    const source = await prisma.financialSource.create({
      data: {
        profileId: profile.id,
        category: dataCategory,
        sourceType: DataSourceType.MANUAL_ENTRY,
        recordCount: 1,
        latestDate: dueDate,
      },
    });

    await prisma.paymentRecord.create({
      data: {
        profileId: profile.id,
        sourceId: source.id,
        category: val.category,
        amount: val.amount,
        dueDate,
        paidDate: val.paidDate ? new Date(val.paidDate) : null,
        status: val.status,
      },
    });

    revalidatePath("/dashboard/worker/financial-data");
    revalidatePath("/dashboard/worker");
    return { success: true };
  } catch (error) {
    console.error("Failed to add manual payment:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ──────────────────────────────────────────────
//  CSV Upload — Earnings
// ──────────────────────────────────────────────

export async function uploadEarningsCSV(
  records: EarningRecordValues[],
  fileName: string
) {
  try {
    const profile = await getAuthenticatedWorkerProfile();
    if (!profile) return { error: "Unauthorized" };
    if (!records.length) return { error: "No records found in file" };

    // Server-side re-validation of every row
    const validRecords: EarningRecordValues[] = [];
    let invalidCount = 0;

    for (const record of records) {
      const parsed = earningRecordSchema.safeParse(record);
      if (!parsed.success) { invalidCount++; continue; }

      const val = parsed.data;
      const d = new Date(val.date);
      if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d > new Date()) {
        invalidCount++;
        continue;
      }
      if (val.grossEarnings > 10_000_000) { invalidCount++; continue; }

      validRecords.push(val);
    }

    if (validRecords.length === 0) {
      return { error: "No valid records found after server-side validation." };
    }

    const sorted = [...validRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    await prisma.$transaction(async (tx) => {
      const source = await tx.financialSource.create({
        data: {
          profileId: profile.id,
          category: DataCategory.GIG_EARNINGS,
          sourceType: DataSourceType.CSV_UPLOAD,
          fileName,
          recordCount: validRecords.length,
          latestDate: new Date(sorted[0].date),
        },
      });

      await tx.earningRecord.createMany({
        data: validRecords.map((r) => ({
          profileId: profile.id,
          sourceId: source.id,
          date: new Date(r.date),
          platform: r.platform || null,
          grossEarnings: Number(r.grossEarnings),
          incentives: Number(r.incentives || 0),
          deductions: Number(r.deductions || 0),
          netEarnings: Number(r.netEarnings),
          workingHours: r.workingHours != null ? Number(r.workingHours) : null,
          trips: r.trips != null ? Number(r.trips) : null,
        })),
      });
    });

    revalidatePath("/dashboard/worker/financial-data");
    revalidatePath("/dashboard/worker");
    return { success: true, count: validRecords.length, skipped: invalidCount };
  } catch (error) {
    console.error("Failed to upload earnings CSV:", error);
    return { error: "An unexpected error occurred while saving CSV data." };
  }
}

// ──────────────────────────────────────────────
//  CSV Upload — Payments (NEW)
// ──────────────────────────────────────────────

export async function uploadPaymentsCSV(
  records: PaymentRecordValues[],
  fileName: string,
  dataCategory: DataCategory
) {
  try {
    const profile = await getAuthenticatedWorkerProfile();
    if (!profile) return { error: "Unauthorized" };
    if (!records.length) return { error: "No records found in file" };

    // Server-side re-validation of every row
    const validRecords: PaymentRecordValues[] = [];
    let invalidCount = 0;

    for (const record of records) {
      const parsed = paymentRecordSchema.safeParse(record);
      if (!parsed.success) { invalidCount++; continue; }

      const val = parsed.data;
      const dueDate = new Date(val.dueDate);
      if (isNaN(dueDate.getTime()) || dueDate.getFullYear() < 2000) {
        invalidCount++;
        continue;
      }
      // Refuse far-future dates
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (dueDate > oneYearFromNow) { invalidCount++; continue; }

      if (val.amount < 0 || val.amount > 10_000_000) { invalidCount++; continue; }

      // Validate paidDate if provided
      if (val.paidDate) {
        const paidDate = new Date(val.paidDate);
        if (isNaN(paidDate.getTime())) { invalidCount++; continue; }
      }

      validRecords.push(val);
    }

    if (validRecords.length === 0) {
      return { error: "No valid records found after server-side validation." };
    }

    const sorted = [...validRecords].sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );

    await prisma.$transaction(async (tx) => {
      const source = await tx.financialSource.create({
        data: {
          profileId: profile.id,
          category: dataCategory,
          sourceType: DataSourceType.CSV_UPLOAD,
          fileName,
          recordCount: validRecords.length,
          latestDate: new Date(sorted[0].dueDate),
        },
      });

      await tx.paymentRecord.createMany({
        data: validRecords.map((r) => ({
          profileId: profile.id,
          sourceId: source.id,
          category: r.category,
          amount: Number(r.amount),
          dueDate: new Date(r.dueDate),
          paidDate: r.paidDate ? new Date(r.paidDate) : null,
          status: r.status,
        })),
      });
    });

    revalidatePath("/dashboard/worker/financial-data");
    revalidatePath("/dashboard/worker");
    return { success: true, count: validRecords.length, skipped: invalidCount };
  } catch (error) {
    console.error("Failed to upload payments CSV:", error);
    return { error: "An unexpected error occurred while saving CSV data." };
  }
}

// ──────────────────────────────────────────────
//  Summary — Enhanced (counts + recent records)
// ──────────────────────────────────────────────

export async function getFinancialSummary() {
  const profile = await getAuthenticatedWorkerProfile();
  if (!profile) return null;

  const [
    totalEarnings,
    totalPayments,
    recentEarnings,
    recentPayments,
    sources,
    latestEarning,
    latestPayment,
  ] = await Promise.all([
    prisma.earningRecord.count({ where: { profileId: profile.id } }),
    prisma.paymentRecord.count({ where: { profileId: profile.id } }),
    prisma.earningRecord.findMany({
      where: { profileId: profile.id },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.paymentRecord.findMany({
      where: { profileId: profile.id },
      orderBy: { dueDate: "desc" },
      take: 10,
    }),
    prisma.financialSource.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.earningRecord.findFirst({
      where: { profileId: profile.id },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.paymentRecord.findFirst({
      where: { profileId: profile.id },
      orderBy: { dueDate: "desc" },
      select: { dueDate: true },
    }),
  ]);

  return {
    // Recent records for Overview tab
    earnings: recentEarnings,
    payments: recentPayments,
    sources,
    // Aggregate stats
    totalEarnings,
    totalPayments,
    latestEarningDate: latestEarning?.date ?? null,
    latestPaymentDate: latestPayment?.dueDate ?? null,
  };
}

// ──────────────────────────────────────────────
//  Paginated Earnings (NEW)
// ──────────────────────────────────────────────

export async function getEarningsPage(page: number = 1, pageSize: number = 20) {
  const profile = await getAuthenticatedWorkerProfile();
  if (!profile) return null;

  const skip = Math.max(0, (page - 1) * pageSize);

  const [records, total] = await Promise.all([
    prisma.earningRecord.findMany({
      where: { profileId: profile.id },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.earningRecord.count({ where: { profileId: profile.id } }),
  ]);

  return {
    records,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ──────────────────────────────────────────────
//  Paginated Payments (NEW)
// ──────────────────────────────────────────────

export async function getPaymentsPage(page: number = 1, pageSize: number = 20) {
  const profile = await getAuthenticatedWorkerProfile();
  if (!profile) return null;

  const skip = Math.max(0, (page - 1) * pageSize);

  const [records, total] = await Promise.all([
    prisma.paymentRecord.findMany({
      where: { profileId: profile.id },
      orderBy: { dueDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.paymentRecord.count({ where: { profileId: profile.id } }),
  ]);

  return {
    records,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

