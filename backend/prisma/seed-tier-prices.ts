
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding tier prices...');

  // 1. Update PUMP-50-30
  // Base Price was likely around 1200-1500 based on previous context, let's just check or overwrite.
  // Actually, I'll just set it.
  
  const sku1 = await prisma.sku.findUnique({ where: { skuCode: 'PUMP-50-30' } });
  if (sku1) {
    const basePrice = Number(sku1.price);
    const tiers = [
      { minQty: 5, price: basePrice * 0.95 },
      { minQty: 10, price: basePrice * 0.90 },
      { minQty: 20, price: basePrice * 0.85 }
    ];
    
    await prisma.sku.update({
      where: { id: sku1.id },
      data: {
        tierPrices: JSON.stringify(tiers)
      }
    });
    console.log(`Updated PUMP-50-30 with tiers: ${JSON.stringify(tiers)}`);
  } else {
    console.log('PUMP-50-30 not found');
  }

  // 2. Update PUMP-80-50
  const sku2 = await prisma.sku.findUnique({ where: { skuCode: 'PUMP-80-50' } });
  if (sku2) {
    const basePrice = Number(sku2.price);
    const tiers = [
      { minQty: 3, price: basePrice * 0.95 },
      { minQty: 10, price: basePrice * 0.88 }
    ];
    
    await prisma.sku.update({
      where: { id: sku2.id },
      data: {
        tierPrices: JSON.stringify(tiers)
      }
    });
    console.log(`Updated PUMP-80-50 with tiers: ${JSON.stringify(tiers)}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
