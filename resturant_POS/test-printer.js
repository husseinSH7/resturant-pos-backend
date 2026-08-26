// Test script for printer functionality
const http = require('http');

const API_BASE = 'http://localhost:4000/api/v1';

// Login to get token
async function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ pin: '2222' });
    
    const req = http.request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response.accessToken);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Get devices
async function getDevices(token) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${API_BASE}/devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Test print
async function testPrint(token, printerId) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${API_BASE}/devices/${printerId}/test-print`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Print receipt
async function printReceipt(token, printerId, content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ content });
    
    const req = http.request(`${API_BASE}/devices/${printerId}/print`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful');

    console.log('\n📱 Getting devices...');
    const devices = await getDevices(token);
    console.log('✅ Devices:', JSON.stringify(devices, null, 2));

    const printer = devices.find(d => d.type === 'PRINTER');
    if (!printer) {
      console.error('❌ No printer found');
      return;
    }

    console.log(`\n🖨️  Found printer: ${printer.name} (${printer.id})`);

    console.log('\n🧪 Testing print...');
    const testResult = await testPrint(token, printer.id);
    console.log('✅ Test print result:', testResult);

    console.log('\n📄 Printing receipt...');
    const receiptContent = `
================================
        TEST RECEIPT
================================
Order #1234
Table: 5
Date: ${new Date().toLocaleString()}
================================
1x Classic Burger      $18.00
1x Fries                $3.00
1x Cola                 $2.00
================================
Subtotal:              $23.00
Tax:                    $2.53
Total:                 $25.53
================================
Payment: CASH
Tendered:              $30.00
Change:                 $4.47
================================
Thank you!
================================
`;
    const printResult = await printReceipt(token, printer.id, receiptContent);
    console.log('✅ Receipt print result:', printResult);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
