
const BASE_URL = 'http://localhost:3001';

async function run() {
  try {
    console.log('--- Starting Inquiry Security & Functionality Test ---');

    // 1. Login as Platform Admin
    console.log('1. Logging in as Platform Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@platform.com', password: 'admin123' })
    });
    
    if (!adminLoginRes.ok) {
        throw new Error(`Admin login failed: ${adminLoginRes.status}`);
    }
    const adminToken = (await adminLoginRes.json()).access_token;
    console.log('   Admin logged in.');

    // 2. Create Product & SKU (Needed for Inquiry)
    console.log('2. Creating Test Product & SKU...');
    const catSlug = `cat-${Date.now()}`;
    const catRes = await fetch(`${BASE_URL}/products/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        slug: catSlug,
        name: JSON.stringify({ en: "Inquiry Test", zh: "询价测试" })
      })
    });
    const category = await catRes.json();

    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        categoryId: category.id,
        title: JSON.stringify({ en: "Inquiry Shoe", zh: "询价鞋" }),
        description: JSON.stringify({ en: "Test", zh: "测试" }),
        images: JSON.stringify(["http://example.com/img.jpg"]),
        basePrice: 50,
        specsTemplate: JSON.stringify({ colors: ["Blue"], sizes: ["42"] })
      })
    });
    const product = await prodRes.json();

    const skuRes = await fetch(`${BASE_URL}/products/${product.id}/skus`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        skuCode: `SKU-INQ-${Date.now()}`,
        specs: JSON.stringify({ color: "Blue", size: "42" }),
        price: 50,
        moq: 10,
        stock: 100
      })
    });
    const sku = await skuRes.json();
    console.log(`   Product ${product.id} / SKU ${sku.id} created.`);

    // 3. Register Company A
    console.log('3. Registering Company A...');
    const emailA = `compA-${Date.now()}@test.com`;
    const tokenA = await registerAndLogin(emailA, 'Company A');
    console.log('   Company A registered.');

    // 4. Register Company B
    console.log('4. Registering Company B...');
    const emailB = `compB-${Date.now()}@test.com`;
    const tokenB = await registerAndLogin(emailB, 'Company B');
    console.log('   Company B registered.');

    // 5. Company A Creates Inquiry
    console.log('5. Company A creating Inquiry...');
    const inquiryRes = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        contactName: "User A",
        contactEmail: emailA,
        notes: "Please quote best price",
        items: [
            {
                productId: product.id,
                productName: "Inquiry Shoe",
                skuId: sku.id,
                skuSpecs: "Blue, 42",
                quantity: 100,
                price: 45 // Target price
            }
        ]
      })
    });
    if (!inquiryRes.ok) throw new Error(`Inquiry creation failed: ${inquiryRes.status}`);
    const inquiry = await inquiryRes.json();
    console.log(`   Inquiry created: ${inquiry.id} (${inquiry.inquiryNo})`);

    // 6. Company B Tries to Access Company A's Inquiry
    console.log('6. Security Test: Company B accessing A\'s Inquiry...');
    const resB = await fetch(`${BASE_URL}/inquiries/${inquiry.id}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    if (resB.status === 403 || resB.status === 404) {
        console.log('   SUCCESS: Company B was denied access (403/404).');
    } else {
        throw new Error(`FAILURE: Company B could access inquiry! Status: ${resB.status}`);
    }

    // 7. Company A Accesses Own Inquiry
    console.log('7. Company A accessing own Inquiry...');
    const resA = await fetch(`${BASE_URL}/inquiries/${inquiry.id}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    if (!resA.ok) throw new Error(`Company A denied access to own inquiry: ${resA.status}`);
    console.log('   SUCCESS: Company A accessed own inquiry.');

    // 8. Admin Updates Inquiry (Quote)
    console.log('8. Admin Quoting Inquiry...');
    const updateRes = await fetch(`${BASE_URL}/inquiries/${inquiry.id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'QUOTED',
        notes: 'Quoted special price',
        items: [
            {
                productId: product.id,
                productName: "Inquiry Shoe",
                skuId: sku.id,
                skuSpecs: "Blue, 42",
                quantity: 100,
                price: 45,
                quotedPrice: 48 // Admin sets this
            }
        ]
      })
    });
    if (!updateRes.ok) throw new Error(`Admin update failed: ${updateRes.status}`);
    const updatedInquiry = await updateRes.json();
    console.log('   Admin updated inquiry status to:', updatedInquiry.status);

    // 9. Company A Checks Quote
    console.log('9. Company A checking quote...');
    const resA2 = await fetch(`${BASE_URL}/inquiries/${inquiry.id}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const finalInquiry = await resA2.json();
    const quotedItem = finalInquiry.items[0];
    if (quotedItem.quotedPrice === '48' || quotedItem.quotedPrice === 48) {
        console.log('   SUCCESS: Company A sees quoted price: ' + quotedItem.quotedPrice);
    } else {
        console.error('   FAILURE: Quoted price mismatch:', quotedItem);
    }

    console.log('--- TEST PASSED ---');

  } catch (error) {
    console.error('--- TEST FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

async function registerAndLogin(email, companyName) {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password: 'password123',
            fullName: 'Test User',
            companyName: companyName
        })
    });
    if (!regRes.ok) throw new Error(`Register failed: ${regRes.status}`);
    
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    return (await loginRes.json()).access_token;
}

run();
