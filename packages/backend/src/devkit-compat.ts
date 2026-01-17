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
 * DevKit Compatibility Layer
 *
 * This module provides a unified interface for the backend by wrapping
 * the ServerManager from @conflux-devkit/plugin-devnode. It bridges the
 * gap between the old DevKit API expected by the backend routes and the
 * new plugin-based architecture.
 */

import { ServerManager, type AccountInfo, type MiningStatus, type ServerConfig } from '@conflux-devkit/plugin-devnode';
import { http as coreHttp, createPublicClient as createCorePublicClient, formatCFX } from 'cive';
import { privateKeyToAccount as corePrivateKeyToAccount } from 'cive/accounts';
import { promises as fs } from 'node:fs';
import { createPublicClient, createWalletClient, http as viemHttp } from 'viem';
import { privateKeyToAccount as evmPrivateKeyToAccount } from 'viem/accounts';
export interface DevKitConfig {
  chainId: number;
  evmChainId: number;
  jsonrpcHttpPort: number;
  jsonrpcHttpEthPort: number;
  jsonrpcWsPort?: number;
  jsonrpcWsEthPort?: number;
  log: boolean;
  mnemonic?: string;
  dataDir?: string; // Mnemonic-specific data directory
}

/**
 * Account wrapper that provides both Core and EVM wallet functionality
 */
export interface DevKitAccount {
  index: number;
  privateKey: `0x${string}`;
  evmPrivateKey: `0x${string}`;
  address: {
    core: string;
    evm: string;
  };
  core: {
    signMessage: (message: string) => Promise<string>;
  };
  evm: {
    signMessage: (message: string) => Promise<string>;
  };
  getBalance: (chain: 'core' | 'evm') => Promise<string>;
  transfer: (to: string, value: string, chain: 'core' | 'evm') => Promise<string>;
}

/**
 * DevKitCompat - Unified interface for backend operations
 *
 * This class wraps ServerManager and provides:
 * - Node lifecycle management (start/stop)
 * - Mining control
 * - Account management with wallet functionality
 * - Contract deployment and interaction
 * - Faucet operations
 */
export class DevKitCompat {
  private serverManager: ServerManager;
  private _config: DevKitConfig;
  private accountsCount: number = 10; // Default accounts count
  private miningAuthor?: string; // Custom mining rewards address

  constructor(config: DevKitConfig) {
    this._config = config;

    // Map BackendServerConfig to ServerConfig
    // Following xcfx-node test pattern: no auto block generation
    // All mining is managed via testClient.mine() calls
    const serverConfig: ServerConfig = {
      chainId: config.chainId,
      evmChainId: config.evmChainId,
      coreRpcPort: config.jsonrpcHttpPort,
      evmRpcPort: config.jsonrpcHttpEthPort,
      wsPort: config.jsonrpcWsPort,
      mnemonic: config.mnemonic,
      logging: config.log,
      accounts: this.accountsCount, // Use configurable accounts count
      balance: '10000', // Default balance in CFX
      miningAuthor: this.miningAuthor, // Mining rewards address (optional)
      dataDir: config.dataDir, // Mnemonic-specific data directory
      // devPackTxImmediately is always false - mining is via testClient
    };

    this.serverManager = new ServerManager(serverConfig);
  }

  // ===== CONFIGURATION =====

  getConfig(): DevKitConfig {
    return this._config;
  }

  getRpcUrls(): { core: string; evm: string } {
    const urls = this.serverManager.getRpcUrls();
    return {
      core: urls.core,
      evm: urls.evm,
    };
  }

  // ===== NODE LIFECYCLE =====

