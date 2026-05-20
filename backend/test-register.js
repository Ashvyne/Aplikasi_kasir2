async function run() {
  const url = 'https://kasir.horn-yastudio.com/api';
  const username = 'dev_test_admin_' + Math.random().toString(36).substring(7);
  const email = username + '@test.com';
  const password = 'password123';

  console.log(`Attempting to register a new admin user on remote server: ${username}...`);

  try {
    const regRes = await fetch(`${url}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        password,
        role: 'admin',
        name: 'Test Dev Admin'
      })
    });

    const regData = await regRes.json();
    console.log('Registration status:', regRes.status);
    console.log('Registration response:', JSON.stringify(regData));

    if (regRes.status !== 201) {
      console.log('Failed to register.');
      return;
    }

    console.log('\nLogging in with the newly registered user...');
    const loginRes = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    console.log('Login response:', JSON.stringify(loginData));

    const token = loginData.token || loginData.data?.token;
    if (!token) {
      console.log('Could not get token.');
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('\n--- Fetching /api/analytics/summary ---');
    const summaryRes = await fetch(`${url}/analytics/summary`, { headers });
    const summaryData = await summaryRes.json();
    console.log('Analytics summary status:', summaryRes.status);
    console.log('Analytics summary response:', JSON.stringify(summaryData, null, 2));

    console.log('\n--- Fetching /api/products ---');
    const productsRes = await fetch(`${url}/products`, { headers });
    const productsData = await productsRes.json();
    console.log('Products response status:', productsRes.status);
    console.log('Products count:', Array.isArray(productsData) ? productsData.length : (productsData.data ? productsData.data.length : 'Not array'));
    console.log('Products sample:', JSON.stringify(productsData).substring(0, 500));

    console.log('\n--- Fetching /api/tables ---');
    const tablesRes = await fetch(`${url}/tables`, { headers });
    const tablesData = await tablesRes.json();
    console.log('Tables response status:', tablesRes.status);
    console.log('Tables count:', Array.isArray(tablesData) ? tablesData.length : (tablesData.data ? tablesData.data.length : 'Not array'));
    console.log('Tables sample:', JSON.stringify(tablesData).substring(0, 500));

  } catch (error) {
    console.error('Execution error:', error.message);
  }
}

run();
