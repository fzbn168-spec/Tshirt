import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: npx ts-node onboard-beta-client.ts <CompanyName> <AdminEmail>');
    process.exit(1);
  }

  const [companyName, email] = args;

  console.log(`🚀 Onboarding Beta Client: ${companyName}...`);

  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error(`❌ User ${email} already exists!`);
    process.exit(1);
  }

  // 2. Create Company
  const company = await prisma.company.create({
    data: {
      name: companyName,
      contactEmail: email,
      status: 'APPROVED', // Auto-approve for beta clients
      description: 'Beta Tester',
    },
  });

  // 3. Generate Random Password
  const rawPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 4. Create Company Admin
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: 'Admin User',
      role: 'COMPANY_ADMIN',
      companyId: company.id,
    },
  });

  // 5. Output Invitation Letter
  console.log('\n✅ Client Onboarded Successfully!');
  console.log('----------------------------------------------------');
  console.log('📧 COPY & SEND THIS EMAIL TO THE CLIENT:');
  console.log('----------------------------------------------------');
  console.log(`Subject: Welcome to SoleTrade Beta Program - Your Access Details`);
  console.log(`\nDear Team ${companyName},`);
  console.log(`\nWe are thrilled to invite you to the SoleTrade exclusive beta.`);
  console.log(`Your B2B portal is ready. Here are your login credentials:`);
  console.log(`\nPortal URL: https://aif1688.com`);
  console.log(`Email:      ${email}`);
  console.log(`Password:   ${rawPassword}`);
  console.log(`\nPlease login and change your password immediately.`);
  console.log(`\nBest regards,\nThe SoleTrade Team`);
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
