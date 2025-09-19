#!/usr/bin/env node

// Test WebSocket client to debug DevKit WebSocket server
const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3002';
const API_URL = 'http://localhost:3001';

console.log('🧪 DevKit WebSocket Test Client');
console.log('================================');
console.log(`WebSocket URL: ${WS_URL}`);
console.log(`API URL: ${API_URL}`);
console.log('');

let ws = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  console.log(`🔌 Connecting to WebSocket server... (attempt ${reconnectAttempts + 1})`);
  
  ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully!');
    console.log('📡 Sending authentication...');
    
    // Send authentication
    ws.send(JSON.stringify({
      type: 'auth:authenticate',
      data: { token: 'test-token' }
    }));
    
    // Request node status
    console.log('📡 Requesting node status...');
    ws.send(JSON.stringify({
      type: 'node:status:request',
      data: {}
    }));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', JSON.stringify(message, null, 2));
      
      // Handle different message types
      switch (message.type) {
        case 'auth:success':
          console.log('🔐 Authentication successful!');
          break;
        case 'node:status':
          console.log('📊 Node status update received!');
          console.log('   Running:', message.data?.running);
          console.log('   Uptime:', message.data?.uptime);
          console.log('   Core Block:', message.data?.core?.blockNumber);
          console.log('   EVM Block:', message.data?.evm?.blockNumber);
          break;
        case 'node:started':
          console.log('🚀 Node started event received!');
          break;
        case 'node:stopped':
          console.log('🛑 Node stopped event received!');
          break;
        default:
          console.log('❓ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Failed to parse message:', error);
      console.log('Raw data:', data.toString());
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect in 2 seconds...`);
      setTimeout(connect, 2000);
    } else {
      console.log('❌ Max reconnection attempts reached. Exiting.');
      process.exit(1);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
}

// Test API connectivity
async function testAPI() {
  console.log('🧪 Testing API connectivity...');
  
  try {
    // Test internal endpoint
    const internalResponse = await fetch(`${API_URL}/api/internal/nodes/status`, {
      headers: {
        'Authorization': 'Bearer devkit-internal-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (internalResponse.ok) {
      const data = await internalResponse.json();
      console.log('✅ Internal API endpoint working:');
      console.log('   Running:', data.data?.running);
      console.log('   Uptime:', data.data?.uptime);
    } else {
      console.log('❌ Internal API failed:', internalResponse.status, internalResponse.statusText);
    }
    
    // Test regular endpoint (should fail without auth)
    const regularResponse = await fetch(`${API_URL}/api/nodes/status`);
    console.log('📊 Regular API endpoint:', regularResponse.status, regularResponse.statusText);
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
  
  console.log('');
}

// Test node start/stop
async function testNodeOperations() {
  console.log('🧪 Testing node operations...');
  
  try {
    // Test node start
    console.log('🚀 Testing node start...');
    const startResponse = await fetch(`${API_URL}/api/internal/nodes/start`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer devkit-internal-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ autoMine: true })
    });
    
    if (startResponse.ok) {
      const data = await startResponse.json();
      console.log('✅ Node start successful:', data.data?.running);
    } else {
      console.log('❌ Node start failed:', startResponse.status, startResponse.statusText);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test node stop
    console.log('🛑 Testing node stop...');
    const stopResponse = await fetch(`${API_URL}/api/internal/nodes/stop`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer devkit-internal-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (stopResponse.ok) {
      const data = await stopResponse.json();
      console.log('✅ Node stop successful');
    } else {
      console.log('❌ Node stop failed:', stopResponse.status, stopResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Node operations test failed:', error);
  }
  
  console.log('');
}

// Main execution
async function main() {
  // Test API first
  await testAPI();
  
  // Connect to WebSocket
  connect();
  
  // Wait for connection, then test node operations
  setTimeout(async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      await testNodeOperations();
    }
  }, 2000);
  
  // Keep running to receive periodic updates
  console.log('🔄 Listening for periodic updates... (Press Ctrl+C to exit)');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down test client...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

// Start the test
main().catch(console.error);