  async start(options?: {
    chainId?: number;
    evmChainId?: number;
    accountsCount?: number;
    miningAuthor?: string;
    persistence?: boolean;
    configChanged?: boolean;
  }): Promise<void> {
    // Check if configuration changed from last successful start
    // If so, clear data to prevent stale configuration issues
    if (options?.configChanged) {
      console.log('Configuration has changed, clearing node data directory...');
      try {
        await this.clearData();
      } catch (error) {
        console.warn('Failed to clear data on config change:', error);
        // Don't throw - continue with start anyway
      }
    }

    // Update miningAuthor if provided
    if (options?.miningAuthor !== undefined) {
      this.miningAuthor = options.miningAuthor;
    }

    // If accountsCount changed, need to recreate ServerManager
    if (options?.accountsCount !== undefined && options.accountsCount !== this.accountsCount) {
      console.log(`Updating accounts count from ${this.accountsCount} to ${options.accountsCount}`);
      this.accountsCount = Math.max(1, Math.min(20, options.accountsCount)); // Clamp 1-20

      // Recreate ServerManager with new accounts count
      const serverConfig: ServerConfig = {
        chainId: this._config.chainId,
        evmChainId: this._config.evmChainId,
        coreRpcPort: this._config.jsonrpcHttpPort,
        evmRpcPort: this._config.jsonrpcHttpEthPort,
        wsPort: this._config.jsonrpcWsPort,
        mnemonic: this._config.mnemonic,
        logging: this._config.log,
        accounts: this.accountsCount,
        balance: '10000',
        miningAuthor: this.miningAuthor,
        dataDir: this._config.dataDir,
      };
      
      this.serverManager = new ServerManager(serverConfig);
    } else if (this.miningAuthor) {
      // If only miningAuthor changed, recreate ServerManager
      console.log(`Setting mining author to: ${this.miningAuthor}`);
      const serverConfig: ServerConfig = {
        chainId: this._config.chainId,
        evmChainId: this._config.evmChainId,
        coreRpcPort: this._config.jsonrpcHttpPort,
        evmRpcPort: this._config.jsonrpcHttpEthPort,
        wsPort: this._config.jsonrpcWsPort,
        mnemonic: this._config.mnemonic,
        logging: this._config.log,
        accounts: this.accountsCount,
        balance: '10000',
        miningAuthor: this.miningAuthor,
        dataDir: this._config.dataDir,
      };
      
      this.serverManager = new ServerManager(serverConfig);
    }

    // Note: ServerManager doesn't support changing config after construction
    // Config options here are for future use / documentation
    if (options && !options.configChanged) {
      console.log('Starting node with options:', options);
    }
    
    await this.serverManager.start();
  }

  async stop(): Promise<void> {
    await this.serverManager.stop();
  }

  /**
   * Clear the blockchain data directory
   * Should be called while node is stopped
   */
  async clearData(): Promise<void> {
    const dataDir = this._config.dataDir || '/workspace/.conflux-dev';
    try {
      // Remove the data directory recursively
      await fs.rm(dataDir, { recursive: true, force: true });
      console.log(`Cleared data directory: ${dataDir}`);
    } catch (error) {
      console.error('Failed to clear data directory:', error);
      throw error;
    }
  }

  /**
   * Get the current data directory path
   */
  getDataDir(): string {
    return this._config.dataDir || '/workspace/.conflux-dev';
  }

  async getStatus(): Promise<{
    core: { status: string; connected: boolean };
    evm: { status: string; connected: boolean };
  }> {
    const serverStatus = this.serverManager.getStatus();
    const isRunning = serverStatus === 'running';

    return {
      core: {
        status: serverStatus,
        connected: isRunning,
      },
      evm: {
        status: serverStatus,
        connected: isRunning,
      },
    };
  }

  // ===== MINING CONTROL =====

  getMiningStatus(): MiningStatus {
    return this.serverManager.getMiningStatus();
  }

  async startMining(interval?: number): Promise<void> {
    await this.serverManager.startMining(interval);
  }

  async stopMining(): Promise<void> {
    await this.serverManager.stopMining();
  }

