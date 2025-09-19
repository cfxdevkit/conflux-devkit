#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 Raw WebSocket Data Test');
console.log('==========================');

const ws = new WebSocket('ws://localhost:3002');

ws.on('open', () => {
  console.log('✅ Connected to backend WebSocket');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    if (message.type === 'nodeStats') {
      console.log('\n📊 Raw nodeStats message:');
      console.log(JSON.stringify(message, null, 2));
    } else {
      console.log(`\n📨 ${message.type} message:`, message);
    }
  } catch (_e) {
    console.log('📨 Raw message:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

// Keep open for 15 seconds
setTimeout(() => {
  console.log('\n⏰ Closing connection...');
  ws.close();
  process.exit(0);
}, 15000);
