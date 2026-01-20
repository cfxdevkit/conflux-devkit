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
 * Keystore Service V2
 *
 * Complete rewrite for v2.0 with:
 * - Multi-admin support
 * - Per-mnemonic node configuration
 * - Encrypted mnemonic and derived keys storage
 * - Immutable node configuration
 * - No default test mnemonic
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { HDKey } from '@scure/bip32';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { privateKeyToAccount as civePrivateKeyToAccount } from 'cive/accounts';
import { bytesToHex } from 'viem';
import { privateKeyToAccount as viemPrivateKeyToAccount } from 'viem/accounts';
import type {
  AddMnemonicData,
  ConfigModificationCheck,
  DerivedAccount,
  KeystoreV2,
  MnemonicEntry,
  MnemonicSummary,
  NodeConfig,
  SetupData,
} from '../types/keystore';
import { logger } from '../utils/logger';
import { EncryptionService } from './encryption-service';

// Custom error for locked keystore
export class KeystoreLockedError extends Error {
  constructor(
    message: string = 'Keystore is locked. Please unlock with your password first.'
  ) {
    super(message);
    this.name = 'KeystoreLockedError';
  }
}

// Base data directory for all mnemonic-specific data
const BASE_DATA_DIR = process.env.DEVKIT_DATA_DIR || '/workspace/.conflux-dev';

// Keystore file path
const DEFAULT_KEYSTORE_PATH =
  process.env.DEVKIT_KEYSTORE_PATH || join(homedir(), '.devkit.keystore.json');

/**
 * KeystoreService V2
 */
export class KeystoreService {
  private keystorePath: string;
  private keystore: KeystoreV2 | null = null;
  private currentPassword: string | null = null;