  async setMiningInterval(interval: number): Promise<void> {
    await this.serverManager.setMiningInterval(interval);
  }

  async mine(blocks: number = 1): Promise<void> {
    await this.serverManager.mine(blocks);
  }

  /**
   * Mine blocks with optional transaction packing
   * Uses the cive testClient for mining operations
   * @param blocks Number of blocks to mine (for empty blocks mode)
   * @param numTxs If provided, mine blocks that pack pending transactions
   */
  async mineBlocks(blocks: number = 1, numTxs?: number): Promise<void> {
    const rpcUrls = this.getRpcUrls();
    
    // Dynamically import cive test client
    const { createTestClient, http } = await import('cive');
    const testClient = createTestClient({
      transport: http(rpcUrls.core),
    });

    if (numTxs !== undefined) {
      // Mine blocks that pack transactions from txpool
      // This is essential for processing eSpace transactions
      await testClient.mine({ numTxs });
    } else {
      // Mine empty blocks (advances height only)
      await testClient.mine({ blocks });
    }
  }

  // ===== ACCOUNT MANAGEMENT =====

  /**
   * Get all accounts with their addresses
   */
  getAccounts(): Array<AccountInfo & { address: { core: string; evm: string } }> {
    const accounts = this.serverManager.getAccounts();
    return accounts.map((acc) => ({
      ...acc,
      address: {
        core: acc.coreAddress,
        evm: acc.evmAddress,
      },
    }));
  }

  /**
   * Get a specific account by index with wallet functionality
   */
  account(index: number): DevKitAccount {
    const accounts = this.serverManager.getAccounts();
    if (index < 0 || index >= accounts.length) {
      throw new Error(`Invalid account index: ${index}. Valid range: 0-${accounts.length - 1}`);
    }

    const acc = accounts[index];
    const rpcUrls = this.getRpcUrls();
    const corePrivKey = acc.privateKey as `0x${string}`;
    const evmPrivKey = (acc.evmPrivateKey || acc.privateKey) as `0x${string}`;

    // Create wallet clients lazily
    const coreAccount = corePrivateKeyToAccount(corePrivKey, {
      networkId: this._config.chainId || 2029,
    });
    const evmAccount = evmPrivateKeyToAccount(evmPrivKey);

    return {
      index: acc.index,
      privateKey: corePrivKey,
      evmPrivateKey: evmPrivKey,
      address: {
        core: acc.coreAddress,
        evm: acc.evmAddress,
      },
      core: {
        signMessage: async (message: string) => {
          // Use cive wallet client for signing
          const { createWalletClient: createCoreWalletClient } = await import('cive');
          const walletClient = createCoreWalletClient({
            account: coreAccount,
            transport: coreHttp(rpcUrls.core),
          });
          return await walletClient.signMessage({ message });
        },
      },
      evm: {
        signMessage: async (message: string) => {
          const walletClient = createWalletClient({
            account: evmAccount,
            transport: viemHttp(rpcUrls.evm),
          });
          return await walletClient.signMessage({ message });
        },
      },
      getBalance: async (chain: 'core' | 'evm'): Promise<string> => {
        if (chain === 'core') {
          const client = createCorePublicClient({
            transport: coreHttp(rpcUrls.core),
          });
          const balance = await client.getBalance({ address: acc.coreAddress as any });
          return formatCFX(balance);
        } else {
          const client = createPublicClient({
            transport: viemHttp(rpcUrls.evm),
          });
          const { formatUnits } = await import('viem');
          const balance = await client.getBalance({ address: acc.evmAddress as `0x${string}` });
          return formatUnits(balance, 18);
        }
      },
      transfer: async (to: string, value: string, chain: 'core' | 'evm'): Promise<string> => {
        if (chain === 'core') {
          const { createWalletClient: createCoreWalletClient, parseCFX } = await import('cive');
          const walletClient = createCoreWalletClient({
            account: coreAccount,
            transport: coreHttp(rpcUrls.core),
          });
          const hash = await walletClient.sendTransaction({
            to: to as any,
            value: parseCFX(value),
            chain: null,
          });
          return hash;
        } else {
          const { parseEther } = await import('viem');
          const walletClient = createWalletClient({
            account: evmAccount,
            transport: viemHttp(rpcUrls.evm),
          });
          const hash = await walletClient.sendTransaction({
            to: to as `0x${string}`,
            value: parseEther(value),
            chain: null,
          });
          return hash;
        }
      },
    };
  }

