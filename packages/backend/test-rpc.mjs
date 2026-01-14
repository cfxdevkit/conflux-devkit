#!/usr/bin/env node
/*
 * Test RPC calls to verify backend functionality
 */

async function testRPC() {
  console.log('Testing RPC calls to local node...\n');

  const coreUrl = 'http://localhost:12537';
  const evmUrl = 'http://localhost:8545';

  // Test Core Space
  console.log('=== Core Space Tests ===');
  try {
    // Get epoch number (block number in Core Space)
    const epochResponse = await fetch(coreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'cfx_epochNumber',
        params: [],
        id: 1,
      }),
    });
    const epochData = await epochResponse.json();
    console.log('✓ cfx_epochNumber:', epochData.result);

    // Get gas price
    const gasPriceResponse = await fetch(coreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'cfx_gasPrice',
        params: [],
        id: 2,
      }),
    });
    const gasPriceData = await gasPriceResponse.json();
    console.log('✓ cfx_gasPrice:', gasPriceData.result);
  } catch (error) {
    console.error('✗ Core Space error:', error.message);
  }

  console.log('\n=== eSpace Tests ===');
  try {
    // Get block number
    const blockResponse = await fetch(evmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    const blockData = await blockResponse.json();
    console.log('✓ eth_blockNumber:', blockData.result, '(' + parseInt(blockData.result, 16) + ')');

    // Get gas price
    const gasResponse = await fetch(evmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 2,
      }),
    });
    const gasData = await gasResponse.json();
    console.log('✓ eth_gasPrice:', gasData.result);
  } catch (error) {
    console.error('✗ eSpace error:', error.message);
  }

  console.log('\n=== Backend API Test ===');
  try {
    const statusResponse = await fetch('http://localhost:3001/api/devkit/status');
    const status = await statusResponse.json();
    console.log('✓ Backend status:', {
      running: status.running,
      coreBlock: status.chains?.core?.blockNumber,
      evmBlock: status.chains?.evm?.blockNumber,
      coreGas: status.chains?.core?.gasPrice,
      evmGas: status.chains?.evm?.gasPrice,
    });
  } catch (error) {
    console.error('✗ Backend API error:', error.message);
  }
}

testRPC().catch(console.error);
