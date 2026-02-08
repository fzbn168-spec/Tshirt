import axios from 'axios';

const API_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@platform.com';
const ADMIN_PASS = 'admin123';

async function runTest() {
  console.log('🚀 Starting E2E Test Flow...');

  try {
    // 1. Register User
    const timestamp = Date.now();
    const userEmail = `testuser_${timestamp}@example.com`;
    const userPass = 'password123';
    
    console.log(`\n1. Registering user: ${userEmail}`);
    await axios.post(`${API_URL}/auth/register`, {
      email: userEmail,
      password: userPass,
      fullName: 'Test User',
      companyName: `Test Co ${timestamp}`,
      phone: '1234567890'
    });
    console.log('✅ User registered');

    // 2. Login User
    console.log('\n2. Logging in as User...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: userEmail,
      password: userPass
    });
    const userToken = loginRes.data.access_token;
    console.log('✅ User logged in');

    // 3. Create Inquiry
    console.log('\n3. Creating Inquiry...');
    // We need a SKU ID. Let's fetch products first or just use a dummy if we know one?
    // Let's search products.
    const productsRes = await axios.get(`${API_URL}/products`);
    // findAll returns array directly, not paginated object in this implementation
    const product = Array.isArray(productsRes.data) ? productsRes.data[0] : productsRes.data.data[0];
    
    if (!product) {
        console.log('Products response:', JSON.stringify(productsRes.data, null, 2));
        throw new Error('No products found to inquire about');
    }
    
    // Find a SKU
    const sku = product.skus[0]; // Assuming structure
    // If not included, we might need to fetch details. 
    // Actually the products list might not include SKUs depending on implementation.
    // Let's try to fetch product detail.
    const productDetailRes = await axios.get(`${API_URL}/products/${product.id}`);
    const targetSku = productDetailRes.data.skus[0];
    
    const inquiryRes = await axios.post(`${API_URL}/inquiries`, {
      contactName: 'Test User',
      contactEmail: userEmail,
      items: [
        {
          productId: product.id,
          productName: typeof product.title === 'string' && product.title.startsWith('{') ? JSON.parse(product.title).en : product.title,
          skuId: targetSku ? targetSku.id : undefined,
          quantity: 100,
          price: 40.0 // targetPrice
        }
      ],
      notes: 'I need a quote ASAP.'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const inquiryId = inquiryRes.data.id;
    console.log(`✅ Inquiry created: ${inquiryId}`);

    // 4. Login Admin
    console.log('\n4. Logging in as Admin...');
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASS
    });
    const adminToken = adminLoginRes.data.access_token;
    console.log('✅ Admin logged in');

    // 5. Admin Quotes Inquiry
    console.log('\n5. Admin Quoting Inquiry...');
    // We need to send the full item structure because the service replaces items.
    const originalItem = inquiryRes.data.items[0];
    
    await axios.patch(`${API_URL}/inquiries/${inquiryId}`, {
      status: 'QUOTED',
      items: [
          {
              productId: originalItem.productId,
              productName: originalItem.productName,
              skuId: originalItem.skuId,
              skuSpecs: originalItem.skuSpecs,
              quantity: originalItem.quantity,
              price: Number(originalItem.targetPrice), // DB has targetPrice (string/decimal), DTO expects number
              quotedPrice: 42.50
          }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Inquiry Quoted by Admin');

    // 6. User Checks Notifications
    console.log('\n6. User Checking Notifications...');
    // Poll a bit? It should be instant.
    const notifRes = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const notifications = notifRes.data;
    console.log(`Found ${notifications.length} notifications.`);
    
    const inquiryNotif = notifications.find((n: any) => n.referenceId === inquiryId && n.type === 'INQUIRY');
    
    if (inquiryNotif) {
        console.log('✅ SUCCESS: Found notification for quoted inquiry!');
        console.log(`   Title: ${inquiryNotif.title}`);
        console.log(`   Content: ${inquiryNotif.content}`);
    } else {
        console.error('❌ FAILURE: Notification not found.');
        console.log(JSON.stringify(notifications, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Test Failed:', error.response ? JSON.stringify(error.response.data) : error.message);
    if (error.code === 'ECONNREFUSED') {
        console.error('Make sure the backend server is running on port 3001!');
    }
  }
}

runTest();
