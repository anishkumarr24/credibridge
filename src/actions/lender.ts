"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/../auth";
import { Role } from "@prisma/client";

/**
 * Ensures the user is an authenticated lender.
 */
async function requireLender() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== Role.LENDER) throw new Error("Forbidden");
  
  // Try to find the lender profile
  let lenderProfile = await prisma.lenderProfile.findUnique({
    where: { userId: session.user.id },
  });
  
  // If no profile exists, create a default one for the hackathon
  if (!lenderProfile) {
    lenderProfile = await prisma.lenderProfile.create({
      data: {
        userId: session.user.id,
        organisation: "CrediBridge Partner Bank",
      },
    });
  }
  
  return { session, lenderProfile };
}

/**
 * Fetches applications for the lender dashboard.
 */
export async function getLenderApplications() {
  const { lenderProfile } = await requireLender();
  
  const applications = await prisma.application.findMany({
    where: {
      OR: [
        { lenderId: lenderProfile.id },
        { lenderId: null } // Open applications
      ]
    },
    include: {
      worker: {
        include: {
          user: true,
          scores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return applications;
}

/**
 * Get details for a single application
 */
export async function getApplicationDetails(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      worker: {
        include: {
          user: true,
          scores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
            include: {
              factors: true
            }
          },
          earningRecords: {
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      }
    }
  });
  
  if (!application) throw new Error("Application not found");
  
  const { lenderProfile } = await requireLender();
  if (application.lenderId && application.lenderId !== lenderProfile.id) {
    throw new Error("Forbidden: This application is assigned to a different lender");
  }
  
  return application;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(applicationId: string, status: "APPROVED" | "DECLINED" | "MORE_INFO_NEEDED") {
  const { lenderProfile } = await requireLender();
  
  const existingApp = await prisma.application.findUnique({
    where: { id: applicationId }
  });

  if (!existingApp) {
    throw new Error("Application not found");
  }

  if (existingApp.lenderId && existingApp.lenderId !== lenderProfile.id) {
    throw new Error("Forbidden: This application is assigned to a different lender");
  }
  
  return await prisma.application.update({
    where: { id: applicationId },
    data: { 
      status,
      lenderId: lenderProfile.id, 
    }
  });
}
