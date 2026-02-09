import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for Platform Admin...');

  // Create Platform Admin
  const adminEmail = 'admin@platform.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Platform Administrator',
        role: 'PLATFORM_ADMIN',
        // No companyId needed for Platform Admin
      },
    });
    console.log('Created Platform Admin: admin@platform.com / admin123');
  } else {
    console.log('Platform Admin already exists');
  }

  // Check if we need to seed initial product data
  const existingCategory = await prisma.category.findUnique({ where: { slug: 'men-shoes' } });
  
  if (!existingCategory) {
    console.log('Seeding initial product data...');
    
    // 1. Create Categories
    const menShoes = await prisma.category.create({
      data: {
        slug: 'men-shoes',
        name: JSON.stringify({ en: "Men's Shoes", zh: "男鞋", es: "Zapatos de hombre" }),
      },
    });

    const hikingBoots = await prisma.category.create({
      data: {
        slug: 'hiking-boots',
        name: JSON.stringify({ en: "Hiking Boots", zh: "登山靴", es: "Botas de senderismo" }),
        parentId: menShoes.id,
      },
    });

    console.log('Created Categories');

    // 1.5 Create Attributes
    console.log('Seeding Attributes...');
    
    // Color Attribute
    const colorAttr = await prisma.attribute.create({
      data: {
        name: JSON.stringify({ en: "Color", zh: "颜色", es: "Color" }),
        code: "color",
        type: "color",
        values: {
          create: [
            { value: JSON.stringify({ en: "Red", zh: "红色", es: "Rojo" }), meta: "#FF0000" },
            { value: JSON.stringify({ en: "Army Green", zh: "军绿", es: "Verde militar" }), meta: "#4B5320" },
            { value: JSON.stringify({ en: "Black", zh: "黑色", es: "Negro" }), meta: "#000000" },
            { value: JSON.stringify({ en: "White", zh: "白色", es: "Blanco" }), meta: "#FFFFFF" },
            { value: JSON.stringify({ en: "Blue", zh: "蓝色", es: "Azul" }), meta: "#0000FF" },
          ]
        }
      }
    });

    // Size Attribute
    const sizeAttr = await prisma.attribute.create({
      data: {
        name: JSON.stringify({ en: "Size", zh: "尺码", es: "Talla" }),
        code: "size",
        type: "text",
        values: {
          create: [
            { value: JSON.stringify({ en: "40", zh: "40", es: "40" }) },
            { value: JSON.stringify({ en: "41", zh: "41", es: "41" }) },
            { value: JSON.stringify({ en: "42", zh: "42", es: "42" }) },
            { value: JSON.stringify({ en: "43", zh: "43", es: "43" }) },
            { value: JSON.stringify({ en: "44", zh: "44", es: "44" }) },
            { value: JSON.stringify({ en: "45", zh: "45", es: "45" }) },
          ]
        }
      }
    });
    
    console.log('Created Attributes: Color, Size');

    // 2. Create Product (Fixed UUID to match Frontend Mock)
    const product = await prisma.product.create({
      data: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: hikingBoots.id,
        title: JSON.stringify({ en: "Professional Waterproof Hiking Boots 2024", zh: "2024新款专业防水登山靴", es: "Botas de senderismo impermeables 2024" }),
        description: JSON.stringify({ en: "<p>High durability rubber sole...</p>", zh: "<p>高耐磨橡胶大底...</p>" }),
        images: JSON.stringify(['https://example.com/boots-main.jpg', 'https://example.com/boots-detail.jpg']), // SQLite stores JSON array as string
        basePrice: 45.00,
        specsTemplate: JSON.stringify({ colors: ["Red", "Army Green", "Black"], sizes: ["40", "41", "42", "43", "44", "45"] }),
        isPublished: true,
      },
    });

    console.log('Created Product');

    // 3. Create SKUs
    // Find attributes first to get IDs (in case we didn't just create them)
    const colorAttribute = await prisma.attribute.findUnique({ where: { code: 'color' }, include: { values: true } });
    const sizeAttribute = await prisma.attribute.findUnique({ where: { code: 'size' }, include: { values: true } });

    if (colorAttribute && sizeAttribute) {
      for (const color of colorAttribute.values) {
        // Only use 3 colors to match mock
        const colorName = JSON.parse(color.value).en;
        if (!['Red', 'Army Green', 'Black'].includes(colorName)) continue;

        for (const size of sizeAttribute.values) {
          const sizeName = JSON.parse(size.value).en;
          
          await prisma.sku.create({
            data: {
              productId: product.id,
              skuCode: `HB-${colorName.substring(0, 3).toUpperCase()}-${sizeName}`,
              specs: JSON.stringify({ color: colorName, size: sizeName }),
              price: 45.00,
              moq: 10,
              stock: Math.floor(Math.random() * 100) + 10,
              attributeValues: {
                create: [
                  { attributeValueId: color.id },
                  { attributeValueId: size.id }
                ]
              }
            },
          });
        }
      }
      
      // Link attributes to product
      await prisma.productAttribute.createMany({
        data: [
          { productId: product.id, attributeId: colorAttribute.id },
          { productId: product.id, attributeId: sizeAttribute.id }
        ]
      });
    }

    console.log('Created SKUs and linked Attributes');
  } else {
    console.log('Product data already exists, skipping.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
