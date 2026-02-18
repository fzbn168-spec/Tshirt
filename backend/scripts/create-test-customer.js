
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'test@example.com';
  const password = 'password123';
  const companyName = 'Test Company Ltd.';

  console.log(`Checking for user: ${email}...`);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists.`);
    console.log('Password might be different if it was created manually.');
    // Optional: Update password to ensure it matches
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });
    console.log(`Password reset to: ${password}`);
    return;
  }

  // Create Company
  console.log(`Creating company: ${companyName}...`);
  let company = await prisma.company.findFirst({
    where: { name: companyName }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: companyName,
        contactEmail: 'contact@testcompany.com',
        status: 'APPROVED',
        address: '123 Test St, Test City',
      },
    });
    console.log(`Created company with ID: ${company.id}`);
  } else {
    console.log(`Using existing company with ID: ${company.id}`);
  }

  // Create User
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      fullName: 'Test Customer',
      role: 'ADMIN', // Company Admin
      companyId: company.id,
    },
  });

  console.log('----------------------------------------------------');
  console.log('✅ Test Customer Created Successfully!');
  console.log(`Email:      ${email}`);
  console.log(`Password:   ${password}`);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
