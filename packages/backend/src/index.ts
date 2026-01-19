/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

// Main exports for library usage
export { AuthService } from './auth/AuthService.js';
export { DevelopmentAuthService } from './auth/DevelopmentAuthService.js';
// Middleware exports
export {
  createSetupCheckMiddleware,
  requireSetup,
} from './middleware/setup-check.js';
// Route creators for custom implementations
export { createAdminRoutes } from './routes/admin.js';
export { createDevKitRoutes } from './routes/devkit.js';
export { createSetupRoutes } from './routes/setup.js';
export { createSwapRoutes } from './routes/swap.js';
export { createWalletRoutes } from './routes/wallet.js';
export type { BackendServerConfig } from './server/BackendServer.js';
export { BackendServer } from './server/BackendServer.js';
export { DevKitWebSocketServer } from './server/WebSocketServer.js';
export {
  getKeystoreService,
  KeystoreLockedError,
  KeystoreService,
} from './services/keystore-service.js';
// Type exports
export type {
  AddMnemonicData,
  ConfigModificationCheck,
  DerivedAccount,
  KeystoreV2,
  MnemonicEntry,
  MnemonicSummary,
  NodeConfig,
  SetupData,
  ValidationResult,
} from './types/keystore.js';
export { logger } from './utils/logger.js';

import { BackendServer } from './server/BackendServer.js';
import { getKeystoreService } from './services/keystore-service.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('🚀 Starting Conflux DevKit Backend Core...');

    // Initialize keystore service (v2 - no initialization function needed, uses singleton)
    const keystoreService = getKeystoreService();
    await keystoreService.initialize();
    logger.info('📝 Keystore service initialized');

    // Check if setup is completed
    const setupCompleted = await keystoreService.isSetupCompleted();

    // Default config for when setup is not completed
    let devkitConfig = {
      chainId: 2029, // Local development Core Space chain ID
      evmChainId: 2030, // Local development eSpace chain ID
      jsonrpcHttpPort: 12537,
      jsonrpcWsPort: 12535,
      jsonrpcHttpEthPort: 8545,
      jsonrpcWsEthPort: 8546,
      log: false,
      mnemonic: undefined as string | undefined,
      dataDir: undefined as string | undefined,
    };

    if (!setupCompleted) {
      logger.warn('⚠️  Initial setup not completed');
      logger.info('Complete setup via:');
      logger.info('  • Web UI: http://localhost:5173/setup');
      logger.info('  • API: POST /api/setup/complete');
      // Server will start but node endpoints will be blocked until setup
    } else {
      // Get active mnemonic and its configuration
      const mnemonicEntry = await keystoreService.getActiveMnemonic();
      const nodeConfig = mnemonicEntry.nodeConfig;

      // Check if locked (encrypted but not unlocked)
      if (keystoreService.isLocked()) {
        logger.warn('⚠️  Keystore is encrypted and locked');
        logger.warn(
          '⚠️  Please unlock via API: POST /api/devkit/wallet/encryption/unlock'
        );
        // Server will start but cannot use encrypted mnemonic until unlocked
      } else {
        const mnemonic = await keystoreService.getDecryptedMnemonic(
          mnemonicEntry.id
        );
        const dataDir = await keystoreService.getDataDir();

        devkitConfig = {
          chainId: nodeConfig.chainId,
          evmChainId: nodeConfig.evmChainId,
          jsonrpcHttpPort: 12537,
          jsonrpcWsPort: 12535,
          jsonrpcHttpEthPort: 8545,
          jsonrpcWsEthPort: 8546,
          log: false,
          mnemonic,
          dataDir,
        };

        logger.info(
          `📁 Using wallet: "${mnemonicEntry.label}" with data directory: ${dataDir}`
        );
      }
    }

    const server = new BackendServer({
      port: parseInt(process.env.PORT || '3001', 10),
      wsPort: parseInt(process.env.WS_PORT || '3002', 10),
      devkitConfig,
    });

    await server.start();

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