  // ===== FAUCET OPERATIONS =====

  /**
   * Get faucet/mining account (dedicated mining account with derivation path m/44'/503'/1'/0/0)
   * This is separate from genesis accounts and receives all mining rewards
   */
  async getFaucetAccount(): Promise<AccountInfo & { address: { core: string; evm: string } }> {
    // Get the actual mining account from ServerManager
    const miningAcc = this.serverManager.getFaucetAccount();
    return {
      ...miningAcc,
      address: {
        core: miningAcc.coreAddress,
        evm: miningAcc.evmAddress,
      },
    };
  }

  /**
   * Fund an account from faucet (uses mining account, not genesis account 0)
   * Uses proper address validation and auto-detects Core vs eSpace addresses
   */
  async fundAccount(address: string, amount: string): Promise<string> {
    // Get the actual mining/faucet account
    const faucet = await this.getFaucetAccount();
    console.log('fundAccount called:', { address, amount, faucetAddress: faucet.address });
    
    // Import address validators
    const { isAddress: isCoreAddress } = await import('cive/utils');
    const { isAddress: isEspaceAddress } = await import('viem');
    const { hexAddressToBase32, encodeFunctionData } = await import('cive/utils');
    
    const isCore = isCoreAddress(address);
    const isEspace = isEspaceAddress(address);
    
    if (!isCore && !isEspace) {
      throw new Error('Invalid address format (must be Core or eSpace address)');
    }
    
    const rpcUrls = this.getRpcUrls();
    const { createWalletClient: createCoreWalletClient, parseCFX, http: coreHttp } = await import('cive');
    const { privateKeyToAccount: corePrivateKeyToAccount } = await import('cive/accounts');
    
    const faucetCoreAccount = corePrivateKeyToAccount(faucet.privateKey as `0x${string}`, {
      networkId: this._config.chainId || 2029,
    });
    
    const walletClient = createCoreWalletClient({
      account: faucetCoreAccount,
      transport: coreHttp(rpcUrls.core),
    });
    
    if (isCore) {
      // Direct Core space transfer
      const hash = await walletClient.sendTransaction({
        to: address as any,
        value: parseCFX(amount),
        chain: null,
      });
      return hash;
    } else {
      // Cross-chain transfer to eSpace via internal contract
      const hash = await walletClient.sendTransaction({
        to: hexAddressToBase32({
          hexAddress: '0x0888000000000000000000000000000000000006',
          networkId: this._config.chainId || 2029,
        }) as any,
        value: parseCFX(amount),
        data: encodeFunctionData({
          abi: [
            {
              type: 'function',
              name: 'transferEVM',
              inputs: [{ name: 'to', type: 'bytes20' }],
              outputs: [{ name: 'output', type: 'bytes' }],
              stateMutability: 'payable',
            },
          ],
          functionName: 'transferEVM',
          args: [address as `0x${string}`],
        }) as `0x${string}`,
        chain: null,
      });
      return hash;
    }
  }

  /**
   * Get Ethereum admin address (first account's EVM address)
   */
  getEthereumAdminAddress(): string {
    const accounts = this.serverManager.getAccounts();
    if (accounts.length > 0 && accounts[0].evmAddress) {
      return accounts[0].evmAddress;
    }
    return '0x0000000000000000000000000000000000000000';
  }

