import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'boss@example.com';
  const password = process.argv[3] || 'password123';
  const fullName = process.argv[4] || 'Platform Admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: 'PLATFORM_ADMIN',
    },
    create: {
      email,
      passwordHash: hashedPassword,
      fullName,
      role: 'PLATFORM_ADMIN',
    },
  });

  console.log(`Upserted Admin User: ${user.email} with role ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
