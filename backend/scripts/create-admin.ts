import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'boss@example.com';
  const password = 'password123';
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
      fullName: 'Platform Admin',
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
