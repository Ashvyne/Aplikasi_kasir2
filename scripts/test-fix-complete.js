#!/usr/bin/env node

const http = require('http');

function makeRequest(method, path, data = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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
    console.log('🎯 TESTING LOAN CREATION FIX\n');
    console.log('═'.repeat(50));

    // Step 1: Login
    console.log('\n1️⃣  LOGIN TEST');
    console.log('─'.repeat(50));
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'borrower@test.com',
      password: 'test123456'
    });

    if (loginRes.status === 200 && loginRes.data.success) {
      console.log('✅ Login successful');
      console.log(`   User: ${loginRes.data.user.name}`);
      console.log(`   Role: ${loginRes.data.user.role}`);
      console.log(`   Token: ${loginRes.data.token.substring(0, 20)}...`);
    } else {
      throw new Error(`Login failed: ${loginRes.status} - ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.token;
    const borrowerId = loginRes.data.user.id;

    // Step 2: Create a loan
    console.log('\n2️⃣  CREATE LOAN TEST');
    console.log('─'.repeat(50));
    
    const today = new Date();
    const dueDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const loanBody = {
      borrower_id: borrowerId,
      equipment_id: 1,
      quantity: 1,
      loan_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0]
    };

    const loanRes = await makeRequest('POST', '/api/loans', loanBody, token);

    console.log(`Response Status: ${loanRes.status}`);
    
    if (loanRes.status === 201 || loanRes.status === 200) {
      console.log('✅ Loan creation successful!');
      console.log(`   Loan Details: ${JSON.stringify(loanRes.data, null, 2)}`);
    } else if (loanRes.status === 404) {
      console.log('❌ Loan endpoint not found (404)');
      console.log(`   This was the original error!`);
    } else if (loanRes.status === 401) {
      console.log('❌ Unauthorized (401)');
      console.log(`   Token issue: ${JSON.stringify(loanRes.data)}`);
    } else if (loanRes.status === 403) {
      console.log('❌ Forbidden (403)');
      console.log(`   Permission issue: ${JSON.stringify(loanRes.data)}`);
    } else {
      console.log('❌ Loan creation failed');
      console.log(`   Response: ${JSON.stringify(loanRes.data)}`);
    }

    console.log('\n═'.repeat(50));
    console.log('✅ TEST COMPLETE\n');

    if (loanRes.status === 201 || loanRes.status === 200) {
      console.log('🎉 All tests passed! Pinjaman sekarang feature is working!');
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
