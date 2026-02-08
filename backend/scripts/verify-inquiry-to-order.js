const axios = require('axios');

const API_URL = 'http://localhost:3001';
let userToken = '';
let adminToken = '';
let inquiryId = '';
let productId = '';
let skuId = '';

async function login(email, password) {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    return res.data.access_token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function register(email, password, role = 'MEMBER') {
  try {
    // 1. Register
    await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      fullName: 'Test User',
      companyName: 'Test Company ' + Date.now(),
    });
    console.log(`Registered ${email}`);
    // 2. Login
    return await login(email, password);
  } catch (error) {
    // If already exists, try login
    if (error.response?.status === 409) {
        console.log('User exists, logging in...');
        return await login(email, password);
    }
    console.error('Register failed:', error.response?.data || error.message);
    throw error;
  }
}

async function run() {
  try {
    console.log('--- Starting Inquiry-to-Order Flow Verification ---');

    // 1. Setup Users
    console.log('\n1. Setting up users...');
    userToken = await register(`user${Date.now()}@test.com`, 'password123');
    // Assuming admin exists or we can create one. 
    // For this test, let's assume we can use the user as admin if we update role manually?
    // Or simpler: We just use the platform admin created in previous scripts if available.
    // Let's try to login as 'admin@example.com' (from seed or previous tests)
    // If not, we might fail. Let's register a new admin-like user but we can't set role easily via API.
    // Actually, for 'Quote' operation, we need ADMIN or PLATFORM_ADMIN.
    // Let's try to login as 'boss@example.com' (Platform Admin) from verify-order-flow.js
    try {
        adminToken = await login('boss@example.com', 'password123');
        console.log('Logged in as Platform Admin (boss)');
    } catch (e) {
        console.warn('Could not login as boss, skipping admin steps? No, we need to quote.');
        process.exit(1);
    }

    // 2. Get a Product to inquire about
    console.log('\n2. Getting products...');
    const productsRes = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const products = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.data;
    
    if (!products || products.length === 0) {
        console.error('No products found. Run seed or create product first.');
        process.exit(1);
    }
    const product = products[0];
    productId = product.id;
    // Assume first sku
    // We need to fetch details to get SKUs
    const prodDetail = await axios.get(`${API_URL}/products/${productId}`, {
         headers: { Authorization: `Bearer ${userToken}` }
    });
    if (prodDetail.data.skus && prodDetail.data.skus.length > 0) {
        skuId = prodDetail.data.skus[0].id;
    }
    console.log(`Selected Product: ${product.title.en || product.title} (${productId})`);

    // 3. Create Inquiry
    console.log('\n3. Creating Inquiry...');
    const inquiryRes = await axios.post(`${API_URL}/inquiries`, {
        contactName: 'John Doe',
        contactEmail: 'john@test.com',
        items: [{
            productId: productId,
            skuId: skuId,
            productName: product.title.en || product.title, // Added productName
            quantity: 100,
            price: 50
        }]
    }, { headers: { Authorization: `Bearer ${userToken}` } });
    inquiryId = inquiryRes.data.id;
    console.log(`Inquiry Created: ${inquiryRes.data.inquiryNo} (${inquiryId})`);

    // 4. Admin Quotes the Inquiry
    console.log('\n4. Admin Quoting Inquiry...');
    await axios.patch(`${API_URL}/inquiries/${inquiryId}`, {
        status: 'QUOTED',
        items: [{
            productId: productId,
            skuId: skuId, // We must provide all fields required by backend update logic if it replaces items
            productName: prodDetail.data.title.en || 'Product',
            quantity: 100,
            price: 50,
            quotedPrice: 45 // Discounted price
        }]
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('Inquiry Quoted successfully.');

    // 5. User places Order from Inquiry
    console.log('\n5. User Placing Order...');
    // Fetch inquiry to get details first (like frontend does)
    const inquiryDetail = await axios.get(`${API_URL}/inquiries/${inquiryId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const itemsToOrder = inquiryDetail.data.items.map(item => ({
        productId: item.productId,
        skuId: item.skuId,
        productName: item.productName,
        skuSpecs: item.skuSpecs,
        quantity: item.quantity,
        unitPrice: Number(item.quotedPrice) // Use quoted price
    }));

    const orderRes = await axios.post(`${API_URL}/orders`, {
        inquiryId: inquiryId,
        items: itemsToOrder
    }, { headers: { Authorization: `Bearer ${userToken}` } });
    
    console.log(`Order Created: ${orderRes.data.orderNo}`);
    console.log(`Order Status: ${orderRes.data.status}`);

    // 6. Verify Inquiry Status Updated
    console.log('\n6. Verifying Inquiry Status...');
    const inquiryFinal = await axios.get(`${API_URL}/inquiries/${inquiryId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    if (inquiryFinal.data.status === 'ORDERED') {
        console.log('SUCCESS: Inquiry status updated to ORDERED.');
    } else {
        console.error(`FAILURE: Inquiry status is ${inquiryFinal.data.status}`);
    }

    // 7. Test Payment (Optional)
    console.log('\n7. Testing Payment...');
    const paymentRes = await axios.post(`${API_URL}/payments`, {
        orderId: orderRes.data.id,
        amount: orderRes.data.totalAmount,
        method: 'BANK_TRANSFER'
    }, { headers: { Authorization: `Bearer ${userToken}` } });
    console.log('Payment created:', paymentRes.data.status);

    // Verify Order Status became PROCESSING
    const orderFinal = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const myOrder = orderFinal.data.find(o => o.id === orderRes.data.id);
    if (myOrder.status === 'PROCESSING') {
        console.log('SUCCESS: Order status updated to PROCESSING.');
    } else {
        console.error(`FAILURE: Order status is ${myOrder.status}`);
    }

    console.log('\n--- Verification Completed Successfully ---');

  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
  }
}

run();
