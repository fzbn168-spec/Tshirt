
// const axios = require('axios'); 
// Removed axios dependency to use native fetch (Node 18+)


const BASE_URL = 'http://localhost:3001';

async function run() {
  try {
    console.log('--- Starting Order Flow Test ---');

    // 1. Login as Platform Admin
    console.log('1. Logging in as Platform Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@platform.com', password: 'admin123' })
    });
    
    if (!adminLoginRes.ok) {
        const txt = await adminLoginRes.text();
        throw new Error(`Admin login failed: ${adminLoginRes.status} ${txt}`);
    }
    const adminToken = (await adminLoginRes.json()).access_token;
    console.log('   Admin logged in.');

    // 2. Create Product & SKU (if needed)
    // First check if we have categories
    // For simplicity, let's just try to create a product. If category fails, we create category.
    // Actually, let's just assume there is a product or create one properly.
    // Let's create a category first to be safe.
    console.log('2. Creating Category...');
    const catSlug = `cat-${Date.now()}`;
    const catRes = await fetch(`${BASE_URL}/products/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        slug: catSlug,
        name: JSON.stringify({ en: "Test Category", zh: "测试分类" })
      })
    });
    // If 409 conflict (slug exists), we might ignore, but unique slug ensures success.
    if (!catRes.ok) console.log('   Category creation note:', catRes.statusText);
    const category = await catRes.json();
    console.log('   Category created/found:', category.id);

    // Create Product
    console.log('3. Creating Product...');
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        categoryId: category.id,
        title: JSON.stringify({ en: "Test Shoe", zh: "测试鞋" }),
        description: JSON.stringify({ en: "Best shoe", zh: "好鞋" }),
        images: JSON.stringify(["http://example.com/img.jpg"]),
        basePrice: 100,
        specsTemplate: JSON.stringify({ colors: ["Red"], sizes: ["40"] })
      })
    });
    if (!prodRes.ok) {
       const err = await prodRes.text();
       throw new Error(`Product creation failed: ${err}`);
    }
    const product = await prodRes.json();
    console.log('   Product created:', product.id);

    // Create SKU
    console.log('4. Creating SKU...');
    const skuCode = `SKU-${Date.now()}`;
    const skuRes = await fetch(`${BASE_URL}/products/${product.id}/skus`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        skuCode: skuCode,
        specs: JSON.stringify({ color: "Red", size: "40" }),
        price: 100,
        moq: 10,
        stock: 1000
      })
    });
    if (!skuRes.ok) throw new Error('SKU creation failed');
    const sku = await skuRes.json();
    console.log('   SKU created:', sku.id);


    // 3. Register & Login as Company User (Boss)
    console.log('5. Registering Company Admin (Boss)...');
    const timestamp = Date.now();
    const bossEmail = `boss-${timestamp}@test.com`;
    const bossPassword = 'password123';
    
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: bossEmail,
        password: bossPassword,
        fullName: 'Boss User',
        companyName: `Test Company ${timestamp}`
      })
    });
    
    if (!registerRes.ok) {
         const txt = await registerRes.text();
         throw new Error(`Boss registration failed: ${txt}`);
    }
    const registerData = await registerRes.json();
    console.log('   Boss registered:', registerData.user.email);

    // Login (optional since register might return token? No, auth service returns user/company)
    // Let's login to get token.
    const bossLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bossEmail, password: bossPassword })
    });
    
    if (!bossLoginRes.ok) throw new Error('Boss login failed');
    const bossToken = (await bossLoginRes.json()).access_token;
    console.log('   Boss logged in.');

    // 4. Create Order
    console.log('6. Creating Order...');
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bossToken}`
      },
      body: JSON.stringify({
        items: [
          {
            productId: product.id,
            skuId: sku.id,
            productName: "Test Shoe (Red/40)",
            skuSpecs: JSON.stringify({ color: "Red", size: "40" }),
            quantity: 50,
            unitPrice: 90 // Discounted price
          }
        ]
      })
    });
    
    if (!orderRes.ok) {
        const txt = await orderRes.text();
        throw new Error(`Order creation failed: ${txt}`);
    }
    const order = await orderRes.json();
    console.log('   Order created:', order.orderNo, 'Status:', order.status);


    // 5. Admin Updates Status
    console.log('7. Admin Updating Status...');
    const updateRes = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'SHIPPED' })
    });
    
    if (!updateRes.ok) throw new Error('Update status failed');
    const updatedOrder = await updateRes.json();
    console.log('   Order status updated to:', updatedOrder.status);

    if (updatedOrder.status === 'SHIPPED') {
        console.log('--- TEST PASSED: Order Flow Verified ---');
    } else {
        console.log('--- TEST FAILED: Status mismatch ---');
    }

  } catch (err) {
    console.error('--- TEST FAILED ---');
    console.error(err);
  }
}

run();
