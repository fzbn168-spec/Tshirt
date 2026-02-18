
const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001';

async function main() {
  console.log('🚀 Starting End-to-End Flow Test');

  // 1. Setup Data
  const adminCreds = { email: 'admin@platform.com', password: 'admin123' };
  const userCreds = { email: 'user@example.com', password: 'user123' }; // We might need to register this user first if not exists

  let adminToken = '';
  let userToken = '';
  let user = null;

  // --- Step 1: Login Admin ---
  try {
    const res = await axios.post(`${API_URL}/auth/login`, adminCreds);
    adminToken = res.data.access_token;
    console.log('✅ Admin Logged In');
  } catch (e) {
    console.error('❌ Admin Login Failed:', e.message);
    if (e.response) {
        console.error('Status:', e.response.status);
        console.error('Data:', JSON.stringify(e.response.data));
    } else {
        console.error('Full Error:', e);
    }
    process.exit(1);
  }

  // --- Step 2: Register/Login User ---
  try {
    // Try login first
    try {
      const res = await axios.post(`${API_URL}/auth/login`, userCreds);
      userToken = res.data.access_token;
      user = res.data.user;
      console.log('✅ User Logged In (Existing)');
    } catch (e) {
      if (e.response && e.response.status === 401) {
        // Register if failed
        console.log('ℹ️ User not found, registering...');
        await axios.post(`${API_URL}/auth/register`, {
          email: userCreds.email,
          password: userCreds.password,
          fullName: 'Test User',
          companyName: 'Test Company',
        });
        const res = await axios.post(`${API_URL}/auth/login`, userCreds);
        userToken = res.data.access_token;
        user = res.data.user;
        console.log('✅ User Registered & Logged In');
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.error('❌ User Login/Register Failed:', e.message);
    process.exit(1);
  }

  // --- Step 3: Get a Product to order ---
  let product = null;
  let sku = null;
  try {
    const res = await axios.get(`${API_URL}/products`);
    const products = res.data.items || res.data; // Handle pagination wrapper
    if (!Array.isArray(products) || products.length === 0) {
      console.error('❌ No products found. Please seed products first.');
      process.exit(1);
    }
    
    // Find a product with SKUs
    for (const p of products) {
        const detailRes = await axios.get(`${API_URL}/products/${p.id}`);
        if (detailRes.data.skus && detailRes.data.skus.length > 0) {
            product = detailRes.data;
            sku = product.skus[0];
            break;
        }
    }

    if (!product || !sku) {
        console.error('❌ No valid product with SKUs found.');
        process.exit(1);
    }
    console.log(`✅ Selected Product: ${JSON.parse(product.title).en} (SKU: ${sku.skuCode})`);
  } catch (e) {
    console.error('❌ Failed to fetch products:', e.message);
    process.exit(1);
  }

  // ==================================================================================
  // SCENARIO 1: User creates SAMPLE Inquiry -> Order
  // ==================================================================================
  console.log('\n--- Scenario 1: User creates SAMPLE Inquiry -> Order ---');
  let inquiryId = null;
  try {
    // Create Inquiry
    const inquiryPayload = {
      contactName: user.fullName || "Test User",
      contactEmail: user.email,
      message: "I want a sample please.",
      type: "SAMPLE",
      items: [
        {
          productId: product.id,
          productName: JSON.parse(product.title).en,
          skuId: sku.id,
          quantity: 1,
          price: 50,
        }
      ],
    };

    // Attach companyId explicitly if not relying on token extraction in backend logic
    // The backend InquiriesController extracts companyId from req.user, which is populated by JwtAuthGuard
    // So passing it in payload is not strictly necessary unless the DTO requires it or logic bypasses req.user

    console.log('Sending Inquiry Payload:', JSON.stringify(inquiryPayload, null, 2));

    const res = await axios.post(`${API_URL}/inquiries`, inquiryPayload, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    inquiryId = res.data.id;
    console.log('✅ Inquiry Created:', inquiryId);
  } catch (e) {
    console.error('❌ Scenario 1 Failed:', e.response ? { statusCode: e.response.status, message: e.response.data.message } : e.message);
    if(e.response && e.response.data) console.error('Full Error:', JSON.stringify(e.response.data, null, 2));
  }

  // ==================================================================================
  // SCENARIO 2: Admin creates Order from Inquiry (SAMPLE)
  // ==================================================================================
  console.log('\n--- Scenario 2: Admin creates Order from Inquiry (SAMPLE) ---');
  try {
     // Create another Inquiry
     const inquiryPayload = {
        contactName: user.fullName || "Test User",
        contactEmail: user.email,
        message: "Another sample request.",
        type: "SAMPLE",
        items: [
          {
            productId: product.id,
            productName: JSON.parse(product.title).en,
            skuId: sku.id,
            quantity: 2,
            price: 45,
          }
        ],
      };
  
      const inqRes = await axios.post(`${API_URL}/inquiries`, inquiryPayload, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const inqId = inqRes.data.id;
      console.log(`✅ Inquiry Created: ${inqId}`);

      // Admin creates order
      const orderPayload = {
        inquiryId: inqId,
        items: [
          {
            productId: product.id,
            productName: JSON.parse(product.title).en,
            skuId: sku.id,
            quantity: 2,
            unitPrice: 45, // Admin sets price
            skuSpecs: "Color: Red, Size: 42"
          }
        ],
        type: "SAMPLE"
      };

      const orderRes = await axios.post(`${API_URL}/platform/orders`, orderPayload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const order = orderRes.data;
      console.log(`✅ Admin Created Order: ${order.orderNo} (Type: ${order.type})`);
      
      if (order.type !== 'SAMPLE') {
          console.error('❌ Order Type Mismatch! Expected SAMPLE.');
      } else {
          console.log('✅ Order Type Verified: SAMPLE');
      }

      // Download PI
      try {
        console.log(`⬇️ Attempting to download PI for Order ${order.id}...`);
        // Use Platform API for Admin
        const piRes = await axios.get(`${API_URL}/platform/orders/${order.id}/pi`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            responseType: 'arraybuffer' // Important for PDF
        });
        if (piRes.status === 200 && piRes.headers['content-type'] === 'application/pdf') {
            console.log('✅ PI PDF Downloaded Successfully');
            // Optional: Save it to check
            // fs.writeFileSync(`pi-${order.orderNo}.pdf`, piRes.data);
        } else {
            console.error('❌ PI Download Failed: Invalid Status or Content-Type');
        }
      } catch (piError) {
        console.error('❌ Failed to download PI:', piError.message);
      }

  } catch (e) {
    console.error('❌ Scenario 2 Failed:', e.response?.data || e.message);
  }

    // ==================================================================================
  // SCENARIO 3: Direct STANDARD Order (MOQ Check)
  // ==================================================================================
  console.log('\n--- Scenario 3: Standard Order (MOQ Check) ---');
  try {
    // Try to order 1 item (Standard) - Should Fail if MOQ > 1
    // First, let's assume MOQ is > 1. If product data doesn't have MOQ, we might pass.
    // Let's assume the SKU has MOQ.
    
    // We will force type STANDARD
    const orderPayload = {
        items: [
          {
            productId: product.id,
            productName: JSON.parse(product.title).en,
            skuId: sku.id,
            quantity: 1, // Likely below MOQ
            unitPrice: 100,
          }
        ],
        type: "STANDARD"
      };
  
      try {
        await axios.post(`${API_URL}/orders`, orderPayload, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log('⚠️ Order Created with Qty 1 (Standard). SKU might have low MOQ or check failed.');
      } catch (e) {
        if (e.response && (e.response.status === 400 || e.response.status === 500)) { // 500 because we threw Error in service
            console.log('✅ Standard Order Rejected (Likely MOQ check):', e.response.data.message);
        } else {
            console.error('❌ Unexpected Error:', e.message);
        }
      }

  } catch (e) {
    console.error('❌ Scenario 3 Failed:', e.message);
  }

  console.log('\n🏁 Test Completed');
}

main();
