"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/../auth";
import { Role } from "@prisma/client";
import { generateSyntheticWorker } from "@/lib/synthetic-data";
import { revalidatePath } from "next/cache";

/**
 * Ensures the user is an authenticated admin.
 */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== Role.ADMIN) throw new Error("Forbidden: Admin access required");
  
  return session;
}

/**
 * Fetches dashboard metrics for Admin.
 */
export async function getAdminMetrics() {
  await requireAdmin();
  
  const [
    totalUsers,
    totalWorkers,
    totalLenders,
    totalApplications,
    totalSyntheticDatasets
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.WORKER } }),
    prisma.user.count({ where: { role: Role.LENDER } }),
    prisma.application.count(),
    prisma.syntheticDataset.count()
  ]);

  return {
    totalUsers,
    totalWorkers,
    totalLenders,
    totalApplications,
    totalSyntheticDatasets
  };
}

/**
 * Fetches synthetic datasets
 */
export async function getSyntheticDatasets() {
  await requireAdmin();
  return await prisma.syntheticDataset.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Creates synthetic data based on preset
 */
export async function createSyntheticData(preset: "stable_worker" | "seasonal_worker" | "growing_worker" | "unstable_worker" | "recovery_worker") {
  await requireAdmin();
  
  try {
    const { dataset } = await generateSyntheticWorker(preset);
    revalidatePath("/dashboard/admin/synthetic-data");
    revalidatePath("/dashboard/admin");
    return { success: true, datasetId: dataset.id };
  } catch (error: unknown) {
    console.error("Failed to generate synthetic data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: errorMessage };
  }
}
