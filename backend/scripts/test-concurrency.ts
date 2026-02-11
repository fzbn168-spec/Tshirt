import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001';

async function main() {
  console.log('🚀 Starting Concurrency & Rollback Test...');

  // 1. Setup: Create Test User, Company, Product, SKU
  console.log('1️⃣  Setup: Creating test data...');
  
  // Clean up previous test data if any
  const testEmail = 'concurrency-tester@test.com';
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existingUser) {
    // Cascading delete would be better, but for safety let's just create a unique one or reuse
    // To ensure clean slate, let's create a new unique user every time
  }

  const uniqueSuffix = Date.now();
  const company = await prisma.company.create({
    data: {
      name: `Concurrency Test Co ${uniqueSuffix}`,
      contactEmail: `ct-co-${uniqueSuffix}@test.com`,
      status: 'APPROVED'
    }
  });

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: `ct-user-${uniqueSuffix}@test.com`,
      passwordHash,
      fullName: 'Concurrency Tester',
      role: 'MEMBER',
      companyId: company.id
    }
  });

  // Login to get token
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: user.email,
    password: 'password123'
  });
  const token = loginRes.data.access_token;
  console.log('   ✅ Logged in');

  // Create Category
  const category = await prisma.category.upsert({
    where: { slug: 'test-cat' },
    update: {},
    create: { name: JSON.stringify({ en: 'Test' }), slug: 'test-cat' }
  });

  // Create Product & SKU with STOCK = 1
  const product = await prisma.product.create({
    data: {
      title: JSON.stringify({ en: 'Limited Edition Sneaker' }),
      description: JSON.stringify({ en: 'Only 1 left!' }),
      basePrice: 100,
      categoryId: category.id,
      specsTemplate: '{}',
      isPublished: true
    }
  });

  const sku = await prisma.sku.create({
    data: {
      productId: product.id,
      skuCode: `LIMIT-${uniqueSuffix}`,
      price: 100,
      stock: 1, // <--- CRITICAL: Only 1 in stock
      specs: '{}'
    }
  });
  console.log(`   ✅ Created SKU ${sku.skuCode} with Stock: 1`);

  // 2. Attack: Launch 100 Concurrent Requests
  console.log('2️⃣  Attack: Launching 100 concurrent orders...');
  const CONCURRENT_REQUESTS = 100;
  const results = { success: 0, failed: 0, errors: [] as any[] };

  const attackPromises = Array.from({ length: CONCURRENT_REQUESTS }).map(async (_, index) => {
    try {
      await axios.post(
        `${API_URL}/orders`,
        {
          items: [
            {
              productId: product.id,
              skuId: sku.id,
              quantity: 1,
              unitPrice: 100, // Should be ignored by backend
              productName: 'Frontend Name', // Should be ignored
              skuSpecs: '-'
            }
          ]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { status: 'fulfilled' };
    } catch (error: any) {
        return { status: 'rejected', reason: error.response?.data || error.message };
    }
  });

  const responses = await Promise.all(attackPromises);

  responses.forEach(res => {
    if (res.status === 'fulfilled') results.success++;
    else results.failed++;
  });

  console.log(`   📊 Attack Results: Success=${results.success}, Failed=${results.failed}`);

  // 3. Assertions
  const finalSku = await prisma.sku.findUnique({ where: { id: sku.id } });
  console.log(`   🔍 Final Stock in DB: ${finalSku?.stock}`);

  if (results.success === 1 && results.failed === 99 && finalSku?.stock === 0) {
    console.log('   ✅ CONCURRENCY TEST PASSED: Only 1 order succeeded, Stock is 0.');
  } else {
    console.error('   ❌ CONCURRENCY TEST FAILED!');
    console.error(`      Expected 1 success, got ${results.success}`);
    console.error(`      Expected stock 0, got ${finalSku?.stock}`);
    process.exit(1);
  }

  // 4. Test Rollback
  console.log('3️⃣  Test Rollback: Cancelling the successful order...');
  
  // Find the successful order
  const successfulOrder = await prisma.order.findFirst({
    where: { 
        userId: user.id,
        items: { some: { skuId: sku.id } }
    }
  });

  if (!successfulOrder) {
      console.error('   ❌ Could not find the successful order to cancel');
      process.exit(1);
  }

  // Cancel it via Admin API (simulating admin action or user cancellation)
  // We need admin token or just use the user token if allowed (Users usually can't cancel PENDING_PAYMENT without payment failure logic, but let's assume updateStatus endpoint allows it for testing or we use a script direct call)
  // Actually, let's use the API to test the full flow.
  // User cancelling their own order usually goes to a different endpoint or updateStatus is restricted.
  // For this test script, let's create an ADMIN user quickly or just use the prisma client to call the service logic? 
  // No, we want to test the Controller+Service integration. 
  // Let's use the admin endpoint.
  
  // Create Admin
  const adminEmail = `admin-${uniqueSuffix}@test.com`;
  await prisma.user.create({
      data: {
          email: adminEmail,
          passwordHash,
          role: 'PLATFORM_ADMIN',
          fullName: 'Admin Tester'
      }
  });
  
  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: adminEmail,
      password: 'password123'
  });
  const adminToken = adminLogin.data.access_token;

  await axios.post(
      `${API_URL}/platform/orders/${successfulOrder.id}/status`,
      { status: 'CANCELLED' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log(`   ✅ Order ${successfulOrder.orderNo} Cancelled`);

  // Check Stock Again
  const rolledBackSku = await prisma.sku.findUnique({ where: { id: sku.id } });
  console.log(`   🔍 Stock after Rollback: ${rolledBackSku?.stock}`);

  if (rolledBackSku?.stock === 1) {
      console.log('   ✅ ROLLBACK TEST PASSED: Stock restored to 1.');
  } else {
      console.error('   ❌ ROLLBACK TEST FAILED: Stock not restored.');
      process.exit(1);
  }

  console.log('🎉 ALL TESTS PASSED!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