  // ===== CONTRACT OPERATIONS =====

  /**
   * Deploy a contract
   */
  async deployContract(params: {
    abi: any[];
    bytecode: string;
    args?: any[];
    account?: number;
    chain: 'core' | 'evm';
  }): Promise<{ core?: string; evm?: string }> {
    const { abi, bytecode, args = [], account: accountIndex = 0, chain } = params;
    const acc = this.account(accountIndex);
    const rpcUrls = this.getRpcUrls();

    if (chain === 'evm') {
      const evmAccount = evmPrivateKeyToAccount(acc.evmPrivateKey);
      const walletClient = createWalletClient({
        account: evmAccount,
        transport: viemHttp(rpcUrls.evm),
      });

      const hash = await walletClient.deployContract({
        abi,
        bytecode: bytecode as `0x${string}`,
        args,
        chain: null,
      });

      // Wait for transaction receipt to get contract address
      const publicClient = createPublicClient({
        transport: viemHttp(rpcUrls.evm),
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return { evm: (receipt as any).contractAddress || undefined };
    } else {
      // Core deployment
      const { createWalletClient: createCoreWalletClient } = await import('cive');
      const coreAccount = corePrivateKeyToAccount(acc.privateKey, {
        networkId: this._config.chainId || 2029,
      });
      const walletClient = createCoreWalletClient({
        account: coreAccount,
        transport: coreHttp(rpcUrls.core),
      });

      const hash = await walletClient.deployContract({
        abi,
        bytecode: bytecode as `0x${string}`,
        args,
        chain: null,
      });

      // Wait for receipt
      const publicClient = createCorePublicClient({
        transport: coreHttp(rpcUrls.core),
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const coreContractAddress = (receipt as any).contractAddress || (receipt as any).contractCreated;
      return { core: coreContractAddress || undefined };
    }
  }

  /**
   * Read from a contract
   */
  async readContract(params: {
    address: string;
    abi: any[];
    functionName: string;
    args?: any[];
    chain: 'core' | 'evm';
  }): Promise<any> {
    const { address, abi, functionName, args = [], chain } = params;
    const rpcUrls = this.getRpcUrls();

    if (chain === 'evm') {
      const client = createPublicClient({
        transport: viemHttp(rpcUrls.evm),
      });
      return await client.readContract({
        address: address as `0x${string}`,
        abi,
        functionName,
        args,
      });
    } else {
      const client = createCorePublicClient({
        transport: coreHttp(rpcUrls.core),
      });
      return await client.readContract({
        address: address as any,
        abi,
        functionName,
        args,
      });
    }
  }

  /**
   * Write to a contract
   */
  async writeContract(params: {
    address: string;
    abi: any[];
    functionName: string;
    args?: any[];
    account?: number;
    chain: 'core' | 'evm';
  }): Promise<string> {
    const { address, abi, functionName, args = [], account: accountIndex = 0, chain } = params;
    const acc = this.account(accountIndex);
    const rpcUrls = this.getRpcUrls();

    if (chain === 'evm') {
      const evmAccount = evmPrivateKeyToAccount(acc.evmPrivateKey);
      const walletClient = createWalletClient({
        account: evmAccount,
        transport: viemHttp(rpcUrls.evm),
      });

      const hash = await walletClient.writeContract({
        address: address as `0x${string}`,
        abi,
        functionName,
        args,
        chain: null,
      });

      return hash;
    } else {
      const { createWalletClient: createCoreWalletClient } = await import('cive');
      const coreAccount = corePrivateKeyToAccount(acc.privateKey, {
        networkId: this._config.chainId || 2029,
      });
      const walletClient = createCoreWalletClient({
        account: coreAccount,
        transport: coreHttp(rpcUrls.core),
      });

      const hash = await walletClient.writeContract({
        address: address as any,
        abi,
        functionName,
        args,
        chain: null,
      });

      return hash;
    }
  }
}
