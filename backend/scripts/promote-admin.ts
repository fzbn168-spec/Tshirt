
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address as an argument.');
    console.log('Usage: npx ts-node scripts/promote-admin.ts <email>');
    process.exit(1);
  }

  console.log(`Elevating user ${email} to PLATFORM_ADMIN...`);

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'PLATFORM_ADMIN' },
    });

    console.log(`✅ Success! User ${user.email} is now a PLATFORM_ADMIN.`);
    console.log('You can now access the Admin Panel at /admin');
  } catch (error) {
    console.error('Error updating user:', error);
    console.log('Make sure the user exists first.');
  } finally {
    await prisma.$disconnect();
  }
}

main();