  constructor(keystorePath: string = DEFAULT_KEYSTORE_PATH) {
    this.keystorePath = keystorePath;
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize keystore (load from disk or create empty)
   */
  async initialize(): Promise<void> {
    if (existsSync(this.keystorePath)) {
      await this.loadKeystore();
    } else {
      logger.info('Keystore file not found - fresh installation detected');
      this.keystore = null;
    }
  }

  /**
   * Load keystore from disk
   */
  private async loadKeystore(): Promise<void> {
    try {
      const data = readFileSync(this.keystorePath, 'utf-8');
      this.keystore = JSON.parse(data) as KeystoreV2;

      // Validate version
      if (this.keystore.version !== 2) {
        throw new Error(
          `Unsupported keystore version: ${this.keystore.version}. Expected version 2.`
        );
      }

      logger.info('Keystore loaded successfully');
    } catch (error) {
      logger.error('Failed to load keystore:', error);
      throw error;
    }
  }

  /**
   * Save keystore to disk
   */
  private async saveKeystore(): Promise<void> {
    if (!this.keystore) {
      throw new Error('Cannot save null keystore');
    }

    try {
      const data = JSON.stringify(this.keystore, null, 2);
      writeFileSync(this.keystorePath, data, 'utf-8');
      logger.info('Keystore saved successfully');
    } catch (error) {
      logger.error('Failed to save keystore:', error);
      throw error;
    }
  }

  // ===== SETUP & STATUS =====

  /**
   * Check if initial setup is completed
   */
  async isSetupCompleted(): Promise<boolean> {
    return this.keystore?.setupCompleted ?? false;
  }

  /**
   * Complete initial setup
   */
  async completeSetup(data: SetupData): Promise<void> {
    if (this.keystore?.setupCompleted) {
      throw new Error('Setup already completed');
    }

    logger.info('Completing initial setup...');

    // Generate salt if encryption enabled
    let encryptionSalt: Buffer | undefined;
    if (data.encryption?.enabled && data.encryption.password) {
      encryptionSalt = EncryptionService.generateSalt();
      this.currentPassword = data.encryption.password;
    }

    // Create mnemonic entry
    const mnemonicEntry = await this.createMnemonicEntry({
      mnemonic: data.mnemonic,
      label: data.mnemonicLabel,
      nodeConfig: {
        ...data.nodeConfig,
        miningAuthor: data.nodeConfig.miningAuthor || 'auto',
      },
      isFirstSetup: true,
      encryptionEnabled: data.encryption?.enabled ?? false,
      encryptionSalt,
    });

    // Create keystore v2
    this.keystore = {
      version: 2,
      setupCompleted: true,
      setupCompletedAt: new Date().toISOString(),
      adminAddresses: [data.adminAddress],
      encryptionEnabled: data.encryption?.enabled ?? false,
      encryptionSalt: encryptionSalt?.toString('base64'),
      mnemonics: [mnemonicEntry],
      activeIndex: 0,
    };

    await this.saveKeystore();

    logger.success('Initial setup completed successfully');
    logger.info(`Admin address: ${data.adminAddress}`);
    logger.info(`Wallet: ${data.mnemonicLabel}`);
    logger.info(
      `Encryption: ${data.encryption?.enabled ? 'Enabled' : 'Disabled'}`
    );
  }

  // ===== ADMIN MANAGEMENT =====

  /**
   * Get all admin addresses
   */
  async getAdminAddresses(): Promise<string[]> {
    this.ensureKeystoreLoaded();
    return [...this.keystore!.adminAddresses];
  }

  /**
   * Add admin address
   */
  async addAdminAddress(address: string): Promise<void> {
    this.ensureKeystoreLoaded();

    const normalized = address.toLowerCase();
    const exists = this.keystore!.adminAddresses.some(
      (addr) => addr.toLowerCase() === normalized
    );

    if (exists) {
      throw new Error('Admin address already exists');
    }

    this.keystore!.adminAddresses.push(address);
    await this.saveKeystore();

    logger.info(`Added admin address: ${address}`);
  }

  /**
   * Remove admin address
   */
  async removeAdminAddress(
    address: string,
    currentAdmin: string
  ): Promise<void> {
    this.ensureKeystoreLoaded();

    // Cannot remove self
    if (address.toLowerCase() === currentAdmin.toLowerCase()) {
      throw new Error('Cannot remove your own admin address');
    }

    // Must keep at least one admin
    if (this.keystore!.adminAddresses.length <= 1) {
      throw new Error('Cannot remove the last admin address');
    }

    const index = this.keystore!.adminAddresses.findIndex(
      (addr) => addr.toLowerCase() === address.toLowerCase()
    );

    if (index === -1) {
      throw new Error('Admin address not found');
    }

    this.keystore!.adminAddresses.splice(index, 1);
    await this.saveKeystore();

    logger.info(`Removed admin address: ${address}`);
  }

  /**
   * Check if address is admin
   */
  isAdmin(address: string): boolean {
    if (!this.keystore) return false;

    return this.keystore.adminAddresses.some(
      (admin) => admin.toLowerCase() === address.toLowerCase()
    );
  }

  // ===== MNEMONIC MANAGEMENT =====

  /**
   * Get active mnemonic entry
   */
  async getActiveMnemonic(): Promise<MnemonicEntry> {
    this.ensureKeystoreLoaded();

    const mnemonic = this.keystore!.mnemonics[this.keystore!.activeIndex];
    if (!mnemonic) {
      throw new Error('No active mnemonic found');
    }

    return mnemonic;
  }

  /**
   * Get mnemonic by ID
   */
  async getMnemonic(id: string): Promise<MnemonicEntry> {
    this.ensureKeystoreLoaded();

    const mnemonic = this.keystore!.mnemonics.find((m) => m.id === id);
    if (!mnemonic) {
      throw new Error(`Mnemonic not found: ${id}`);
    }

    return mnemonic;
  }

  /**
   * List all mnemonics (summary only)
   */
  async listMnemonics(): Promise<MnemonicSummary[]> {
    this.ensureKeystoreLoaded();

    return this.keystore!.mnemonics.map((m, index) => ({
      id: m.id,
      label: m.label,
      type: m.type,
      isActive: index === this.keystore!.activeIndex,
      createdAt: m.createdAt,
      nodeConfig: m.nodeConfig,
      dataDir: this.getDataDirForMnemonic(m.mnemonic),
      dataSize: this.getDataDirSize(this.getDataDirForMnemonic(m.mnemonic)),
    }));
  }

  /**
   * Add new mnemonic
   */
  async addMnemonic(data: AddMnemonicData): Promise<MnemonicEntry> {
    this.ensureKeystoreLoaded();

    // Check for duplicate label
    const exists = this.keystore!.mnemonics.some((m) => m.label === data.label);
    if (exists) {
      throw new Error(`Mnemonic with label "${data.label}" already exists`);
    }

    // Create mnemonic entry
    const mnemonicEntry = await this.createMnemonicEntry({
      mnemonic: data.mnemonic,
      label: data.label,
      nodeConfig: {
        ...data.nodeConfig,
        miningAuthor: data.nodeConfig.miningAuthor || 'auto',
      },
      isFirstSetup: false,
      encryptionEnabled: this.keystore!.encryptionEnabled,
      encryptionSalt: this.keystore!.encryptionSalt
        ? Buffer.from(this.keystore!.encryptionSalt, 'base64')
        : undefined,
    });

    this.keystore!.mnemonics.push(mnemonicEntry);

    // Set as active if requested
    if (data.setAsActive) {
      this.keystore!.activeIndex = this.keystore!.mnemonics.length - 1;
    }

    await this.saveKeystore();

    logger.info(`Added mnemonic: ${data.label}`);

    return mnemonicEntry;
  }

  /**
   * Switch active mnemonic
   */
  async switchActiveMnemonic(id: string): Promise<void> {
    this.ensureKeystoreLoaded();

    const index = this.keystore!.mnemonics.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Mnemonic not found: ${id}`);
    }

    this.keystore!.activeIndex = index;
    await this.saveKeystore();

    logger.info(
      `Switched to mnemonic: ${this.keystore!.mnemonics[index].label}`
    );
  }

  /**
   * Delete mnemonic and its data
   */
  async deleteMnemonic(id: string, deleteData: boolean = false): Promise<void> {
    this.ensureKeystoreLoaded();

    const index = this.keystore!.mnemonics.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Mnemonic not found: ${id}`);
    }

