async function tryLogin(username, password) {
  const url = 'https://kasir.horn-yastudio.com/api';
  console.log(`Trying login for ${username} with password: ${password}...`);
  try {
    const res = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        requiredRole: 'admin_kasir'
      })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log(`✅ SUCCESS login as ${username} with password: ${password}!`);
      console.log('Token:', data.token || data.data?.token);
      return data.token || data.data?.token;
    } else {
      console.log(`❌ FAILED login: Status ${res.status}, Message: ${data.message}`);
      return null;
    }
  } catch (err) {
    console.error(`Error during login: ${err.message}`);
    return null;
  }
}

async function run() {
  // Try admin / 123456
  let token = await tryLogin('admin', '123456');
  if (!token) {
    // Try admin / password123
    token = await tryLogin('admin', 'password123');
  }
  if (!token) {
    // Try other usernames
    token = await tryLogin('kasir', 'password123');
    if (!token) {
      token = await tryLogin('kasir', '123456');
    }
  }

  if (token) {
    const url = 'https://kasir.horn-yastudio.com/api';
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
  }
}

run();
