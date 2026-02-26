
const http = require('http');

function checkApi() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/products',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const parsed = JSON.parse(data);
          console.log('Products count:', parsed.items ? parsed.items.length : 'N/A');
          console.log('API Status: OK');
        } catch (e) {
          console.log('Parse Error:', e.message);
        }
      } else {
        console.log('Error Data:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Network Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Hint: The backend server is not running on port 3001.');
    }
  });

  req.end();
}

checkApi();
