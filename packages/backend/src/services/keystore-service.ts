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
 * Keystore Service
 *
 * Manages HD wallet mnemonics with support for:
 * - Multiple mnemonics with labels
 * - Active mnemonic selection
 * - BIP-39 mnemonic generation
 * - BIP-32 key derivation for Core and eSpace
 */

import { HDKey } from '@scure/bip32';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { privateKeyToAccount as civePrivateKeyToAccount } from 'cive/accounts';
import { createHash, webcrypto } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { bytesToHex } from 'viem';
import { privateKeyToAccount as viemPrivateKeyToAccount } from 'viem/accounts';
import { logger } from '../utils/logger.js';

// Custom error for locked keystore
export class KeystoreLockedError extends Error {
  constructor(message: string = 'Keystore is locked. Please unlock with your password first.') {
    super(message);
    this.name = 'KeystoreLockedError';
  }
}

// Default hardhat mnemonic
const DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';

// Base data directory for all mnemonic-specific data
const BASE_DATA_DIR = '/workspace/.conflux-dev';

// Derivation paths
const ESPACE_PATH = "m/44'/60'/0'/0"; // Ethereum standard
const CORE_PATH = "m/44'/503'/0'/0";  // Conflux standard

export interface KeystoreEntry {
  type: 'plaintext' | 'encrypted';
  label: string;
  mnemonic: string;            // Base64 [salt+iv+data] for encrypted, plaintext otherwise
}

export interface KeystoreFile {
  version: number;             // Schema version
  keystore: KeystoreEntry[];
  activeIndex: number;
  adminPrivateKey?: string;    // Admin key (always plaintext, used for auth only)
  encryptionEnabled: boolean;  // Whether mnemonics are encrypted
}

export interface DerivedAccount {
  address: string;
  privateKey: string;
  path: string;
  index: number;
  network: 'core' | 'espace';
}

export class KeystoreService {
  private keystorePath: string;
  private keystore: KeystoreEntry[] = [];
  private activeIndex: number = 0;
  private adminPrivateKey: string | null = null;
  private encryptionEnabled: boolean = false;
  private encryptionPassword: string | null = null;
  private crypto: Crypto;

  constructor(keystorePath?: string) {
    this.keystorePath = keystorePath || join(homedir(), '.devkit.keystore.json');
    this.crypto = webcrypto as unknown as Crypto;
  }

