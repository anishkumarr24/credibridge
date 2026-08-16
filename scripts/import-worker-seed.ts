import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function calculateTenureMonths(startDateStr: string): number {
  const start = new Date(startDateStr);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += now.getMonth();
  return months <= 0 ? 0 : months;
}

async function main() {
  const seedDir = path.join(__dirname, '../seed_data_extracted/seed');
  const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf-8'));
    
    const wp = data.workerProfile;
    const email = `${wp.alias.toLowerCase().replace(/\s+/g, '.')}@demo.credibridge.com`;
    const workerPass = process.env.WORKER_PASSWORD;
    if (!workerPass) {
      throw new Error('WORKER_PASSWORD environment variable must be set.');
    }
    const passwordHash = await bcrypt.hash(workerPass, 10);
    
    // Create User & WorkerProfile
    const user = await prisma.user.create({
      data: {
        email: email,
        name: wp.alias,
        passwordHash,
        role: 'WORKER',
        workerProfile: {
          create: {
            location: wp.city,
            occupationType: wp.occupation,
            primaryPlatform: wp.platform,
            platformTenure: wp.tenure_start_date ? calculateTenureMonths(wp.tenure_start_date) : null,
            monthlyExpenses: wp.self_reported_monthly_expenses,
            onboarded: true
          }
        }
      },
      include: {
        workerProfile: true
      }
    });

    const profileId = user.workerProfile!.id;

    // Insert Earning Records
    for (const er of data.earningsRecords || []) {
      // er.month is "YYYY-MM"
      const date = new Date(`${er.month}-01T00:00:00Z`);
      await prisma.earningRecord.create({
        data: {
          profileId,
          date,
          platform: wp.platform,
          grossEarnings: er.amount, // Just using amount as net/gross for simplicity based on provided schema requirements
          netEarnings: er.amount,
          incentives: 0,
          deductions: 0
        }
      });
    }

    // Insert Payment Records
    for (const pr of data.paymentRecords || []) {
      const dueDate = new Date(pr.due_date);
      let paidDate = pr.paid_date ? new Date(pr.paid_date) : null;
      let status: 'PAID' | 'LATE' | 'MISSED' | 'PENDING' = 'PAID';
      
      if (pr.unpaid_flag) {
        status = 'MISSED';
        paidDate = null;
      } else if (paidDate && paidDate > dueDate) {
        status = 'LATE';
      }

      await prisma.paymentRecord.create({
        data: {
          profileId,
          category: pr.category,
          amount: pr.amount,
          dueDate,
          paidDate,
          status
        }
      });
    }

    // Insert Loan Application
    if (data.loanApplication) {
      await prisma.application.create({
        data: {
          profileId,
          requestedAmount: data.loanApplication.requested_amount,
          notes: data.loanApplication.purpose,
          status: 'SUBMITTED'
        }
      });
    }

    console.log(`Imported ${wp.alias} successfully.`);
  }

  console.log('Done importing all 5 workers.');
}

main()
  .catch((e) => {
    console.error('Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
