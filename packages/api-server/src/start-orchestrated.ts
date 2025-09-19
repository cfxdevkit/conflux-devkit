// Startup script for the orchestrated API server

import { OrchestratedApiServer } from './api/orchestrated-server';

async function startServer() {
  const port = Number(process.env.PORT) || 3001;
  const server = new OrchestratedApiServer(port);

  try {
    console.log('🚀 Starting Conflux DevKit Orchestrated API Server...');

    // Initialize services
    await server.initialize();

    // Start the server
    await server.start();

    console.log('✅ Server started successfully!');
    console.log(`🌐 Server running at: http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`📚 API docs: http://localhost:${port}/api/system/docs`);
    console.log(`🔗 System status: http://localhost:${port}/api/system/status`);

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
