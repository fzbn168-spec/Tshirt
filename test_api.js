
const axios = require('axios');

async function checkApi() {
  try {
    const res = await axios.get('http://localhost:3001/products');
    console.log('API Status: OK');
    console.log('Products count:', res.data.items.length);
  } catch (error) {
    if (error.response) {
      console.log('API Error Status:', error.response.status);
      console.log('API Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

checkApi();