    // Cannot delete active mnemonic
    if (index === this.keystore!.activeIndex) {
      throw new Error(
        'Cannot delete active mnemonic. Switch to another mnemonic first.'
      );
    }

    const mnemonic = this.keystore!.mnemonics[index];

    // Delete data directory if requested
    if (deleteData) {
      const dataDir = this.getDataDirForMnemonic(mnemonic.mnemonic);
      if (existsSync(dataDir)) {
        // Check for lock file
        const lockFile = join(dataDir, 'node.lock');
        if (existsSync(lockFile)) {
          throw new Error('Cannot delete data while node is running');
        }

        rmSync(dataDir, { recursive: true, force: true });
        logger.info(`Deleted data directory: ${dataDir}`);
      }
    }

    // Remove from keystore
    this.keystore!.mnemonics.splice(index, 1);

    // Adjust active index if needed
    if (this.keystore!.activeIndex > index) {
      this.keystore!.activeIndex--;
    }

    await this.saveKeystore();

    logger.info(`Deleted mnemonic: ${mnemonic.label}`);
  }

  // ===== NODE CONFIGURATION =====

  /**
   * Get node configuration for a mnemonic
   */
  async getNodeConfig(mnemonicId: string): Promise<NodeConfig> {
    const mnemonic = await this.getMnemonic(mnemonicId);
    return mnemonic.nodeConfig;
  }

  /**
   * Check if node configuration can be modified
   */
  async canModifyNodeConfig(
    mnemonicId: string
  ): Promise<ConfigModificationCheck> {
    const mnemonic = await this.getMnemonic(mnemonicId);
    const dataDir = this.getDataDirForMnemonic(mnemonic.mnemonic);

    // Check if data directory exists
    if (!existsSync(dataDir)) {
      return {
        canModify: true,
      };
    }

    // Check if node is running (lock file exists)
    const lockFile = join(dataDir, 'node.lock');
    if (existsSync(lockFile)) {
      return {
        canModify: false,
        reason: 'Node is currently running',
        lockFile,
      };
    }

    // Data exists but node is stopped
    return {
      canModify: false,
      reason:
        'Data directory exists. Delete blockchain data to modify configuration.',
      dataDir,
    };
  }

  /**
   * Update node configuration
   */
  async updateNodeConfig(
    mnemonicId: string,
    config: Partial<NodeConfig>
  ): Promise<void> {
    const check = await this.canModifyNodeConfig(mnemonicId);
    if (!check.canModify) {
      throw new Error(check.reason);
    }

    this.ensureKeystoreLoaded();

    const index = this.keystore!.mnemonics.findIndex(
      (m) => m.id === mnemonicId
    );
    if (index === -1) {
      throw new Error(`Mnemonic not found: ${mnemonicId}`);
    }

    const mnemonic = this.keystore!.mnemonics[index];

    // Update configuration
    const newConfig: NodeConfig = {
      ...mnemonic.nodeConfig,
      ...config,
      immutable: true,
      configHash: '', // Will be recalculated
      createdAt: new Date().toISOString(),
    };

    // Recalculate config hash
    newConfig.configHash = await this.calculateConfigHash(newConfig);

    this.keystore!.mnemonics[index].nodeConfig = newConfig;

    await this.saveKeystore();

    logger.info(`Updated node config for: ${mnemonic.label}`);
  }

  /**
   * Delete blockchain data directory
   */
  async deleteNodeData(
    mnemonicId: string
  ): Promise<{ deletedDir: string; dataSize: string }> {
    const mnemonic = await this.getMnemonic(mnemonicId);
    const dataDir = this.getDataDirForMnemonic(mnemonic.mnemonic);

    if (!existsSync(dataDir)) {
      throw new Error('Data directory does not exist');
    }

    // Check for lock file
    const lockFile = join(dataDir, 'node.lock');
    if (existsSync(lockFile)) {
      throw new Error('Cannot delete data while node is running');
    }

    const dataSize = this.getDataDirSize(dataDir);

    rmSync(dataDir, { recursive: true, force: true });

    logger.info(`Deleted data directory: ${dataDir}`);

    return { deletedDir: dataDir, dataSize };
  }

  // ===== ENCRYPTION =====

  /**
   * Check if keystore is locked
   */
  isLocked(): boolean {
    if (!this.keystore || !this.keystore.encryptionEnabled) {
      return false;
    }

    return this.currentPassword === null;
  }

  /**
   * Check if encryption is enabled for the keystore
   */
  isEncryptionEnabled(): boolean {
    return this.keystore?.encryptionEnabled ?? false;
  }

  /**
   * Unlock keystore with password
   */
  async unlockKeystore(password: string): Promise<void> {
    if (!this.keystore || !this.keystore.encryptionEnabled) {
      throw new Error('Keystore is not encrypted');
    }

    // Verify password by trying to decrypt first mnemonic
    try {
      const firstMnemonic = this.keystore.mnemonics[0];
      if (firstMnemonic.type === 'encrypted') {
        const salt = Buffer.from(this.keystore.encryptionSalt!, 'base64');
        await EncryptionService.decrypt(firstMnemonic.mnemonic, password, salt);
      }

      this.currentPassword = password;
      logger.info('Keystore unlocked successfully');
    } catch (_error) {
      throw new Error('Invalid password');
    }
  }

  /**
   * Lock keystore (clear password from memory)
   */
  async lockKeystore(): Promise<void> {
    this.currentPassword = null;
    logger.info('Keystore locked');
  }

  /**
   * Get decrypted mnemonic
   */
  async getDecryptedMnemonic(mnemonicId: string): Promise<string> {
    const mnemonic = await this.getMnemonic(mnemonicId);

    if (mnemonic.type === 'plaintext') {
      return mnemonic.mnemonic;
    }

    // Encrypted - need password
    if (this.isLocked()) {
      throw new KeystoreLockedError();
    }

    const salt = Buffer.from(this.keystore?.encryptionSalt!, 'base64');
    return await EncryptionService.decrypt(
      mnemonic.mnemonic,
      this.currentPassword!,
      salt
    );
  }

  // ===== DERIVED KEYS & ACCOUNTS =====

  /**
   * Get genesis accounts for a mnemonic
   */
  async deriveGenesisAccounts(mnemonicId: string): Promise<DerivedAccount[]> {
    const mnemonicEntry = await this.getMnemonic(mnemonicId);

    // Check if already derived and stored
    if (mnemonicEntry.derivedKeys.type === 'plaintext') {
      return mnemonicEntry.derivedKeys.genesisAccounts as DerivedAccount[];
    }

    // Encrypted - need to decrypt
    if (this.isLocked()) {
      throw new KeystoreLockedError();
    }

    const salt = Buffer.from(this.keystore?.encryptionSalt!, 'base64');
    const decrypted = await EncryptionService.decryptObject<DerivedAccount[]>(
      mnemonicEntry.derivedKeys.genesisAccounts as string,
      this.currentPassword!,
      salt
    );

    return decrypted;
  }

  /**
   * Get faucet account for a mnemonic
   */
  async deriveFaucetAccount(mnemonicId: string): Promise<DerivedAccount> {
    const mnemonicEntry = await this.getMnemonic(mnemonicId);

    // Check if already derived and stored
    if (mnemonicEntry.derivedKeys.type === 'plaintext') {
      return mnemonicEntry.derivedKeys.faucetAccount as DerivedAccount;
    }

    // Encrypted - need to decrypt
    if (this.isLocked()) {
      throw new KeystoreLockedError();
    }

    const salt = Buffer.from(this.keystore?.encryptionSalt!, 'base64');
    const decrypted = await EncryptionService.decryptObject<DerivedAccount>(
      mnemonicEntry.derivedKeys.faucetAccount as string,
      this.currentPassword!,
      salt
    );

    return decrypted;
  }

  /**
   * Derive accounts from mnemonic (HD wallet derivation)
   * Returns accounts with both Core and eSpace private keys
   */
  async deriveAccountsFromMnemonic(
    mnemonic: string,
    _network: 'core' | 'espace', // Kept for API compatibility, both keys are always derived
    count: number,
    startIndex: number = 0,
    chainIdOverride?: number
  ): Promise<DerivedAccount[]> {
    const seed = mnemonicToSeedSync(mnemonic);
    const accounts: DerivedAccount[] = [];

    // Get chainId from override or active mnemonic
    let coreNetworkId: number;
    if (chainIdOverride !== undefined) {
      coreNetworkId = chainIdOverride;
    } else {
      const activeMnemonic = await this.getActiveMnemonic();
      coreNetworkId = activeMnemonic.nodeConfig.chainId;
    }

    for (let i = startIndex; i < startIndex + count; i++) {
      const corePath = `m/44'/503'/0'/0/${i}`;
      const evmPath = `m/44'/60'/0'/0/${i}`;

      const coreKey = HDKey.fromMasterSeed(seed).derive(corePath);
      const evmKey = HDKey.fromMasterSeed(seed).derive(evmPath);

      if (!coreKey.privateKey || !evmKey.privateKey) {
        throw new Error(`Failed to derive key at index ${i}`);
      }

      const corePrivateKey = bytesToHex(coreKey.privateKey);
      const evmPrivateKey = bytesToHex(evmKey.privateKey);

      const coreAccount = civePrivateKeyToAccount(
        corePrivateKey as `0x${string}`,
        {
          networkId: coreNetworkId,
        }
      );
      const evmAccount = viemPrivateKeyToAccount(
        evmPrivateKey as `0x${string}`
      );

      accounts.push({
        index: i,
        core: coreAccount.address,
        evm: evmAccount.address,
        privateKey: corePrivateKey, // Core Space private key (m/44'/503'/0'/0/i)
        evmPrivateKey: evmPrivateKey, // eSpace private key (m/44'/60'/0'/0/i)
      });
    }

    return accounts;
  }

  // ===== UTILITY METHODS =====

  /**
   * Get data directory for active mnemonic
   */
  async getDataDir(): Promise<string> {
    const mnemonic = await this.getActiveMnemonic();
    return this.getDataDirForMnemonic(mnemonic.mnemonic);
  }

  /**
   * Get data directory for specific mnemonic
   */
  private getDataDirForMnemonic(mnemonic: string): string {
    const hash = createHash('sha256').update(mnemonic).digest('hex');
    const shortHash = hash.substring(0, 16);
    return join(BASE_DATA_DIR, `wallet-${shortHash}`);
  }

  /**
   * Get mnemonic hash (for display)
   */
  async getMnemonicHash(): Promise<string> {
    const mnemonic = await this.getActiveMnemonic();
    const hash = createHash('sha256').update(mnemonic.mnemonic).digest('hex');
    return hash;
  }

  /**
   * Get active mnemonic label
   */
  getActiveLabel(): string {
    if (!this.keystore) return 'Unknown';
    const mnemonic = this.keystore.mnemonics[this.keystore.activeIndex];
    return mnemonic?.label || 'Unknown';
  }

  /**
   * Get active mnemonic index
   */
  getActiveIndex(): number {
    return this.keystore?.activeIndex ?? 0;
  }

  /**
   * Generate new BIP-39 mnemonic
   */
  generateMnemonic(): string {
    return generateMnemonic();
  }

  /**
   * Validate mnemonic format
   */
  validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic);
  }

  // ===== PRIVATE HELPERS =====

  /**
   * Ensure keystore is loaded
   */
  private ensureKeystoreLoaded(): void {
    if (!this.keystore) {
      throw new Error('Keystore not loaded. Complete initial setup first.');
    }
  }

  /**
   * Create a mnemonic entry with node config and derived keys
   */
  private async createMnemonicEntry(params: {
    mnemonic: string;
    label: string;
    nodeConfig: {
      accountsCount: number;
      chainId: number;
      evmChainId: number;
      miningAuthor: string;
    };
    isFirstSetup: boolean;
    encryptionEnabled: boolean;
    encryptionSalt?: Buffer;
  }): Promise<MnemonicEntry> {
    const { mnemonic, label, nodeConfig, encryptionEnabled, encryptionSalt } =
      params;

    const id = `mnemonic_${Date.now()}`;
    const createdAt = new Date().toISOString();

    // Derive genesis accounts (0 to accountsCount-1)
    // Pass chainId explicitly since during initial setup there's no active mnemonic yet
    const genesisAccounts = await this.deriveAccountsFromMnemonic(
      mnemonic,
      'espace',
      nodeConfig.accountsCount,
      0,
      nodeConfig.chainId
    );

    // Derive faucet account (accountsCount)
    const [faucetAccount] = await this.deriveAccountsFromMnemonic(
      mnemonic,
      'core',
      1,
      nodeConfig.accountsCount,
      nodeConfig.chainId
    );

    // Create node config with hash
    const config: NodeConfig = {
      ...nodeConfig,
      immutable: true,
      configHash: '', // Will be calculated
      createdAt,
    };

    config.configHash = await this.calculateConfigHash(config);

    // Encrypt mnemonic and derived keys if encryption enabled
    let encryptedMnemonic = mnemonic;
    let derivedKeys: MnemonicEntry['derivedKeys'];

    if (encryptionEnabled && encryptionSalt && this.currentPassword) {
      encryptedMnemonic = await EncryptionService.encrypt(
        mnemonic,
        this.currentPassword,
        encryptionSalt
      );

      const encryptedGenesis = await EncryptionService.encryptObject(
        genesisAccounts,
        this.currentPassword,
        encryptionSalt
      );

      const encryptedFaucet = await EncryptionService.encryptObject(
        faucetAccount,
        this.currentPassword,
        encryptionSalt
      );

      derivedKeys = {
        type: 'encrypted',
        genesisAccounts: encryptedGenesis,
        faucetAccount: encryptedFaucet,
      };
    } else {
      derivedKeys = {
        type: 'plaintext',
        genesisAccounts,
        faucetAccount,
      };
    }

    return {
      id,
      label,
      type: encryptionEnabled ? 'encrypted' : 'plaintext',
      mnemonic: encryptedMnemonic,
      createdAt,
      nodeConfig: config,
      derivedKeys,
    };
  }

  /**
   * Calculate config hash for integrity check
   */
  private async calculateConfigHash(config: NodeConfig): Promise<string> {
    const data = JSON.stringify({
      accountsCount: config.accountsCount,
      chainId: config.chainId,
      evmChainId: config.evmChainId,
      miningAuthor: config.miningAuthor,
    });

    return await EncryptionService.hash(data);
  }

  /**
   * Get data directory size (human-readable)
   */
  private getDataDirSize(dataDir: string): string {
    if (!existsSync(dataDir)) {
      return '0MB';
    }

    try {
      const stats = statSync(dataDir);
      const bytes = stats.size;

      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    } catch (_error) {
      return '0MB';
    }
  }
}

