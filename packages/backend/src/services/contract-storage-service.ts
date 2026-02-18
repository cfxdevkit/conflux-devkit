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
 * Contract Storage Service
 *
 * Provides persistent storage for deployed contracts.
 * Contracts are stored in network-specific JSON files:
 * - Local network: stored in wallet's data directory (wallet-specific)
 * - Testnet/Mainnet: stored in shared directory (global)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { logger } from '../utils/logger.js';

export type NetworkType = 'local' | 'testnet' | 'mainnet';

export interface StoredContract {
  id: string;
  name: string;
  address: string;
  chain: 'evm' | 'core';
  chainId: number;
  network: NetworkType;
  deployedAt: string;
  deployer: string;
  transactionHash: string;
  abi: unknown[];
  constructorArgs: unknown[];
  // Additional metadata
  bytecodeHash?: string;
  source?: string;
  compilerVersion?: string;
  // Wallet identifier (for local network contracts)
  walletId?: string;
}

interface ContractStore {
  version: number;
  network: NetworkType;
  contracts: StoredContract[];
  updatedAt: string;
}

// Default storage path
const DEFAULT_STORAGE_DIR =
  process.env.DEVKIT_DATA_DIR || '/workspace/.conflux-dev';

function getContractsFilename(network: NetworkType): string {
  return `deployed-contracts-${network}.json`;
}

/**
 * Contract Storage Service for persistent contract tracking
 *
 * Network-aware storage:
 * - Local network: Contracts stored in wallet-specific directory
 * - Testnet/Mainnet: Contracts stored in shared global directory
 */
export class ContractStorageService {
  private baseDir: string;
  private currentNetwork: NetworkType = 'local';
  private walletDataDir: string | null = null;
  private contracts: Map<string, StoredContract> = new Map();
  private initialized = false;

  constructor(baseDir: string = DEFAULT_STORAGE_DIR) {
    this.baseDir = baseDir;
  }

  /**
   * Set the current network context
   */
  setNetwork(network: NetworkType, walletDataDir?: string): void {
    const networkChanged = network !== this.currentNetwork;
    const walletChanged = walletDataDir !== this.walletDataDir;

    if (networkChanged || walletChanged) {
      this.currentNetwork = network;
      this.walletDataDir = walletDataDir || null;
      // Reset initialized flag to reload contracts for new context
      this.initialized = false;
      this.contracts.clear();
      logger.info(
        `Contract storage context changed: network=${network}, walletDir=${walletDataDir || 'global'}`
      );
    }
  }

  /**
   * Get current network
   */
  getNetwork(): NetworkType {
    return this.currentNetwork;
  }

  /**
   * Get the storage path for the current network context
   */
  private getStoragePath(): string {
    const filename = getContractsFilename(this.currentNetwork);

    if (this.currentNetwork === 'local' && this.walletDataDir) {
      // Local network contracts are stored in the wallet's data directory
      return join(this.walletDataDir, filename);
    }

    // Testnet/Mainnet contracts are stored in the shared base directory
    return join(this.baseDir, filename);
  }

  /**
   * Initialize the storage service - load contracts from disk
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const storagePath = this.getStoragePath();

    try {
      // Ensure directory exists
      const dir = dirname(storagePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Load existing contracts
      if (existsSync(storagePath)) {
        const data = readFileSync(storagePath, 'utf-8');
        const store: ContractStore = JSON.parse(data);

        if (store.contracts && Array.isArray(store.contracts)) {
          for (const contract of store.contracts) {
            this.contracts.set(contract.id, contract);
          }
          logger.info(
            `Loaded ${this.contracts.size} deployed contracts from storage (network=${this.currentNetwork})`
          );
        }
      } else {
        logger.info(
          `No existing contract storage found for ${this.currentNetwork} - starting fresh`
        );
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize contract storage:', error);
      // Start with empty storage on error
      this.contracts.clear();
      this.initialized = true;
    }
  }

  /**
   * Save contracts to disk
   */
  private async save(): Promise<void> {
    const storagePath = this.getStoragePath();

    try {
      const store: ContractStore = {
        version: 1,
        network: this.currentNetwork,
        contracts: Array.from(this.contracts.values()),
        updatedAt: new Date().toISOString(),
      };

      // Ensure directory exists
      const dir = dirname(storagePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(storagePath, JSON.stringify(store, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save contract storage:', error);
      throw error;
    }
  }

  /**
   * Add a deployed contract to storage
   * Automatically sets the network field to current network context
   */
  async addContract(
    contract: Omit<StoredContract, 'network'> & { network?: NetworkType }
  ): Promise<StoredContract> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Ensure network is set to current context
    const storedContract: StoredContract = {
      ...contract,
      network: contract.network || this.currentNetwork,
    };

    this.contracts.set(storedContract.id, storedContract);
    await this.save();

    logger.info(
      `Contract stored: ${storedContract.name} at ${storedContract.address} (${storedContract.chain}, network=${storedContract.network})`
    );

    return storedContract;
  }

  /**
   * Get a contract by ID
   */
  async getContract(id: string): Promise<StoredContract | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.contracts.get(id);
  }

  /**
   * Get a contract by address and chain
   */
  async getContractByAddress(
    address: string,
    chain: 'evm' | 'core'
  ): Promise<StoredContract | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }

    const normalizedAddress = address.toLowerCase();
    for (const contract of this.contracts.values()) {
      if (
        contract.chain === chain &&
        contract.address.toLowerCase() === normalizedAddress
      ) {
        return contract;
      }
    }

    return undefined;
  }

  /**
   * Get all contracts, optionally filtered by chain
   */
  async getAllContracts(chain?: 'evm' | 'core'): Promise<StoredContract[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const contracts = Array.from(this.contracts.values());

    if (chain) {
      return contracts.filter((c) => c.chain === chain);
    }

    // Sort by deployment time (newest first)
    return contracts.sort(
      (a, b) =>
        new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    );
  }

  /**
   * Delete a contract from storage
   */
  async deleteContract(id: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const deleted = this.contracts.delete(id);
    if (deleted) {
      await this.save();
      logger.info(`Contract removed from storage: ${id}`);
    }

    return deleted;
  }

  /**
   * Clear all contracts from storage
   */
  async clearAllContracts(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.contracts.clear();
    await this.save();
    logger.info('All contracts cleared from storage');
  }

  /**
   * Get contract count
   */
  getContractCount(): number {
    return this.contracts.size;
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let contractStorageInstance: ContractStorageService | null = null;

/**
 * Get the contract storage service instance
 */
export function getContractStorageService(): ContractStorageService {
  if (!contractStorageInstance) {
    contractStorageInstance = new ContractStorageService();
  }
  return contractStorageInstance;
}

/**
 * Initialize contract storage with network context
 * Should be called when network changes or on startup
 */
export async function initializeContractStorage(
  network: NetworkType,
  walletDataDir?: string
): Promise<ContractStorageService> {
  const service = getContractStorageService();
  service.setNetwork(network, walletDataDir);
  await service.initialize();
  return service;
}

/**
 * Reset the contract storage service (for testing)
 */
export function resetContractStorageService(): void {
  contractStorageInstance = null;
}
