"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { profileSchema, ProfileFormValues } from "@/lib/schemas";

export async function updateWorkerProfile(data: ProfileFormValues) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.WORKER) {
      return { error: "Unauthorized access" };
    }

    const parsedData = profileSchema.safeParse(data);
    
    if (!parsedData.success) {
      return { error: "Invalid data provided" };
    }

    const cleanData = parsedData.data;

    const platformTenure = cleanData.platformTenure === "" ? null : cleanData.platformTenure;
    const monthlyExpenses = cleanData.monthlyExpenses === "" ? null : cleanData.monthlyExpenses;

    await prisma.workerProfile.update({
      where: { userId: session.user.id },
      data: {
        phone: cleanData.phone || null,
        location: cleanData.location || null,
        occupationType: cleanData.occupationType || null,
        primaryPlatform: cleanData.primaryPlatform || null,
        platformTenure: platformTenure as number | null,
        monthlyExpenses: monthlyExpenses as number | null,
        onboarded: true,
      },
    });

    revalidatePath("/dashboard/worker/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { error: "An unexpected error occurred while saving." };
  }
}

export async function getWorkerProfile() {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.WORKER) {
    return null;
  }

  return prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
  });
}