// Singleton instance
let instance: KeystoreService | null = null;

/**
 * Get singleton KeystoreService instance
 */
export function getKeystoreService(): KeystoreService {
  if (!instance) {
    instance = new KeystoreService();
  }
  return instance;
}

// Re-export types for backward compatibility
export type { DerivedAccount } from '../types/keystore.js';

// ============================================================================
// BACKWARD COMPATIBILITY METHODS (deprecated - will be removed in Phase 2)
// These methods exist to allow the old routes to compile while we migrate
// ============================================================================

// Add backward-compatible methods to the KeystoreService class
declare module './keystore-service.js' {
  interface KeystoreService {
    // Legacy getEntries - returns mnemonic summaries
    getEntries(): Promise<MnemonicSummary[]>;
    // Legacy getDataDirInfo
    getDataDirInfo(mnemonic?: string): Promise<{ path: string; size: string }>;
    // Legacy single admin methods
    getAdminAddress(): Promise<string | null>;
    getAdminPrivateKey(): Promise<string | null>;
    setAdminPrivateKey(privateKey: string): Promise<void>;
    resetAdminToDefault(): Promise<void>;
    // Legacy wallet status
    getWalletStatus(): Promise<{
      activeIndex: number;
      activeLabel: string;
      totalWallets: number;
    }>;
    // Legacy encryption methods
    isEncrypted(): boolean;
    enableEncryption(password: string): Promise<void>;
    disableEncryption(password: string): Promise<void>;
    unlock(password: string): Promise<void>;
    // Legacy mnemonic methods
    showActiveMnemonic(): Promise<string>;
    setActiveMnemonic(index: number): Promise<void>;
    updateLabel(index: number, label: string): Promise<void>;
    // Legacy derive methods
    deriveAccount(
      index: number,
      network: 'core' | 'espace'
    ): Promise<DerivedAccount>;
    deriveAccounts(
      count: number,
      network: 'core' | 'espace'
    ): Promise<DerivedAccount[]>;
  }
}

