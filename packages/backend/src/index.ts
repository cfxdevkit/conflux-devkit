/**
 * Backend Core - Main Entry Point
 *
 * Simplified backend service that leverages the DevKit API
 * for providing REST + WebSocket services to the frontend.
 *
 * Architecture:
 * - Express REST API
 * - WebSocket server for real-time updates
 * - Simple wallet-based authentication
 * - Direct DevKit integration
 */

// Load local .env files (if present) before reading process.env.
// This ensures running `pnpm --filter backend dev` will pick up `packages/backend/.env`.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = await import('dotenv');
  dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
} catch (_err) {
  // Not fatal — dotenv is optional in some environments (CI/prod may set envs externally)
}

import { BackendServer } from './server/BackendServer.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('🚀 Starting Conflux DevKit Backend Core...');

    const server = new BackendServer({
      port: parseInt(process.env.PORT || '3001', 10),
      wsPort: parseInt(process.env.WS_PORT || '3002', 10),
      devkitConfig: {
        chainId: 1029,
        evmChainId: 1030,
        jsonrpcHttpPort: 12537,
        jsonrpcWsPort: 12535,
        jsonrpcHttpEthPort: 8545,
        jsonrpcWsEthPort: 8546,
        log: false,
        // Prefer the canonical env var used across the workspace
        mnemonic:
          process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC ||
          process.env.VITE_HARDHAT_VAR_DEPLOYER_MNEMONIC ||
          'test test test test test test test test test test test junk',
      },
    });

    await server.start();

    // Warn if using the default test mnemonic (helps catch accidental leaks)
    const usedMnemonic = process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC || process.env.VITE_HARDHAT_VAR_DEPLOYER_MNEMONIC;
    if (!usedMnemonic) {
      logger.warn('No deployer mnemonic env var set; backend is using the default test mnemonic. Do NOT use this in production.');
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start backend:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
