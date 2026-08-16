/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'lender@demo.credibridge.com' },
    select: { passwordHash: true, role: true, email: true }
  });
  console.log('User found:', !!user, 'Role:', user && user.role);
  if (user && user.passwordHash) {
    const match = await bcrypt.compare('demo123', user.passwordHash);
    console.log('Password match:', match);
    console.log('Hash prefix:', user.passwordHash.substring(0, 10));
  }
  await prisma.$disconnect();
}
check().catch(console.error);
