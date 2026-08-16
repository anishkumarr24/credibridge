"use server";

import { prisma } from "@/lib/prisma";
import { generateSyntheticWorker } from "@/lib/synthetic-data";
export async function getOrGenerateDemoUser(preset: "stable_worker" | "seasonal_worker" | "growing_worker" | "unstable_worker" | "recovery_worker") {
  // Try to find the most recently generated dataset for this preset
  const datasets = await prisma.syntheticDataset.findMany({
    where: { preset },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  for (const dataset of datasets) {
    if (dataset.profileId) {
      const profile = await prisma.workerProfile.findUnique({
        where: { id: dataset.profileId },
        include: { user: true }
      });
      
      if (profile && profile.user && profile.user.email.startsWith("demo_")) {
        return { 
          email: profile.user.email,
          password: "demo123"
        };
      }
    }
  }
  // If none exists, generate it on the fly
  const { user } = await generateSyntheticWorker(preset);
  
  return {
    email: user.email,
    password: "demo123" // from the generator
  };
}
export async function getOrGenerateDemoLender() {
  const email = "lender@demo.credibridge.com";
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("demo123", 10);
    user = await prisma.user.create({
      data: {
        name: "Demo Lender",
        email,
        passwordHash,
        role: "LENDER",
        lenderProfile: {
          create: {
            organisation: "CrediBridge Demo Bank"
          }
        }
      }
    });
  }
  return { email, password: "demo123" };
}

export async function getOrGenerateDemoAdmin() {
  const email = "admin@demo.credibridge.com";
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("demo123", 10);
    user = await prisma.user.create({
      data: {
        name: "Demo Admin",
        email,
        passwordHash,
        role: "ADMIN"
      }
    });
  }
  return { email, password: "demo123" };
}