// Implement backward-compatible methods
KeystoreService.prototype.getEntries = async function (): Promise<
  MnemonicSummary[]
> {
  return await this.listMnemonics();
};

KeystoreService.prototype.getDataDirInfo = async function (
  _mnemonic?: string
): Promise<{ path: string; size: string }> {
  const path = await this.getDataDir();
  return { path, size: '0MB' }; // Size calculation removed for simplicity
};

KeystoreService.prototype.getAdminAddress = async function (): Promise<
  string | null
> {
  const admins = await this.getAdminAddresses();
  return admins.length > 0 ? admins[0] : null;
};

KeystoreService.prototype.getAdminPrivateKey = async (): Promise<
  string | null
> => {
  // V2 does not store admin private keys - admins are wallet addresses only
  logger.warn(
    'getAdminPrivateKey is deprecated - V2 does not store admin private keys'
  );
  return null;
};

KeystoreService.prototype.setAdminPrivateKey = async (
  _privateKey: string
): Promise<void> => {
  // V2 does not store admin private keys
  logger.warn('setAdminPrivateKey is deprecated - use addAdminAddress instead');
  throw new Error(
    'V2 does not support storing admin private keys. Use addAdminAddress(address) instead.'
  );
};

KeystoreService.prototype.resetAdminToDefault = async (): Promise<void> => {
  logger.warn('resetAdminToDefault is deprecated in V2');
  throw new Error('resetAdminToDefault is not supported in V2');
};

