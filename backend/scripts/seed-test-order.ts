import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed-test-order...');

  // 1. Create or Get Category
  const category = await prisma.category.upsert({
    where: { slug: 'test-category' },
    update: {},
    create: {
      name: JSON.stringify({ en: 'Test Category', zh: '测试分类' }),
      slug: 'test-category',
    },
  });
  console.log('Category ensured:', category.id);

  // 2. Create or Get Product
  const product = await prisma.product.create({
    data: {
      title: JSON.stringify({ en: 'Test Product', zh: '测试商品' }),
      description: JSON.stringify({ en: 'This is a test product', zh: '这是一个测试商品' }),
      basePrice: 100,
      images: JSON.stringify(['https://via.placeholder.com/150']),
      categoryId: category.id,
      isPublished: true,
      specsTemplate: JSON.stringify({ color: ['Red'], size: ['42'] }),
    },
  });
  console.log('Product created:', product.id);

  // 3. Create SKU
  const sku = await prisma.sku.create({
    data: {
      productId: product.id,
      skuCode: `TEST-SKU-${Date.now()}`,
      specs: JSON.stringify({ color: 'Red', size: '42' }),
      price: 100,
      stock: 1000,
    },
  });
  console.log('SKU created:', sku.id);

  // 4. Create Buyer Company
  const company = await prisma.company.create({
    data: {
      name: 'Test Buyer Company',
      contactEmail: `buyer-company-${Date.now()}@test.com`,
      status: 'APPROVED',
      address: '123 Test St, Test City, TS 12345',
    },
  });
  console.log('Company created:', company.id);

  // 5. Create Buyer User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: `testbuyer-${Date.now()}@example.com`,
      passwordHash,
      fullName: 'Test Buyer',
      role: 'MEMBER',
      companyId: company.id,
    },
  });
  console.log('User created:', user.id);

  // 6. Create Order
  const order = await prisma.order.create({
    data: {
      orderNo: `ORD-${Date.now()}`,
      companyId: company.id,
      userId: user.id,
      status: 'PENDING_PAYMENT',
      totalAmount: 200,
      currency: 'USD',
      items: {
        create: [
          {
            productId: product.id,
            skuId: sku.id,
            productName: 'Test Product',
            skuSpecs: 'Color: Red, Size: 42',
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
          },
        ],
      },
    },
  });
  console.log('Order created:', order.id);
  console.log('Order No:', order.orderNo);
  console.log('-----------------------------------');
  console.log('You can now verify CI/PL generation for Order ID:', order.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
