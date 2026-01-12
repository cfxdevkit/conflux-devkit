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

// Server Manager for xcfx/node lifecycle management
// Based on proven patterns from DevKit CLI, adapted for unified interface

import { createServer } from '@xcfx/node';
import { BIP32Factory } from 'bip32';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import type { TestClient } from 'cive';
import { privateKeyToAccount } from 'cive/accounts';
import type { ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as ecc from 'tiny-secp256k1';
import { privateKeyToAccount as privateKeyToEvmAccount } from 'viem/accounts';
import { defaultNetworkSelector } from '../config/chains.js';
import type {
    AccountInfo,
    MiningStatus,
    ServerConfig,
    ServerStatus,
} from '../types/index.js';
import { NodeError } from '../types/index.js';

// Port configuration
const DEFAULT_CORE_RPC_PORT = 12537;
const DEFAULT_EVM_RPC_PORT = 8545;
const DEFAULT_WS_PORT = 12536;

/**
 * Server Manager for xcfx/node lifecycle management
 * Handles starting, stopping, and managing the Conflux development node
 */
export class ServerManager {
  private nodeProcess: ChildProcess | null = null;
  private server: Awaited<ReturnType<typeof createServer>> | null = null;
  private config: ServerConfig;
  private status: ServerStatus = 'stopped';
  private accounts: AccountInfo[] = [];
  private mnemonic: string = '';
  private miningAccount: AccountInfo | null = null;
  private miningStatus: MiningStatus;
  private miningTimer: NodeJS.Timeout | null = null;
  private testClient: TestClient | null = null;

  constructor(config: ServerConfig) {
    this.config = {
      ...config,
      coreRpcPort: config.coreRpcPort || DEFAULT_CORE_RPC_PORT,
      evmRpcPort: config.evmRpcPort || DEFAULT_EVM_RPC_PORT,
      wsPort: config.wsPort || DEFAULT_WS_PORT,
      chainId: config.chainId || 2029, // Local Core chain ID
      evmChainId: config.evmChainId || 2030, // Local eSpace chain ID
      accounts: config.accounts || 10,
      balance: config.balance || '1000000',
      mnemonic: config.mnemonic,
      mining: config.mining || {
        enabled: false,
        interval: 500, // 0.5 seconds default for faster response
        autoStart: false,
      },
      devBlockIntervalMs: config.devBlockIntervalMs ?? 500, // Default 500ms for auto block generation
      devPackTxImmediately: config.devPackTxImmediately ?? true, // Default to pack transactions immediately
    };

    // Initialize mining status
    this.miningStatus = {
      isRunning: false,
      interval: 1000,
      blocksMined: 0,
      startTime: undefined,
    };

    // Generate or use provided mnemonic and immediately generate accounts
    // This ensures accounts are always available regardless of node state
    this.mnemonic = this.config.mnemonic || generateMnemonic();
    this.generateAccountsSync();
  }

  /**
   * Return a sanitized copy of the server config with sensitive fields redacted.
   */
  private redactConfig(config: ServerConfig): Partial<ServerConfig> {
    type SafeConfig = Partial<ServerConfig> & {
      mnemonic?: string;
      accounts?: unknown;
    };
    const safe: SafeConfig = { ...(config as SafeConfig) };
    if (safe.mnemonic) safe.mnemonic = '[REDACTED]';
    // remove accounts and secrets to avoid leaking private keys
    if (safe.accounts) delete safe.accounts;
    return safe;
  }

  /**
   * Start the Conflux development node
   */
  async start(): Promise<void> {
    if (this.status === 'running') {
      throw new NodeError(
        'Server is already running',
        'SERVER_ALREADY_RUNNING'
      );
    }

    try {
      this.status = 'starting';

      // Mnemonic and accounts are already generated in constructor
      // Generate dedicated mining account (separate from genesis)
      await this.generateMiningAccount();

      // Ensure data directory exists with proper permissions
      const dataDir = this.config.dataDir || '/workspace/.conflux-dev';
      try {
        await fs.mkdir(dataDir, { recursive: true, mode: 0o755 });
      } catch (error) {
        console.warn('Failed to create data directory:', error);
        // Continue anyway, might still work if directory exists
      }

      // Create server instance with configuration
      this.server = await createServer({
        // Correct property names according to @xcfx/node API
        jsonrpcHttpPort: this.config.coreRpcPort,
        jsonrpcHttpEthPort: this.config.evmRpcPort,
        jsonrpcWsPort: this.config.wsPort,
        chainId: this.config.chainId,
        evmChainId: this.config.evmChainId,
        // Specify data directory to avoid permission issues
        confluxDataDir: dataDir,
        // Genesis accounts configuration
        genesisSecrets: this.accounts.map((acc) => acc.privateKey),
        genesisEvmSecrets: this.accounts.map(
          (acc) => acc.evmPrivateKey || acc.privateKey
        ),
        // Mining configuration - use dedicated mining account
        miningAuthor: this.miningAccount?.coreAddress,
        devPackTxImmediately: this.config.devPackTxImmediately ?? true, // Pack transactions immediately for UI responsiveness
        devBlockIntervalMs: this.config.devBlockIntervalMs, // Auto block generation interval (undefined = disabled)
        log: this.config.logging || false,
      });

      // Start the server - this is required!
      await this.server.start();

      this.status = 'running';

      // Update network selector with local chain URLs and notify it of node start
      defaultNetworkSelector.updateLocalChainUrls(
        this.config.coreRpcPort || DEFAULT_CORE_RPC_PORT,
        this.config.evmRpcPort || DEFAULT_EVM_RPC_PORT,
        this.config.wsPort || DEFAULT_WS_PORT
      );
      defaultNetworkSelector.onNodeStart(2029, 2030); // Core local, eSpace local

      // Set up cleanup handlers
      this.setupCleanupHandlers();

      // Auto-start mining if configured
      if (this.config.mining?.enabled && this.config.mining?.autoStart) {
        try {
          await this.startMining();
        } catch (error) {
          console.warn('Failed to auto-start mining:', error);
          // Don't fail server startup if mining fails to start
        }
      }
    } catch (error) {
      this.status = 'error';
      throw new NodeError(
        `Failed to start server: ${error instanceof Error ? error.message : String(error)}`,
        'SERVER_START_ERROR',
        undefined,
        {
          config: this.redactConfig(this.config as ServerConfig),
          originalError: error,
        }
      );
    }
  }

  /**
   * Stop the Conflux development node
   */
  async stop(): Promise<void> {
    if (this.status === 'stopped') {
      return;
    }

    try {
      this.status = 'stopping';

      // Stop mining if running
      if (this.miningStatus.isRunning) {
        try {
          await this.stopMining();
        } catch (error) {
          console.warn('Failed to stop mining during server shutdown:', error);
        }
      }

      if (this.server) {
        await this.server.stop();
        this.server = null;
      }

      if (this.nodeProcess) {
        this.nodeProcess.kill('SIGTERM');
        this.nodeProcess = null;
      }

      // Clean up test client
      this.testClient = null;

      this.status = 'stopped';

      // Notify network selector that node has stopped
      defaultNetworkSelector.onNodeStop();
    } catch (error) {
      this.status = 'error';
      throw new NodeError(
        `Failed to stop server: ${error instanceof Error ? error.message : String(error)}`,
        'SERVER_STOP_ERROR',
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Restart the Conflux development node
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Get current server status
   */
  getStatus(): ServerStatus {
    return this.status;
  }

  /**
   * Get comprehensive node status including mining
   */
  getNodeStatus() {
    return {
      server: this.status,
      mining: this.getMiningStatus(),
      config: this.redactConfig(this.config as ServerConfig),
      accounts: this.accounts.length,
      rpcUrls: this.getRpcUrls(),
    };
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.status === 'running';
  }

  /**
   * Get server configuration
   */
  getConfig(): ServerConfig {
    // Return a sanitized config to avoid exposing mnemonic/privkeys in logs or API
    return {
      ...(this.redactConfig(this.config as ServerConfig) as ServerConfig),
    };
  }

  /**
   * Get generated accounts
   */
  getAccounts(): AccountInfo[] {
    return [...this.accounts];
  }

  /**
   * Get the mnemonic phrase
   */
  getMnemonic(): string {
    return this.mnemonic;
  }

  /**
   * Get RPC URLs
   */
  getRpcUrls(): { core: string; evm: string; ws: string } {
    return {
      core: `http://localhost:${this.config.coreRpcPort}`,
      evm: `http://localhost:${this.config.evmRpcPort}`,
      ws: `ws://localhost:${this.config.wsPort}`,
    };
  }

  /**
   * Add a new account to the server
   */
  async addAccount(privateKey?: string): Promise<AccountInfo> {
    const accountPrivateKey =
      privateKey || `0x${randomBytes(32).toString('hex')}`;

    const coreAccount = privateKeyToAccount(
      accountPrivateKey as `0x${string}`,
      {
        networkId: this.config.chainId || 1,
      }
    );
    const evmAccount = privateKeyToEvmAccount(
      accountPrivateKey as `0x${string}`
    );

    const accountInfo: AccountInfo = {
      index: this.accounts.length,
      privateKey: accountPrivateKey,
      coreAddress: coreAccount.address,
      evmAddress: evmAccount.address,
      mnemonic: this.mnemonic,
      path: `m/44'/503'/0'/0/${this.accounts.length}`,
    };

    this.accounts.push(accountInfo);

    // Note: @xcfx/node automatically funds genesis accounts
    // Additional funding would require separate RPC calls to the running node

    return accountInfo;
  }

  /**
   * Fund an account with CFX
   * Note: @xcfx/node doesn't provide direct funding methods.
   * This would require using RPC calls to send transactions from funded genesis accounts.
   */
  async fundAccount(
    address: string,
    amount: string,
    chainType: 'core' | 'evm' = 'core'
  ): Promise<void> {
    if (!this.isRunning() || !this.server) {
      throw new NodeError('Server is not running', 'SERVER_NOT_RUNNING');
    }

    // This functionality would need to be implemented using RPC calls
    // to transfer funds from genesis accounts to the target address
    throw new NodeError(
      'Direct account funding not implemented. Genesis accounts are automatically funded by @xcfx/node.',
      'NOT_IMPLEMENTED',
      chainType,
      { address, amount, chainType }
    );
  }

  /**
   * Set next block timestamp (for testing)
   * Note: @xcfx/node doesn't provide direct timestamp control.
   * Use createTestClient from 'cive' and connect to the running node's RPC.
   */
  async setNextBlockTimestamp(timestamp: number): Promise<void> {
    if (!this.isRunning() || !this.server) {
      throw new NodeError('Server is not running', 'SERVER_NOT_RUNNING');
    }

    // This functionality would need to be implemented using createTestClient
    // from 'cive' library connected to the running server's RPC endpoint
    throw new NodeError(
      'Direct timestamp control not implemented. Use createTestClient from cive to control block timestamps via RPC.',
      'NOT_IMPLEMENTED',
      'core',
      { timestamp }
    );
  }

  /**
   * Get server logs
   * Note: @xcfx/node doesn't provide direct log access.
   * Logs would need to be captured during server startup or accessed via system logs.
   */
  async getLogs(lines: number = 50): Promise<string[]> {
    if (!this.isRunning() || !this.server) {
      throw new NodeError('Server is not running', 'SERVER_NOT_RUNNING');
    }

    // @xcfx/node doesn't provide log access methods
    // This would need to be implemented by capturing stdout/stderr during server startup
    // or by accessing system logs where the node process writes its output
    return [
      'Log access not implemented for @xcfx/node.',
      'Consider capturing server output during startup or checking system logs.',
      `Requested ${lines} lines of logs.`,
    ];
  }

  /**
   * Save server configuration to file
   */
  async saveConfig(filepath: string): Promise<void> {
    try {
      // Save a sanitized config file by redacting the mnemonic and removing private data
      const configData = {
        ...this.redactConfig(this.config as ServerConfig),
        mnemonic: '[REDACTED]',
        accounts: this.accounts.map((a) => ({
          index: a.index,
          coreAddress: a.coreAddress,
          evmAddress: a.evmAddress,
          path: a.path,
        })),
        rpcUrls: this.getRpcUrls(),
      };

      await fs.writeFile(filepath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      throw new NodeError(
        `Failed to save config: ${error instanceof Error ? error.message : String(error)}`,
        'CONFIG_SAVE_ERROR',
        'core',
        { filepath, originalError: error }
      );
    }
  }

  /**
   * Load server configuration from file
   */
  static async loadConfig(filepath: string): Promise<ServerConfig> {
    try {
      const configData = await fs.readFile(filepath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      throw new NodeError(
        `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
        'CONFIG_LOAD_ERROR',
        'core',
        { filepath, originalError: error }
      );
    }
  }

  /**
   * Generate accounts from mnemonic using BIP32/BIP39
   */
  /**
   * Generate accounts from mnemonic (synchronous)
   * Called from constructor to ensure accounts are always available
   */
  private generateAccountsSync(): void {
    // Initialize BIP32 with secure elliptic curve implementation
    const bip32 = BIP32Factory(ecc);

    // Generate seed from mnemonic with proper error handling
    const seed = mnemonicToSeedSync(this.mnemonic);
    const root = bip32.fromSeed(seed);

    this.accounts = [];

    for (let i = 0; i < (this.config.accounts || 10); i++) {
      // Derive private key using BIP32 path for Conflux (m/44'/503'/0'/0/i)
      const confluxChild = root.derivePath(`m/44'/503'/0'/0/${i}`);

      if (!confluxChild.privateKey) {
        throw new NodeError(
          `Failed to derive Conflux private key for account ${i}`,
          'KEY_DERIVATION_ERROR'
        );
      }

      const confluxPrivateKey = `0x${confluxChild.privateKey.toString('hex')}`;

      // Derive EVM private key using Ethereum derivation path (m/44'/60'/0'/0/i)
      const ethereumChild = root.derivePath(`m/44'/60'/0'/0/${i}`);

      if (!ethereumChild.privateKey) {
        throw new NodeError(
          `Failed to derive Ethereum private key for account ${i}`,
          'KEY_DERIVATION_ERROR'
        );
      }

      const ethereumPrivateKey = `0x${ethereumChild.privateKey.toString('hex')}`;

      // Create Core account using Conflux-derived private key
      const coreAccount = privateKeyToAccount(
        confluxPrivateKey as `0x${string}`,
        {
          networkId: this.config.chainId || 1,
        }
      );

      // Create EVM account using Ethereum-derived private key
      const evmAccount = privateKeyToEvmAccount(
        ethereumPrivateKey as `0x${string}`
      );

      this.accounts.push({
        index: i,
        privateKey: confluxPrivateKey, // Keep Conflux private key as primary
        coreAddress: coreAccount.address,
        evmAddress: evmAccount.address,
        mnemonic: this.mnemonic,
        path: `m/44'/503'/0'/0/${i}`, // Core path
        // Store additional EVM-specific info
        evmPrivateKey: ethereumPrivateKey,
        evmPath: `m/44'/60'/0'/0/${i}`,
      });
    }
  }

  /**
   * Generate dedicated mining account (separate from genesis accounts)
   * This account will receive mining rewards and serve as the faucet
   */
  private async generateMiningAccount(): Promise<void> {
    // Initialize BIP32 with secure elliptic curve implementation
    const bip32 = BIP32Factory(ecc);

    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(this.mnemonic);
    const root = bip32.fromSeed(seed);

    // Use a different derivation path for mining account (m/44'/503'/1'/0/0)
    // This separates it from genesis accounts (m/44'/503'/0'/0/i)
    const child = root.derivePath(`m/44'/503'/1'/0/0`);

    if (!child.privateKey) {
      throw new NodeError(
        'Failed to derive private key for mining account',
        'KEY_DERIVATION_ERROR'
      );
    }

    const privateKey = `0x${child.privateKey.toString('hex')}`;

    // Create both Core and EVM accounts from the same private key
    const coreAccount = privateKeyToAccount(privateKey as `0x${string}`, {
      networkId: this.config.chainId || 1,
    });
    const evmAccount = privateKeyToEvmAccount(privateKey as `0x${string}`);

    this.miningAccount = {
      index: -1, // Special index for mining account
      privateKey,
      coreAddress: coreAccount.address,
      evmAddress: evmAccount.address,
      mnemonic: this.mnemonic,
      path: `m/44'/503'/1'/0/0`,
    };

    console.log(
      `Generated mining account: Core=${this.miningAccount.coreAddress}, eSpace=${this.miningAccount.evmAddress}`
    );
  }

  // ===== MINING METHODS =====

  /**
   * Start automatic block mining
   */
  async startMining(interval?: number): Promise<void> {
    if (!this.isRunning()) {
      throw new NodeError(
        'Server must be running to start mining',
        'SERVER_NOT_RUNNING'
      );
    }

    if (this.miningStatus.isRunning) {
      throw new NodeError(
        'Mining is already running',
        'MINING_ALREADY_RUNNING'
      );
    }

    // Initialize test client if not already created
    if (!this.testClient) {
      const { createTestClient, http } = await import('cive');
      this.testClient = createTestClient({
        transport: http(`http://localhost:${this.config.coreRpcPort}`),
      });
    }

    const miningInterval = interval || this.config.mining?.interval || 2000;

    this.miningStatus = {
      ...this.miningStatus,
      isRunning: true,
      interval: miningInterval,
      startTime: new Date(),
    };

    // Start the mining loop
    this.miningTimer = setInterval(async () => {
      try {
        if (this.testClient) {
          // Use generateEmptyLocalNodeBlocks for proper EVM transaction processing
          const blocksToMine = 2;
          const { generateEmptyLocalNodeBlocks } = await import('cive');
          await generateEmptyLocalNodeBlocks(this.testClient, { numBlocks: blocksToMine });
          this.miningStatus = {
            ...this.miningStatus,
            blocksMined: this.miningStatus.blocksMined + blocksToMine,
          };
        }
      } catch (error) {
        console.error('Mining error:', error);
        // Continue mining even if a single block fails
      }
    }, miningInterval);

    console.log(`Mining started with ${miningInterval}ms interval`);
  }

  /**
   * Stop automatic block mining
   */
  async stopMining(): Promise<void> {
    if (!this.miningStatus.isRunning) {
      throw new NodeError('Mining is not running', 'MINING_NOT_RUNNING');
    }

    if (this.miningTimer) {
      clearInterval(this.miningTimer);
      this.miningTimer = null;
    }

    this.miningStatus = {
      ...this.miningStatus,
      isRunning: false,
      startTime: undefined,
    };

    console.log('Mining stopped');
  }

  /**
   * Change mining interval (stops and restarts mining with new interval)
   */
  async setMiningInterval(interval: number): Promise<void> {
    if (interval < 100) {
      throw new NodeError(
        'Mining interval must be at least 100ms',
        'INVALID_INTERVAL'
      );
    }

    const wasRunning = this.miningStatus.isRunning;

    if (wasRunning) {
      await this.stopMining();
    }

    // Update config
    this.config = {
      ...this.config,
      mining: {
        ...(this.config.mining || { enabled: false, autoStart: false }),
        interval,
      },
    };

    if (wasRunning) {
      await this.startMining(interval);
    } else {
      // Just update the status interval
      this.miningStatus = {
        ...this.miningStatus,
        interval,
      };
    }

    console.log(`Mining interval set to ${interval}ms`);
  }

  /**
   * Update development settings (pre-start configuration)
   * These settings are applied when the server starts, not at runtime
   */
  async updateDevSettings(settings: {
    devBlockIntervalMs?: number;
    devPackTxImmediately?: boolean;
  }): Promise<void> {
    if (this.isRunning()) {
      throw new NodeError(
        'Development settings can only be changed when the node is stopped. These are pre-start configuration settings.',
        'SERVER_RUNNING'
      );
    }

    if (settings.devBlockIntervalMs !== undefined && settings.devBlockIntervalMs < 100) {
      throw new NodeError(
        'Development block interval must be at least 100ms',
        'INVALID_INTERVAL'
      );
    }

    // Update config for next startup
    this.config = {
      ...this.config,
      devBlockIntervalMs: settings.devBlockIntervalMs,
      devPackTxImmediately: settings.devPackTxImmediately ?? this.config.devPackTxImmediately,
    };

    console.log('Development settings saved for next startup:', {
      devBlockIntervalMs: this.config.devBlockIntervalMs,
      devPackTxImmediately: this.config.devPackTxImmediately,
    });
  }

  /**
   * Mine a specific number of blocks immediately
   */
  async mine(blocks: number = 1): Promise<void> {
    if (!this.isRunning()) {
      throw new NodeError(
        'Server must be running to mine blocks',
        'SERVER_NOT_RUNNING'
      );
    }

    if (!this.testClient) {
      const { createTestClient, http } = await import('cive');
      this.testClient = createTestClient({
        transport: http(`http://localhost:${this.config.coreRpcPort}`),
      });
    }

    try {
      // Use generateEmptyLocalNodeBlocks for proper EVM transaction processing
      const { generateEmptyLocalNodeBlocks } = await import('cive');
      await generateEmptyLocalNodeBlocks(this.testClient, { numBlocks: blocks });
      this.miningStatus = {
        ...this.miningStatus,
        blocksMined: this.miningStatus.blocksMined + blocks,
      };
      console.log(`Mined ${blocks} block(s)`);
    } catch (error) {
      throw new NodeError(
        `Failed to mine blocks: ${error instanceof Error ? error.message : String(error)}`,
        'MINING_ERROR',
        'core',
        { blocks, originalError: error }
      );
    }
  }

  /**
   * Get current mining status
   */
  getMiningStatus(): MiningStatus {
    return { ...this.miningStatus };
  }

  // ===== FAUCET METHODS =====

  /**
   * Get the faucet account (first genesis account)
   * This account is automatically funded by @xcfx/node on both chains
   */
  getFaucetAccount(): AccountInfo {
    if (this.accounts.length === 0) {
      throw new NodeError(
        'No accounts available. Server must be started first.',
        'NO_ACCOUNTS'
      );
    }
    return this.accounts[0]; // First account is the faucet
  }

  /**
   * Fund a Core Space account using the faucet account
   */
  async fundCoreAccount(
    targetAddress: string,
    amount: string
  ): Promise<string> {
    if (!this.isRunning()) {
      throw new NodeError(
        'Server must be running to fund accounts',
        'SERVER_NOT_RUNNING'
      );
    }

    const faucetAccount = this.getFaucetAccount();

    try {
      // Create wallet client for the faucet account
      const { createWalletClient, http } = await import('cive');
      const { privateKeyToAccount } = await import('cive/accounts');

      const account = privateKeyToAccount(
        faucetAccount.privateKey as `0x${string}`,
        {
          networkId: this.config.chainId || 1,
        }
      );

      const walletClient = createWalletClient({
        account,
        chain:
          (this.config.chainId || 1) === 1029
            ? {
                id: 1029,
                name: 'Conflux Core',
                nativeCurrency: {
                  name: 'Conflux',
                  symbol: 'CFX',
                  decimals: 18,
                },
                rpcUrls: {
                  default: {
                    http: [`http://localhost:${this.config.coreRpcPort}`],
                  },
                },
              }
            : {
                id: this.config.chainId || 1,
                name: 'Conflux Core Testnet',
                nativeCurrency: {
                  name: 'Conflux',
                  symbol: 'CFX',
                  decimals: 18,
                },
                rpcUrls: {
                  default: {
                    http: [`http://localhost:${this.config.coreRpcPort}`],
                  },
                },
              },
        transport: http(`http://localhost:${this.config.coreRpcPort}`),
      });

      const { parseCFX } = await import('cive');

      const hash = await walletClient.sendTransaction({
        account,
        to: targetAddress as `cfx:${string}`,
        value: parseCFX(amount),
      });

      console.log(
        `Funded Core account ${targetAddress} with ${amount} CFX. TX: ${hash}`
      );
      return hash;
    } catch (error) {
      throw new NodeError(
        `Failed to fund Core account: ${error instanceof Error ? error.message : String(error)}`,
        'FAUCET_ERROR',
        'core',
        {
          targetAddress,
          amount,
          faucetAccount: faucetAccount.coreAddress,
          originalError: error,
        }
      );
    }
  }

  /**
   * Fund an eSpace account using the faucet account
   */
  async fundEvmAccount(targetAddress: string, amount: string): Promise<string> {
    if (!this.isRunning()) {
      throw new NodeError(
        'Server must be running to fund accounts',
        'SERVER_NOT_RUNNING'
      );
    }

    const faucetAccount = this.getFaucetAccount();

    try {
      // Create EVM wallet client for the faucet account
      const { createWalletClient, http, parseEther } = await import('viem');
      const { privateKeyToAccount } = await import('viem/accounts');

      const account = privateKeyToAccount(
        faucetAccount.privateKey as `0x${string}`
      );

      const walletClient = createWalletClient({
        account,
        chain: {
          id: this.config.evmChainId || 71,
          name: 'Conflux eSpace Local',
          nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
          rpcUrls: {
            default: { http: [`http://localhost:${this.config.evmRpcPort}`] },
          },
        },
        transport: http(`http://localhost:${this.config.evmRpcPort}`),
      });

      const hash = await walletClient.sendTransaction({
        account,
        to: targetAddress as `0x${string}`,
        value: parseEther(amount),
      });

      console.log(
        `Funded eSpace account ${targetAddress} with ${amount} CFX. TX: ${hash}`
      );
      return hash;
    } catch (error) {
      throw new NodeError(
        `Failed to fund eSpace account: ${error instanceof Error ? error.message : String(error)}`,
        'FAUCET_ERROR',
        'evm',
        {
          targetAddress,
          amount,
          faucetAccount: faucetAccount.evmAddress,
          originalError: error,
        }
      );
    }
  }

  /**
   * Fund both Core and eSpace accounts for the same private key
   */
  async fundDualChainAccount(
    privateKey: string,
    coreAmount: string,
    evmAmount: string
  ): Promise<{
    coreHash: string;
    evmHash: string;
    coreAddress: string;
    evmAddress: string;
  }> {
    // Create accounts from private key
    const { privateKeyToAccount } = await import('cive/accounts');
    const { privateKeyToAccount: privateKeyToEvmAccount } = await import(
      'viem/accounts'
    );

    const coreAccount = privateKeyToAccount(privateKey as `0x${string}`, {
      networkId: this.config.chainId || 1,
    });
    const evmAccount = privateKeyToEvmAccount(privateKey as `0x${string}`);

    // Fund both accounts
    const [coreHash, evmHash] = await Promise.all([
      this.fundCoreAccount(coreAccount.address, coreAmount),
      this.fundEvmAccount(evmAccount.address, evmAmount),
    ]);

    return {
      coreHash,
      evmHash,
      coreAddress: coreAccount.address,
      evmAddress: evmAccount.address,
    };
  }

  /**
   * Check faucet account balances on both chains
   */
  async getFaucetBalances(): Promise<{
    coreBalance: string;
    evmBalance: string;
  }> {
    if (!this.isRunning()) {
      throw new NodeError(
        'Server must be running to check balances',
        'SERVER_NOT_RUNNING'
      );
    }

    const faucetAccount = this.getFaucetAccount();

    try {
      const [coreBalance, evmBalance] = await Promise.all([
        this.getCoreBalance(faucetAccount.coreAddress),
        this.getEvmBalance(faucetAccount.evmAddress),
      ]);

      return { coreBalance, evmBalance };
    } catch (error) {
      throw new NodeError(
        `Failed to get faucet balances: ${error instanceof Error ? error.message : String(error)}`,
        'BALANCE_CHECK_ERROR',
        undefined,
        { faucetAccount, originalError: error }
      );
    }
  }

  /**
   * Check Core Space balance
   */
  private async getCoreBalance(address: string): Promise<string> {
    const { createPublicClient, http, formatCFX } = await import('cive');

    const publicClient = createPublicClient({
      chain:
        this.config.chainId === 1029
          ? {
              id: 1029,
              name: 'Conflux Core',
              nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
              rpcUrls: {
                default: {
                  http: [`http://localhost:${this.config.coreRpcPort}`],
                },
              },
            }
          : {
              id: 1,
              name: 'Conflux Core Testnet',
              nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
              rpcUrls: {
                default: {
                  http: [`http://localhost:${this.config.coreRpcPort}`],
                },
              },
            },
      transport: http(`http://localhost:${this.config.coreRpcPort}`),
    });

    const balance = await publicClient.getBalance({
      address: address as `cfx:${string}`,
    });
    return formatCFX(balance);
  }

  /**
   * Check eSpace balance
   */
  private async getEvmBalance(address: string): Promise<string> {
    const { createPublicClient, http, formatEther } = await import('viem');

    const publicClient = createPublicClient({
      chain: {
        id: this.config.evmChainId || 71,
        name: 'Conflux eSpace Local',
        nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        rpcUrls: {
          default: { http: [`http://localhost:${this.config.evmRpcPort}`] },
        },
      },
      transport: http(`http://localhost:${this.config.evmRpcPort}`),
    });

    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    });
    return formatEther(balance);
  }

  /**
   * Get Ethereum-compatible admin address derived from mnemonic
   * Uses the standard Ethereum derivation path: m/44'/60'/0'/0/0
   * This address will match what MetaMask and other Ethereum wallets derive
   */
  getEthereumAdminAddress(): string {
    // Initialize BIP32 with secure elliptic curve implementation
    const bip32 = BIP32Factory(ecc);

    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(this.mnemonic);
    const root = bip32.fromSeed(seed);

    // Use Ethereum derivation path (m/44'/60'/0'/0/0)
    // 60 is Ethereum's coin type in BIP44
    const child = root.derivePath(`m/44'/60'/0'/0/0`);

    if (!child.privateKey) {
      throw new NodeError(
        'Failed to derive Ethereum admin private key',
        'KEY_DERIVATION_ERROR'
      );
    }

    const privateKey = `0x${child.privateKey.toString('hex')}`;

    // Create EVM account from the private key
    const evmAccount = privateKeyToEvmAccount(privateKey as `0x${string}`);

    return evmAccount.address.toLowerCase();
  }

  /**
   * Set up cleanup handlers for graceful shutdown
   */
  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      if (this.isRunning()) {
        console.log('Shutting down Conflux development node...');
        await this.stop();
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }
}