KeystoreService.prototype.getWalletStatus = async function (): Promise<{
  activeIndex: number;
  activeLabel: string;
  totalWallets: number;
}> {
  const mnemonics = await this.listMnemonics();
  const active = await this.getActiveMnemonic();
  const activeIndex = mnemonics.findIndex((m) => m.id === active.id);
  return {
    activeIndex,
    activeLabel: active.label,
    totalWallets: mnemonics.length,
  };
};

KeystoreService.prototype.isEncrypted = function (): boolean {
  // Use the public method instead of accessing private property
  return this.isEncryptionEnabled();
};

KeystoreService.prototype.enableEncryption = async (
  _password: string
): Promise<void> => {
  logger.warn(
    'enableEncryption is deprecated - encryption is set during setup'
  );
  throw new Error('Encryption must be configured during initial setup');
};

KeystoreService.prototype.disableEncryption = async (
  _password: string
): Promise<void> => {
  logger.warn(
    'disableEncryption is deprecated - encryption cannot be disabled'
  );
  throw new Error('Encryption cannot be disabled once enabled');
};

KeystoreService.prototype.unlock = async function (
  password: string
): Promise<void> {
  await this.unlockKeystore(password);
};

KeystoreService.prototype.showActiveMnemonic =
  async function (): Promise<string> {
    const active = await this.getActiveMnemonic();
    return await this.getDecryptedMnemonic(active.id);
  };

