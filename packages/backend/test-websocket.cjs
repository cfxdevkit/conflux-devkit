#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 Backend WebSocket Test');
console.log('=========================');

const ws = new WebSocket('ws://localhost:3002');

ws.on('open', () => {
  console.log('✅ Connected to backend WebSocket');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Message received:');
    console.log('  Type:', message.type);
    if (message.data) {
      console.log('  Data keys:', Object.keys(message.data));
      if (message.type === 'nodeStats') {
        console.log('  NodeStats data:');
        console.log('    DevKit status:', message.data.devkit?.status);
        console.log('    Core block:', message.data.core?.blockNumber);
        console.log('    EVM block:', message.data.evm?.blockNumber);
        console.log('    Mining:', message.data.mining?.isEnabled);
      }
    }
    console.log('  Timestamp:', message.timestamp);
    console.log('---');
  } catch (_e) {
    console.log('📨 Raw message:', data.toString());
    console.log('---');
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

// Keep open for 15 seconds to see periodic messages
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
  process.exit(0);
}, 15000);
