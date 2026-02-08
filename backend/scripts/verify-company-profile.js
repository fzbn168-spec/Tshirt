const BASE_URL = 'http://localhost:3001';

async function run() {
  try {
    console.log('--- Starting Company Profile Test ---');

    // 1. Register & Login as Company Admin
    const timestamp = Date.now();
    const email = `boss-profile-${timestamp}@test.com`;
    const password = 'password123';
    
    console.log('1. Registering Company Admin...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        fullName: 'Profile Tester',
        companyName: `Profile Test Company ${timestamp}`
      })
    });
    
    if (!registerRes.ok) throw new Error(`Registration failed: ${await registerRes.text()}`);
    console.log('   Registered.');

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!loginRes.ok) throw new Error('Login failed');
    const token = (await loginRes.json()).access_token;
    console.log('   Logged in.');

    // 2. GET Profile
    console.log('2. Getting Profile...');
    const getRes = await fetch(`${BASE_URL}/companies/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!getRes.ok) throw new Error(`Get profile failed: ${await getRes.text()}`);
    const profile = await getRes.json();
    console.log('   Profile retrieved:', profile.name);

    // 3. PATCH Profile
    console.log('3. Updating Profile...');
    const updateData = {
      address: '123 Test St',
      phone: '555-1234',
      website: 'https://test.com',
      logo: 'https://test.com/logo.png',
      documents: JSON.stringify([{ name: 'License', url: 'https://doc.com/1.pdf' }])
    };

    const patchRes = await fetch(`${BASE_URL}/companies/profile`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(updateData)
    });
    
    if (!patchRes.ok) throw new Error(`Update profile failed: ${await patchRes.text()}`);
    const updatedProfile = await patchRes.json();
    console.log('   Profile updated.');

    // 4. Verify
    if (updatedProfile.logo === updateData.logo && updatedProfile.address === updateData.address) {
        console.log('--- TEST PASSED: Company Profile Verified ---');
    } else {
        console.log('--- TEST FAILED: Data mismatch ---');
        console.log('Expected:', updateData);
        console.log('Got:', updatedProfile);
    }

  } catch (err) {
    console.error('--- TEST FAILED ---');
    console.error(err);
  }
}

run();
