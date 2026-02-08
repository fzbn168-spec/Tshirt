
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting real product entry seed...');

  // 1. Create Attributes: Color, Size
  // Check if they exist first to avoid duplicates
  let colorAttr = await prisma.attribute.findFirst({ where: { code: 'color' } });
  if (!colorAttr) {
    colorAttr = await prisma.attribute.create({
      data: {
        name: JSON.stringify({ en: 'Color', zh: '颜色' }),
        code: 'color',
        type: 'text',
        values: {
          create: [
            { value: JSON.stringify({ en: 'Black', zh: '黑色' }) },
            { value: JSON.stringify({ en: 'Brown', zh: '棕色' }) },
            { value: JSON.stringify({ en: 'Tan', zh: '卡其色' }) },
          ]
        }
      }
    });
    console.log('Created Color attribute');
  }

  let sizeAttr = await prisma.attribute.findFirst({ where: { code: 'size' } });
  if (!sizeAttr) {
    sizeAttr = await prisma.attribute.create({
      data: {
        name: JSON.stringify({ en: 'Size', zh: '尺码' }),
        code: 'size',
        type: 'text',
        values: {
          create: [
            { value: JSON.stringify({ en: 'US 7', zh: 'US 7' }) },
            { value: JSON.stringify({ en: 'US 8', zh: 'US 8' }) },
            { value: JSON.stringify({ en: 'US 9', zh: 'US 9' }) },
            { value: JSON.stringify({ en: 'US 10', zh: 'US 10' }) },
          ]
        }
      }
    });
    console.log('Created Size attribute');
  }

  // Reload to get values with IDs
  const color = await prisma.attribute.findUnique({ 
    where: { id: colorAttr.id }, 
    include: { values: true } 
  });
  const size = await prisma.attribute.findUnique({ 
    where: { id: sizeAttr.id }, 
    include: { values: true } 
  });

  if (!color || !size) throw new Error('Attributes not found');

  // 2. Create Product: Men's Leather Hiking Boot
  const productData = {
    title: JSON.stringify({ en: "Men's Waterproof Leather Hiking Boots", zh: "男士防水真皮登山靴" }),
    description: JSON.stringify({ 
      en: "Premium full-grain leather upper with waterproof membrane. Durable rubber outsole for traction.", 
      zh: "优质全粒面真皮鞋面，配有防水膜。耐用的橡胶大底提供抓地力。" 
    }),
    basePrice: 85.00,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80"
    ]),
    specsTemplate: JSON.stringify({}),
    isPublished: true,
    categoryId: (await prisma.category.findFirst())?.id || '', // Just pick first category
  };

  // Generate SKUs (Cartesian Product of Color x Size)
  const skus: any[] = [];
  
  for (const cVal of color.values) {
    for (const sVal of size.values) {
      const colorName = JSON.parse(cVal.value).en;
      const sizeName = JSON.parse(sVal.value).en;
      
      const skuCode = `BOOT-${colorName.toUpperCase().substring(0,3)}-${sizeName.replace('US ', '')}`;
      
      skus.push({
        skuCode,
        specs: JSON.stringify({ color: colorName, size: sizeName }),
        price: 85.00,
        stock: 100,
        moq: 10,
        tierPrices: JSON.stringify([
          { minQty: 50, price: 80.00 },
          { minQty: 100, price: 75.00 },
          { minQty: 500, price: 68.00 }
        ]),
        attributeValues: {
          create: [
            { attributeValueId: cVal.id },
            { attributeValueId: sVal.id }
          ]
        }
      });
    }
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      attributes: {
        create: [
          { attributeId: color.id },
          { attributeId: size.id }
        ]
      },
      skus: {
        create: skus
      }
    }
  });

  console.log(`Created Product: ${JSON.parse(product.title).en} with ${skus.length} SKUs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
