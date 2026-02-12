#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    console.log('🧪 Testing Loan Creation Flow\n');

    // Step 1: Login
    console.log('1️⃣  Logging in...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'borrower@test.com',
      password: 'test123456'
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }

    console.log('✓ Login successful');
    console.log(`  Role: ${loginRes.data.user.role}`);
    console.log(`  Token: ${loginRes.data.token.substring(0, 30)}...`);

    const token = loginRes.data.token;

    // Step 2: Get equipment list
    console.log('\n2️⃣  Fetching equipment...');
    const equipmentRes = await makeRequest('GET', '/api/equipment', null);
    console.log(`  Status: ${equipmentRes.status}`);

    // Step 3: Create a loan (assuming equipment ID exists, otherwise use ID 1)
    console.log('\n3️⃣  Creating loan...');
    const loanBody = {
      borrower_id: loginRes.data.user.id,
      equipment_id: 1,
      quantity: 1,
      loan_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/loans',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const loanRes = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });
      req.on('error', reject);
      req.write(JSON.stringify(loanBody));
      req.end();
    });

    console.log(`  Status: ${loanRes.status}`);
    if (loanRes.status === 201 || loanRes.status === 200) {
      console.log('✅ Loan created successfully!');
      console.log(`  Loan: ${JSON.stringify(loanRes.data, null, 2)}`);
    } else {
      console.log('❌ Loan creation failed');
      console.log(`  Response: ${JSON.stringify(loanRes.data, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
