
const http = require('http');

function check(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${name} is UP. Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (e) => {
      console.log(`❌ ${name} is DOWN. Error: ${e.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('Verifying services...');
  
  // Backend (expect 401 or 200, not connection refused)
  await check('http://localhost:3001/notifications', 'Backend (Notifications)');
  
  // Admin Panel
  await check('http://localhost:3000', 'Admin Panel');
  
  // Frontend
  await check('http://localhost:3002', 'Frontend Storefront');
}

main();