  /**
   * Initialize the keystore - load existing or create default
   */
  async initialize(): Promise<void> {
    await this.loadKeystore();
    
    // If empty, add default mnemonic
    if (this.keystore.length === 0) {
      const defaultMnemonic = process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC || DEFAULT_MNEMONIC;
      await this.addMnemonic({
        mnemonic: defaultMnemonic,
        label: 'Default Wallet',
        setActive: true,
      });
      logger.info('Initialized keystore with default mnemonic');
    }
    
    // If no admin key set, use first account of first mnemonic
    // (Skip if keystore is encrypted and locked)
    if (!this.adminPrivateKey && this.keystore.length > 0) {
      try {
        const firstMnemonic = await this.getMnemonicByIndex(0);
        const account = await this.deriveAccount({ mnemonic: firstMnemonic, network: 'espace', index: 0 });
        await this.setAdminPrivateKey(account.privateKey);
        logger.info('Auto-set admin from first mnemonic');
      } catch (error) {
        if (this.encryptionEnabled && !this.encryptionPassword) {
          logger.warn('⚠️  Cannot auto-set admin: keystore is encrypted and locked');
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Load keystore from file
   */
  private async loadKeystore(): Promise<void> {
    try {
      if (existsSync(this.keystorePath)) {
        const data = readFileSync(this.keystorePath, 'utf-8');
        const parsed: KeystoreFile = JSON.parse(data);
        
        // Load keystore entries
        this.keystore = parsed.keystore || [];
        this.activeIndex = parsed.activeIndex ?? 0;
        
        // Load admin private key (stored unencrypted)
        if (parsed.adminPrivateKey) {
          this.adminPrivateKey = parsed.adminPrivateKey;
        }
        
        // Load encryption status
        this.encryptionEnabled = parsed.encryptionEnabled ?? false;
        
        logger.info(`Loaded keystore with ${this.keystore.length} entries (encryption: ${this.encryptionEnabled ? 'enabled' : 'disabled'})`);
      }
    } catch (error) {
      logger.warn('Failed to load keystore, starting fresh:', error);
      this.keystore = [];
      this.activeIndex = 0;
      this.adminPrivateKey = null;
      this.encryptionEnabled = false;
    }
  }

  /**
   * Save keystore to file
   */
  private async saveKeystore(): Promise<void> {
    try {
      const dir = dirname(this.keystorePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      const data: KeystoreFile = {
        version: 1,
        keystore: this.keystore,
        activeIndex: this.activeIndex,
        encryptionEnabled: this.encryptionEnabled,
      };
      
      // Add admin private key if set (always plaintext)
      if (this.adminPrivateKey) {
        data.adminPrivateKey = this.adminPrivateKey;
      }
      
      writeFileSync(this.keystorePath, JSON.stringify(data, null, 2));
      logger.info('Keystore saved');
    } catch (error) {
      logger.error('Failed to save keystore:', error);
      throw new Error('Failed to save keystore');
    }
  }

  /**
   * Get all keystore entries (without exposing mnemonics)
   */
  getEntries(): Array<{ index: number; label: string; type: string; isActive: boolean }> {
    return this.keystore.map((entry, index) => ({
      index,
      label: entry.label,
      type: entry.type,
      isActive: index === this.activeIndex,
    }));
  }

  /**
   * Get active mnemonic index
   */
  getActiveIndex(): number {
    return this.activeIndex;
  }

  /**
   * Get active mnemonic (for internal use)
   */
  async getActiveMnemonic(): Promise<string> {
    if (this.keystore.length === 0) {
      throw new Error('No mnemonic in keystore');
    }
    const index = this.activeIndex;
    return await this.getMnemonicByIndex(index);
  }

  /**
   * Get active mnemonic label
   */
  getActiveLabel(): string {
    if (this.keystore.length === 0) {
      return 'No wallet';
    }
    return this.keystore[this.activeIndex]?.label || this.keystore[0].label;
  }

  /**
   * Check if current mnemonic is the default test mnemonic
   */
  async isTestMnemonic(): Promise<boolean> {
    try {
      const activeMnemonic = await this.getActiveMnemonic();
      return activeMnemonic === DEFAULT_MNEMONIC;
    } catch {
      return false;
    }
  }

  /**
   * Check if a custom mnemonic has been set (not default test mnemonic)
   */
  async hasCustomMnemonic(): Promise<boolean> {
    return !(await this.isTestMnemonic());
  }

  /**
   * Get comprehensive wallet status for UI
   */
  async getWalletStatus(): Promise<{
    isTestMnemonic: boolean | null;
    hasCustomMnemonic: boolean | null;
    encryptionEnabled: boolean;
    isLocked: boolean;
    adminAddress: string | null;
    walletCount: number;
    activeWallet: string;
  }> {
    const isLocked = this.encryptionEnabled && !this.encryptionPassword;
    let isTest: boolean | null = null;
    
    // Only check test mnemonic if unlocked
    if (!isLocked) {
      isTest = await this.isTestMnemonic();
    }
    
    return {
      isTestMnemonic: isTest,
      hasCustomMnemonic: isTest !== null ? !isTest : null,
      encryptionEnabled: this.encryptionEnabled,
      isLocked,
      adminAddress: this.getAdminAddress(),
      walletCount: this.keystore.length,
      activeWallet: this.getActiveLabel(),
    };
  }

  /**
   * Generate a unique hash identifier for a mnemonic
   * Uses SHA-256 of the mnemonic to create a deterministic ID
   */
  async getMnemonicHash(mnemonic?: string): Promise<string> {
    const m = mnemonic || await this.getActiveMnemonic();
    const hash = createHash('sha256').update(m).digest('hex');
    // Return first 16 chars for readability while maintaining uniqueness
    return hash.substring(0, 16);
  }

  /**
   * Get the data directory path for the active mnemonic
   * Each mnemonic gets its own isolated data directory
   */
  async getDataDir(mnemonic?: string): Promise<string> {
    const hash = await this.getMnemonicHash(mnemonic);
    return join(BASE_DATA_DIR, `wallet-${hash}`);
  }

  /**
   * Get the data directory for a specific keystore entry by index
   */
  async getDataDirByIndex(index: number): Promise<string> {
    if (index < 0 || index >= this.keystore.length) {
      throw new Error('Invalid keystore index');
    }
    return this.getDataDir(this.keystore[index].mnemonic);
  }

  /**
   * Get data directory info for all wallets
   */
  async getDataDirInfo(): Promise<Array<{ index: number; label: string; dataDir: string; hash: string }>> {
    return Promise.all(this.keystore.map(async (entry, index) => ({
      index,
      label: entry.label,
      dataDir: await this.getDataDir(entry.mnemonic),
      hash: await this.getMnemonicHash(entry.mnemonic),
    })));
  }

  /**
   * Generate a new mnemonic
   */
  generateMnemonic(): string {
    return generateMnemonic();
  }

  /**
   * Validate a mnemonic phrase
   */
  validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic);
  }

  /**
   * Add a new mnemonic to the keystore
   */
  async addMnemonic(options: {
    mnemonic?: string;
    label?: string;
    setActive?: boolean;
  }): Promise<{ index: number; label: string }> {
    const mnemonic = options.mnemonic || this.generateMnemonic();
    
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const label = options.label || `Wallet ${this.keystore.length + 1}`;
    
    // Derive admin address (first account)
    const seed = mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const path = `${ESPACE_PATH}/0`;
    const child = hdKey.derive(path);
    const privateKey = bytesToHex(child.privateKey!);
    const account = viemPrivateKeyToAccount(privateKey as `0x${string}`);
    const adminAddress = account.address.toLowerCase();
    
    // Create entry
    const entry: KeystoreEntry = {
      type: this.encryptionEnabled ? 'encrypted' : 'plaintext',
      label,
      mnemonic,
    };
    
    // Encrypt if encryption is enabled
    if (this.encryptionEnabled && this.encryptionPassword) {
      entry.mnemonic = await this.encrypt(mnemonic, this.encryptionPassword);
    }
    
    this.keystore.push(entry);

    const newIndex = this.keystore.length - 1;
    
    if (options.setActive) {
      this.activeIndex = newIndex;
    }

    await this.saveKeystore();
    logger.info(`Added new mnemonic: ${label} (admin: ${adminAddress})`);

    return { index: newIndex, label };
  }

  /**
   * Delete a mnemonic from the keystore
   */
  async deleteMnemonic(index: number): Promise<void> {
    if (index < 0 || index >= this.keystore.length) {
      throw new Error('Invalid mnemonic index');
    }

    if (index === 0) {
      throw new Error('Cannot delete the default mnemonic');
    }

    this.keystore.splice(index, 1);

    // Update active index if needed
    if (this.activeIndex >= this.keystore.length) {
      this.activeIndex = 0;
    } else if (this.activeIndex > index) {
      this.activeIndex--;
    }

    await this.saveKeystore();
    logger.info(`Deleted mnemonic at index ${index}`);
  }

  /**
   * Set active mnemonic by index
   */
  async setActiveMnemonic(index: number): Promise<void> {
    if (index < 0 || index >= this.keystore.length) {
      throw new Error('Invalid mnemonic index');
    }

    this.activeIndex = index;
    await this.saveKeystore();
    logger.info(`Set active mnemonic to index ${index}: ${this.keystore[index].label}`);
  }

  /**
   * Update mnemonic label
   */
  async updateLabel(index: number, label: string): Promise<void> {
    if (index < 0 || index >= this.keystore.length) {
      throw new Error('Invalid mnemonic index');
    }

    this.keystore[index].label = label;
    await this.saveKeystore();
  }

  /**
   * Derive private key from mnemonic
   */
  async derivePrivateKey(options: {
    mnemonic?: string;
    network: 'core' | 'espace';
    index?: number;
    customPath?: string;
  }): Promise<string> {
    const mnemonic = options.mnemonic || await this.getActiveMnemonic();
    const index = options.index ?? 0;
    
    let path: string;
    if (options.customPath) {
      path = options.customPath;
    } else {
      const basePath = options.network === 'core' ? CORE_PATH : ESPACE_PATH;
      path = `${basePath}/${index}`;
    }

    const seed = mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derived = hdKey.derive(path);
    
    if (!derived.privateKey) {
      throw new Error('Failed to derive private key');
    }

    return bytesToHex(derived.privateKey);
  }

  /**
   * Derive account (address + private key)
   */
  async deriveAccount(options: {
    mnemonic?: string;
    network: 'core' | 'espace';
    index?: number;
    customPath?: string;
  }): Promise<DerivedAccount> {
    const index = options.index ?? 0;
    const network = options.network;
    
    const basePath = network === 'core' ? CORE_PATH : ESPACE_PATH;
    const path = options.customPath || `${basePath}/${index}`;
    
    const privateKey = await this.derivePrivateKey({
      mnemonic: options.mnemonic,
      network,
      index,
      customPath: options.customPath,
    });

    let address: string;
    if (network === 'espace') {
      const account = viemPrivateKeyToAccount(privateKey as `0x${string}`);
      address = account.address;
    } else {
      // Core space uses different address format
      const account = civePrivateKeyToAccount(privateKey as `0x${string}`, { networkId: 1029 });
      address = account.address;
    }

    return {
      address,
      privateKey,
      path,
      index,
      network,
    };
  }

  /**
   * Derive multiple accounts
   */
  async deriveAccounts(options: {
    mnemonic?: string;
    network: 'core' | 'espace';
    count?: number;
    startIndex?: number;
  }): Promise<DerivedAccount[]> {
    const count = options.count ?? 10;
    const startIndex = options.startIndex ?? 0;
    const accounts: DerivedAccount[] = [];

    for (let i = 0; i < count; i++) {
      accounts.push(await this.deriveAccount({
        mnemonic: options.mnemonic,
        network: options.network,
        index: startIndex + i,
      }));
    }

    return accounts;
  }

  /**
   * Show active mnemonic (requires explicit confirmation)
   */
  async showActiveMnemonic(confirmed: boolean = false): Promise<string | null> {
    if (!confirmed) {
      return null;
    }
    return this.getActiveMnemonic();
  }

  // ===== ENCRYPTION METHODS =====

  /**
   * Derive encryption key from password using PBKDF2
   * Matches reference implementation: 100k iterations, SHA-256
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await this.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return this.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: Buffer.from(salt) as any,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt mnemonic using AES-GCM with PBKDF2 key derivation
   * Returns base64 encoded [salt + iv + encrypted data]
   */
  private async encrypt(mnemonic: string, password: string): Promise<string> {
    const iv = this.crypto.getRandomValues(new Uint8Array(12));
    const salt = this.crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(password, salt);
    
    const encrypted = await this.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(mnemonic)
    );
    
    // Combine salt + iv + encrypted data
    const encryptedData = new Uint8Array([
      ...salt,
      ...iv,
      ...new Uint8Array(encrypted)
    ]);
    
    return Buffer.from(encryptedData).toString('base64');
  }

  /**
   * Decrypt mnemonic using AES-GCM with PBKDF2 key derivation
   * Expects base64 encoded [salt + iv + encrypted data]
   */
  private async decrypt(encryptedMnemonic: string, password: string): Promise<string> {
    const encryptedBytes = Buffer.from(encryptedMnemonic, 'base64');
    const salt = encryptedBytes.subarray(0, 16);
    const iv = encryptedBytes.subarray(16, 28);
    const data = encryptedBytes.subarray(28);
    
    const key = await this.deriveKey(password, salt);
    const decrypted = await this.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  }

  /**
   * Enable encryption for the keystore
   * This will encrypt all existing plaintext mnemonics
   */
  async enableEncryption(password: string): Promise<void> {
    if (this.encryptionEnabled) {
      throw new Error('Encryption is already enabled');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    this.encryptionPassword = password;
    this.encryptionEnabled = true;

    // Encrypt all existing plaintext mnemonics
    for (const entry of this.keystore) {
      if (entry.type === 'plaintext') {
        entry.mnemonic = await this.encrypt(entry.mnemonic, password);
        entry.type = 'encrypted';
      }
    }

    await this.saveKeystore();
    logger.info('Encryption enabled for keystore');
  }

  /**
   * Disable encryption for the keystore
   * This will decrypt all encrypted mnemonics
   */
  async disableEncryption(password: string): Promise<void> {
    if (!this.encryptionEnabled) {
      throw new Error('Encryption is not enabled');
    }

    // Verify password by trying to decrypt first entry
    if (this.keystore.length > 0 && this.keystore[0].type === 'encrypted') {
      try {
        await this.decrypt(this.keystore[0].mnemonic, password);
      } catch {
        throw new Error('Invalid password');
      }
    }

    // Decrypt all encrypted mnemonics
    for (const entry of this.keystore) {
      if (entry.type === 'encrypted') {
        entry.mnemonic = await this.decrypt(entry.mnemonic, password);
        entry.type = 'plaintext';
      }
    }

    this.encryptionEnabled = false;
    this.encryptionPassword = null;

    await this.saveKeystore();
    logger.info('Encryption disabled for keystore');
  }

  /**
   * Unlock encrypted keystore with password
   */
  async unlock(password: string): Promise<boolean> {
    if (!this.encryptionEnabled) {
      return true; // Already unlocked
    }

    // Verify password by trying to decrypt first mnemonic
    if (this.keystore.length > 0 && this.keystore[0].type === 'encrypted') {
      try {
        await this.decrypt(this.keystore[0].mnemonic, password);
        this.encryptionPassword = password;
        logger.info('Keystore unlocked');
        return true;
      } catch {
        logger.warn('Failed to unlock keystore: invalid password');
        return false;
      }
    }

    return true;
  }

  /**
   * Check if keystore is encrypted
   */
  isEncrypted(): boolean {
    return this.encryptionEnabled;
  }

  /**
   * Check if keystore is unlocked (for encrypted keystores)
   */
  isUnlocked(): boolean {
    if (!this.encryptionEnabled) {
      return true;
    }
    return this.encryptionPassword !== null;
  }

  // ===== ADMIN WALLET METHODS =====

  /**
   * Set admin private key (independent from active mnemonic)
   */
  async setAdminPrivateKey(privateKey: string): Promise<void> {
    // Validate private key format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error('Invalid private key format');
    }

    this.adminPrivateKey = privateKey;
    await this.saveKeystore();
    logger.info('Admin private key set');
  }

  /**
   * Get admin private key
   */
  /**
   * Get admin private key (always stored plaintext)
   */
  getAdminPrivateKey(): string | null {
    return this.adminPrivateKey;
  }

  /**
   * Get admin address derived from admin private key
   */
  getAdminAddress(): string | null {
    const privateKey = this.getAdminPrivateKey();
    if (!privateKey) {
      return null;
    }

    try {
      const account = viemPrivateKeyToAccount(privateKey as `0x${string}`);
      return account.address.toLowerCase();
    } catch {
      return null;
    }
  }

  /**
   * Reset admin to first account of default mnemonic
   */
  async resetAdminToDefault(): Promise<void> {
    if (this.keystore.length === 0) {
      throw new Error('No mnemonics in keystore');
    }

    const defaultMnemonic = await this.getActiveMnemonic();
    const account = await this.deriveAccount({ mnemonic: defaultMnemonic, network: 'espace', index: 0 });
    await this.setAdminPrivateKey(account.privateKey);
    logger.info('Admin reset to first account of active mnemonic');
  }

  /**
   * Get admin address for a specific mnemonic (first derived account)
   */
  async getMnemonicAdmin(index: number): Promise<string> {
    if (index < 0 || index >= this.keystore.length) {
      throw new Error('Invalid keystore index');
    }

    // Always derive fresh - no caching
    const mnemonic = await this.getMnemonicByIndex(index);
    const seed = mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const path = `${ESPACE_PATH}/0`;
    const child = hdKey.derive(path);
    const privateKey = bytesToHex(child.privateKey!);
    const account = viemPrivateKeyToAccount(privateKey as `0x${string}`);
    
    return account.address.toLowerCase();
  }

  /**
   * Get mnemonic by index (handles decryption if needed)
   */
  private async getMnemonicByIndex(index: number): Promise<string> {
    const entry = this.keystore[index];
    if (!entry) {
      throw new Error('Invalid keystore index');
    }

    if (entry.type === 'encrypted') {
      if (!this.encryptionPassword) {
        throw new KeystoreLockedError();
      }
      return await this.decrypt(entry.mnemonic, this.encryptionPassword);
    }

    return entry.mnemonic;
  }
}

// Singleton instance
let keystoreInstance: KeystoreService | null = null;

export function getKeystoreService(): KeystoreService {
  if (!keystoreInstance) {
    keystoreInstance = new KeystoreService();
  }
  return keystoreInstance;
}

export async function initializeKeystoreService(): Promise<KeystoreService> {
  const service = getKeystoreService();
  await service.initialize();
  return service;
}
