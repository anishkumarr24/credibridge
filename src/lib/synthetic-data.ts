import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { computeAndSaveScoreForProfile } from "@/actions/scoring";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function generateSyntheticWorker(preset: "stable_worker" | "seasonal_worker" | "growing_worker" | "unstable_worker" | "recovery_worker") {
  const seedId = randomBytes(4).toString("hex");
  const email = `demo_${preset}_${seedId}@credibridge.local`;
  const name = `Demo ${preset.replace("_", " ").toUpperCase()} ${seedId}`;
  
  const passwordHash = await bcrypt.hash("demo123", 10);
  
  // 1. Create the user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: Role.WORKER,
      emailVerified: true,
      workerProfile: {
        create: {
          phone: "+91 9999999999",
          location: "Bangalore",
          occupationType: "Delivery Partner",
          primaryPlatform: "FoodDeliveryApp",
          platformTenure: 18,
          monthlyExpenses: 15000,
          onboarded: true,
        }
      }
    },
    include: { workerProfile: true }
  });

  const profileId = user.workerProfile!.id;

  // 2. Create the dataset tracker
  const dataset = await prisma.syntheticDataset.create({
    data: {
      preset,
      profileId,
      recordCount: 24, // Rough approximation
    }
  });

  // 3. Generate data based on preset
  const earningRecords = [];
  const paymentRecords = [];
  const today = new Date();
  
  const baseIncome = 25000;
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 15);
    let netEarnings = baseIncome;
    let paymentStatus = "PAID";
    let paymentPaidDate: Date | null = new Date(today.getFullYear(), today.getMonth() - i, 5);
    
    switch (preset) {
      case "stable_worker":
        // Stable income +- 5%
        netEarnings = baseIncome + (Math.random() * 2000 - 1000);
        break;
      case "seasonal_worker":
        // Big spikes and drops
        if (i % 6 === 0) netEarnings = baseIncome * 1.8;
        else if (i % 6 === 3) netEarnings = baseIncome * 0.4;
        else netEarnings = baseIncome;
        if (netEarnings < 15000) paymentPaidDate = new Date(today.getFullYear(), today.getMonth() - i, 20); // Late
        break;
      case "growing_worker":
        // Increasing trend
        netEarnings = baseIncome + (12 - i) * 1500;
        break;
      case "unstable_worker":
        // highly volatile
        netEarnings = baseIncome + (Math.random() * 20000 - 10000);
        if (Math.random() > 0.6) {
          paymentStatus = "MISSED";
          paymentPaidDate = null;
        } else if (Math.random() > 0.5) {
          paymentPaidDate = new Date(today.getFullYear(), today.getMonth() - i, 25); // very late
        }
        break;
      case "recovery_worker":
        // Decline in middle, then recovery
        if (i > 8 && i <= 11) netEarnings = baseIncome;
        else if (i > 4 && i <= 8) {
          netEarnings = baseIncome * 0.5;
          if (i === 6 || i === 7) {
             paymentStatus = "LATE";
             paymentPaidDate = new Date(today.getFullYear(), today.getMonth() - i, 15);
          }
        }
        else netEarnings = baseIncome * 1.1; // Recovery
        break;
    }

    earningRecords.push({
      profileId,
      date: monthDate,
      platform: "FoodDeliveryApp",
      grossEarnings: netEarnings * 1.1,
      netEarnings,
    });

    paymentRecords.push({
      profileId,
      category: "electricity",
      amount: 1500,
      dueDate: new Date(today.getFullYear(), today.getMonth() - i, 1),
      paidDate: paymentPaidDate,
      status: paymentStatus as "PAID" | "LATE" | "MISSED" | "PENDING",
    });
    
    // Add internet
    paymentRecords.push({
      profileId,
      category: "internet",
      amount: 800,
      dueDate: new Date(today.getFullYear(), today.getMonth() - i, 10),
      paidDate: paymentPaidDate ? new Date(today.getFullYear(), today.getMonth() - i, 10 + (Math.random()*5)) : null,
      status: paymentStatus as "PAID" | "LATE" | "MISSED" | "PENDING",
    });
  }

  await prisma.earningRecord.createMany({ data: earningRecords });
  await prisma.paymentRecord.createMany({ data: paymentRecords });
  
  await prisma.financialSource.createMany({
    data: [
      { profileId, category: "GIG_EARNINGS", sourceType: "SYNTHETIC", recordCount: 12 },
      { profileId, category: "UTILITY_PAYMENTS", sourceType: "SYNTHETIC", recordCount: 24 }
    ]
  });

  // 4. Calculate Score
  await computeAndSaveScoreForProfile(user.id);
  
  // 5. Apply for a loan to show up in Lender Dashboard
  await prisma.application.create({
    data: {
      profileId,
      status: "SUBMITTED",
      notes: `Demo application from synthetic ${preset}`,
      requestedAmount: baseIncome * 2.5 // Add realistic requested amount (2.5x base income)
    }
  });

  return { user, dataset };
}
