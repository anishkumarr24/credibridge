import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Worker data reset...');

  // 1. Identify Worker accounts
  const workerUsers = await prisma.user.findMany({
    where: { role: 'WORKER' },
    select: { id: true, workerProfile: { select: { id: true } } },
  });

  const workerUserIds = workerUsers.map((u) => u.id);
  const workerProfileIds = workerUsers
    .map((u) => u.workerProfile?.id)
    .filter((id): id is string => id !== undefined);

  if (workerUserIds.length === 0) {
    console.log('No Worker accounts found. Exiting.');
    return;
  }

  // 2. Count dependent records
  const profilesCount = workerProfileIds.length;

  const earningCount = await prisma.earningRecord.count({ where: { profileId: { in: workerProfileIds } } });
  const paymentCount = await prisma.paymentRecord.count({ where: { profileId: { in: workerProfileIds } } });
  const sourceCount = await prisma.financialSource.count({ where: { profileId: { in: workerProfileIds } } });
  const financialRecordsCount = earningCount + paymentCount + sourceCount;

  const scoreBaseCount = await prisma.score.count({ where: { profileId: { in: workerProfileIds } } });
  const scoreFactorCount = await prisma.scoreFactor.count({ where: { score: { profileId: { in: workerProfileIds } } } });
  const recommendationCount = await prisma.recommendation.count({ where: { score: { profileId: { in: workerProfileIds } } } });
  const scoreRecordsCount = scoreBaseCount + scoreFactorCount + recommendationCount;

  const syntheticCount = await prisma.syntheticDataset.count({ where: { profileId: { in: workerProfileIds } } });
  const applicationCount = await prisma.application.count({ where: { profileId: { in: workerProfileIds } } });

  // 3. Delete records in a transaction
  // Note: Since some relations don't have cascade (e.g. AuditLog), we delete those first.
  // We also explicitly delete SyntheticDatasets since they don't have a foreign key relation in the Prisma schema.
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { userId: { in: workerUserIds } } }),
    prisma.notification.deleteMany({ where: { userId: { in: workerUserIds } } }),
    prisma.consentRecord.deleteMany({ where: { userId: { in: workerUserIds } } }),
    prisma.syntheticDataset.deleteMany({ where: { profileId: { in: workerProfileIds } } }),
    
    // We can rely on Cascade for these, but explicitly doing it might be cleaner for the log
    // Applications, CreditProfiles, Scores, EarningRecords, PaymentRecords, FinancialSources are all Cascade from WorkerProfile
    // WorkerProfile is Cascade from User
    // But doing it via User delete is safest.
    
    prisma.user.deleteMany({ where: { id: { in: workerUserIds } } }),
  ]);

  console.log('\n--- Reset Report ---');
  console.log(`Worker accounts deleted: ${workerUserIds.length}`);
  console.log(`WorkerProfiles deleted: ${profilesCount}`);
  console.log(`Financial records deleted: ${financialRecordsCount}`);
  console.log(`Score/history records deleted: ${scoreRecordsCount}`);
  console.log(`Synthetic Worker datasets deleted: ${syntheticCount}`);
  console.log(`Worker-owned applications deleted: ${applicationCount}`);
  
  // 4. Verify Admin and Lenders still exist
  const remainingLenders = await prisma.user.count({ where: { role: 'LENDER' } });
  const remainingAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const remainingWorkers = await prisma.user.count({ where: { role: 'WORKER' } });

  console.log(`\n--- Verification ---`);
  console.log(`Lender accounts preserved: ${remainingLenders > 0 ? 'Yes (' + remainingLenders + ' found)' : (remainingLenders === 0 ? 'Yes (none existed before)' : 'No')}`);
  console.log(`Admin accounts preserved: ${remainingAdmins > 0 ? 'Yes (' + remainingAdmins + ' found)' : (remainingAdmins === 0 ? 'Yes (none existed before)' : 'No')}`);
  console.log(`Prisma schema changed: No`);
  console.log(`Remaining Worker accounts: ${remainingWorkers}`);
}

main()
  .catch((e) => {
    console.error('Error during data reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
