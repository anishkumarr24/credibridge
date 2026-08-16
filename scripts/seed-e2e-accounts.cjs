/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  // Seed lender demo account
  const lenderEmail = 'lender@demo.credibridge.com';
  const existing = await prisma.user.findUnique({ where: { email: lenderEmail } });
  if (!existing) {
    const lenderPass = process.env.LENDER_PASSWORD;
    if (!lenderPass) throw new Error('LENDER_PASSWORD must be set');
    const hash = await bcrypt.hash(lenderPass, 10);
    await prisma.user.create({
      data: {
        name: 'Demo Lender',
        email: lenderEmail,
        passwordHash: hash,
        role: 'LENDER',
        lenderProfile: { create: { organisation: 'CrediBridge Demo Bank' } }
      }
    });
    console.log('Created lender demo account');
  } else {
    console.log('Lender demo account already exists');
  }

  // Seed admin demo account
  const adminEmail = 'admin@demo.credibridge.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) throw new Error('ADMIN_PASSWORD must be set');
    const hash = await bcrypt.hash(adminPass, 10);
    await prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: adminEmail,
        passwordHash: hash,
        role: 'ADMIN'
      }
    });
    console.log('Created admin demo account');
  } else {
    console.log('Admin demo account already exists');
  }

  await prisma.$disconnect();
  console.log('Done');
}

seed().catch(function(e) { console.error(e); process.exit(1); });
