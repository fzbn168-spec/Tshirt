
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@platform.com' }
  });
  console.log('Admin User:', user);
}

checkAdmin()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
