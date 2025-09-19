#!/usr/bin/env node

/**
 * Test script for the DevKit Backend Core API
 */

async function testAPI() {
  const baseURL = 'http://localhost:3001';

  console.log('🧪 Testing DevKit Backend Core API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${baseURL}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health:', JSON.stringify(healthData, null, 2));

    // Test public status endpoint
    console.log('\n2. Testing public status endpoint...');
    const statusRes = await fetch(`${baseURL}/api/status`);
    const statusData = await statusRes.json();
    console.log('✅ Status:', JSON.stringify(statusData, null, 2));

    // Test authenticated endpoint (should fail without auth)
    console.log('\n3. Testing authenticated endpoint (should fail)...');
    const devkitRes = await fetch(`${baseURL}/api/devkit/status`);
    const devkitData = await devkitRes.json();
    console.log(
      `❌ Expected auth error (${devkitRes.status}):`,
      JSON.stringify(devkitData, null, 2)
    );

    // Test with admin wallet auth
    console.log('\n4. Testing with admin wallet auth...');
    const adminAddress = '0xa0e8942da50fc2d157770c3320343f0eb91e5dfe'; // From backend logs
    const authedRes = await fetch(`${baseURL}/api/devkit/status`, {
      headers: {
        Authorization: `Bearer wallet:${adminAddress}`,
      },
    });
    const authedData = await authedRes.json();
    console.log('✅ Authenticated:', JSON.stringify(authedData, null, 2));

    // Test account info
    console.log('\n5. Testing account info...');
    const accountRes = await fetch(`${baseURL}/api/devkit/accounts/0`, {
      headers: {
        Authorization: `Bearer wallet:${adminAddress}`,
      },
    });
    const accountData = await accountRes.json();
    console.log('✅ Account 0:', JSON.stringify(accountData, null, 2));

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPI();