KeystoreService.prototype.setActiveMnemonic = async function (
  index: number
): Promise<void> {
  const mnemonics = await this.listMnemonics();
  if (index < 0 || index >= mnemonics.length) {
    throw new Error(`Invalid mnemonic index: ${index}`);
  }
  await this.switchActiveMnemonic(mnemonics[index].id);
};

KeystoreService.prototype.updateLabel = async (
  _index: number,
  _label: string
): Promise<void> => {
  logger.warn(
    'updateLabel is deprecated - labels are set during creation and cannot be changed'
  );
  throw new Error('Labels cannot be changed after creation in V2');
};

KeystoreService.prototype.deriveAccount = async function (
  index: number,
  network: 'core' | 'espace'
): Promise<DerivedAccount> {
  const active = await this.getActiveMnemonic();
  const mnemonic = await this.getDecryptedMnemonic(active.id);
  const accounts = await this.deriveAccountsFromMnemonic(
    mnemonic,
    network,
    1,
    index
  );
  return accounts[0];
};

KeystoreService.prototype.deriveAccounts = async function (
  count: number,
  network: 'core' | 'espace'
): Promise<DerivedAccount[]> {
  const active = await this.getActiveMnemonic();
  const mnemonic = await this.getDecryptedMnemonic(active.id);
  return await this.deriveAccountsFromMnemonic(mnemonic, network, count, 0);
};
