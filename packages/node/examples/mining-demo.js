#!/usr/bin/env node

/**
 * Demo: Conflux DevKit Node with Automatic Block Mining
 *
 * This demo shows how to:
 * 1. Start a Conflux development node
 * 2. Configure and start automatic block mining
 * 3. Control mining intervals dynamically
 * 4. Monitor mining status
 */

import { ServerManager } from '../src/server/index.js';

async function miningDemo() {
  console.log('🚀 Starting Conflux DevKit Mining Demo\n');

  // Create server with mining configuration
  const server = new ServerManager({
    coreRpcPort: 12537,
    evmRpcPort: 8545,
    chainId: 2029,
    evmChainId: 2030,
    accounts: 5,
    balance: '1000000',
    mining: {
      enabled: true,
      interval: 3000, // 3 seconds between blocks
      autoStart: true, // Start mining when server starts
    },
  });

  try {
    // Start the server (mining will auto-start)
    console.log('📡 Starting Conflux development node...');
    await server.start();
    console.log('✅ Server started successfully!');
    console.log('🏃 Auto-mining started with 3-second intervals\n');

    // Monitor mining status
    const monitorMining = () => {
      const status = server.getMiningStatus();
      const nodeStatus = server.getNodeStatus();

      console.log(
        `⛏️  Mining Status: ${status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}`
      );
      console.log(`📊 Blocks Mined: ${status.blocksMined}`);
      console.log(`⏱️  Interval: ${status.interval}ms`);
      console.log(
        `🔗 RPC URLs: Core=${nodeStatus.rpcUrls.core}, eSpace=${nodeStatus.rpcUrls.evm}`
      );
      console.log('---');
    };

    // Monitor every 5 seconds
    const monitor = setInterval(monitorMining, 5000);
    monitorMining(); // Initial status

    // Demo: Change mining interval after 15 seconds
    setTimeout(async () => {
      console.log('\n🔄 Changing mining interval to 1 second...');
      await server.setMiningInterval(1000);
      console.log('✅ Mining interval updated!\n');
    }, 15000);

    // Demo: Stop and restart mining
    setTimeout(async () => {
      console.log('\n⏸️  Stopping mining...');
      await server.stopMining();
      console.log('✅ Mining stopped!');

      setTimeout(async () => {
        console.log('\n▶️  Restarting mining with 5-second intervals...');
        await server.startMining(5000);
        console.log('✅ Mining restarted!\n');
      }, 10000);
    }, 30000);

    // Demo: Manual mining
    setTimeout(async () => {
      console.log('\n🔨 Mining 3 blocks manually...');
      await server.mine(3);
      console.log('✅ Manual mining completed!\n');
    }, 50000);

    // Clean shutdown after 60 seconds
    setTimeout(async () => {
      clearInterval(monitor);
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      console.log('✅ Server stopped successfully!');
      console.log('👋 Demo completed!');
    }, 60000);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Run the demo
miningDemo().catch(console.error);
