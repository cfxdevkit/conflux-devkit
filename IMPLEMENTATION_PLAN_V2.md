# Conflux DevKit v2.0 - Complete Refactor Implementation Plan

**Date:** 2026-01-18
**Status:** Ready for Implementation
**Breaking Changes:** YES - Full reset, no backward compatibility

---

## Executive Summary

This plan details a complete refactor of Conflux DevKit to implement:
- **Mandatory initial setup wizard** (no default test mnemonic)
- **Multi-admin address management** (equal rights, wallet signature-based)
- **Immutable per-mnemonic node configuration** (locked after creation)
- **Reorganized UI** (merged Dashboard, expanded Configuration)
- **Enhanced security** (encrypted mnemonics + derived keys)
- **CLI parity** (same functionality as web UI)

**Key Principle:** No operations allowed until initial setup is complete.

---

## Table of Contents

1. [User Stories & Requirements](#1-user-stories--requirements)
2. [Data Model Changes](#2-data-model-changes)
3. [Backend Architecture](#3-backend-architecture)
4. [API Endpoints](#4-api-endpoints)
5. [Frontend Components](#5-frontend-components)
6. [CLI Implementation](#6-cli-implementation)
7. [Security Model](#7-security-model)
8. [Migration Strategy](#8-migration-strategy)
9. [Testing Strategy](#9-testing-strategy)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. User Stories & Requirements

### 1.1 Initial Setup Flow (Fresh Install)

**US-001: First-Time User Setup (Web UI)**
```
AS A new user
WHEN I visit the DevKit web UI for the first time
THEN I am presented with a setup wizard
AND I cannot access any node operations until setup is complete
```

**Steps:**
1. **Connect Wallet**: Sign message to prove ownership
2. **Set Admin Address**: First address becomes primary admin
3. **Create/Import Mnemonic**: Generate new or import existing (with encryption option)
4. **Configure Node**: Set accounts count, chain IDs, mining author
5. **Complete**: System ready, node can be started

**US-002: First-Time User Setup (CLI)**
```
AS A developer using CLI
WHEN I run the backend without a keystore
THEN I am prompted to complete setup via interactive CLI
AND the setup flow matches the web UI functionality
```

### 1.2 Multi-Admin Management

**US-003: Add Additional Admin**
```
AS AN admin user
WHEN I add a new admin address
THEN that address gains full admin rights
AND can perform all node control operations
```

**US-004: Remove Admin**
```
AS AN admin user
WHEN I attempt to remove an admin address
THEN the system prevents removing the currently logged-in admin
AND requires at least one admin to remain
```

### 1.3 Mnemonic & Node Configuration

**US-005: Immutable Node Configuration**
```
AS A user
WHEN I create a mnemonic with node configuration
THEN that configuration cannot be modified while data exists
AND changing config requires explicit data deletion confirmation
```

**US-006: Multiple Mnemonics**
```
AS A user
WHEN I add multiple mnemonics
THEN each mnemonic has its own isolated blockchain state
AND I can switch between them (node stopped)
```

**US-007: Wallet Switching**
```
AS A user
WHEN I switch the active mnemonic
THEN the node restarts with the new wallet's blockchain state
AND all derived accounts and balances reflect the new chain
```

### 1.4 UI/UX Reorganization

**US-008: Unified Dashboard**
```
AS A user
WHEN I view the Dashboard tab
THEN I see node status, monitoring, and quick actions in one view
AND can switch active wallet if node is stopped
```

**US-009: Centralized Configuration**
```
AS A user
WHEN I open the Configuration tab
THEN I see all settings: wallets, node configs, and admin addresses
AND can manage the entire system from one place
```

### 1.5 Security & Encryption

**US-010: Encrypted Storage**
```
AS A user
WHEN I enable encryption during setup
THEN all mnemonics and derived private keys are encrypted
AND I must enter password to unlock for operations
```

**US-011: Admin Authentication**
```
AS AN admin user
WHEN I perform admin operations
THEN my wallet address is validated against the admin list
AND I must sign challenges to prove ownership
```

---

## 2. Data Model Changes

### 2.1 Keystore Schema v2

**File:** `~/.devkit.keystore.json`

**Current (v1):**
```json
{
  "version": 1,
  "keystore": [
    {
      "type": "plaintext",
      "label": "Default Wallet",
      "mnemonic": "test test test..."
    }
  ],
  "activeIndex": 0,
  "adminPrivateKey": "0x...",
  "encryptionEnabled": false
}
```

**New (v2):**
```json
{
  "version": 2,
  "setupCompleted": true,
  "setupCompletedAt": "2026-01-18T12:00:00.000Z",

  "adminAddresses": [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  ],

  "encryptionEnabled": true,
  "encryptionSalt": "base64...",

  "mnemonics": [
    {
      "id": "mnemonic_1737204800000",
      "label": "Production",
      "type": "encrypted",
      "mnemonic": "base64[iv+encryptedData]",
      "createdAt": "2026-01-18T12:00:00.000Z",

      "nodeConfig": {
        "accountsCount": 10,
        "chainId": 2029,
        "evmChainId": 2030,
        "miningAuthor": "auto",
        "immutable": true,
        "configHash": "sha256(...)",
        "createdAt": "2026-01-18T12:00:00.000Z"
      },

      "derivedKeys": {
        "type": "encrypted",
        "genesisAccounts": "base64[iv+encryptedData]",
        "faucetAccount": "base64[iv+encryptedData]"
      }
    },
    {
      "id": "mnemonic_1737205000000",
      "label": "Testing",
      "type": "plaintext",
      "mnemonic": "word1 word2 word3...",
      "createdAt": "2026-01-18T12:03:20.000Z",

      "nodeConfig": {
        "accountsCount": 5,
        "chainId": 2029,
        "evmChainId": 2030,
        "miningAuthor": "auto",
        "immutable": true,
        "configHash": "sha256(...)",
        "createdAt": "2026-01-18T12:03:20.000Z"
      },

      "derivedKeys": {
        "type": "plaintext",
        "genesisAccounts": [
          {"index": 0, "core": "0x...", "evm": "0x...", "privateKey": "0x..."},
          {"index": 1, "core": "0x...", "evm": "0x...", "privateKey": "0x..."}
        ],
        "faucetAccount": {
          "index": 10,
          "core": "0x...",
          "evm": "0x...",
          "privateKey": "0x..."
        }
      }
    }
  ],

  "activeIndex": 0
}
```

### 2.2 TypeScript Interfaces

**File:** `packages/backend/src/types/keystore.ts` (NEW)

```typescript
export interface KeystoreV2 {
  version: 2;
  setupCompleted: boolean;
  setupCompletedAt?: string; // ISO 8601 timestamp

  adminAddresses: string[]; // Ethereum addresses (0x...)

  encryptionEnabled: boolean;
  encryptionSalt?: string; // Base64, only if encryptionEnabled

  mnemonics: MnemonicEntry[];
  activeIndex: number;
}

export interface MnemonicEntry {
  id: string; // Unique ID: "mnemonic_{timestamp}"
  label: string; // User-friendly name
  type: 'plaintext' | 'encrypted';
  mnemonic: string; // Plaintext or "base64[iv+data]"
  createdAt: string; // ISO 8601

  nodeConfig: NodeConfig;
  derivedKeys: DerivedKeys;
}

export interface NodeConfig {
  accountsCount: number; // 1-20
  chainId: number; // Core Space chain ID (default 2029)
  evmChainId: number; // eSpace chain ID (default 2030)
  miningAuthor: 'auto' | string; // 'auto' = account[accountsCount], or explicit address
  immutable: boolean; // Always true after creation
  configHash: string; // SHA-256 of config for integrity check
  createdAt: string; // ISO 8601
}

export interface DerivedKeys {
  type: 'plaintext' | 'encrypted';
  genesisAccounts: DerivedAccount[] | string; // Array if plaintext, base64 if encrypted
  faucetAccount: DerivedAccount | string; // Object if plaintext, base64 if encrypted
}

export interface DerivedAccount {
  index: number;
  core: string; // Core Space address (net2029:...)
  evm: string; // eSpace address (0x...)
  privateKey: string; // 0x...
}

export interface EncryptedData {
  iv: string; // Base64 initialization vector
  data: string; // Base64 encrypted data
}
```

### 2.3 Data Directory Structure

```
~/.conflux-dev/
├─ wallet-a1b2c3d4/          # Hash of mnemonic #0
│  ├─ node_data/             # Blockchain state
│  └─ node.lock              # Lock file (created when node running)
│
├─ wallet-e5f6g7h8/          # Hash of mnemonic #1
│  ├─ node_data/
│  └─ node.lock
│
└─ .keystore.json            # Main keystore file (v2 schema)
```

**Lock File:** Prevents data deletion while node running
```json
{
  "mnemonicId": "mnemonic_1737204800000",
  "nodeStartedAt": "2026-01-18T12:00:00.000Z",
  "pid": 12345
}
```

---

## 3. Backend Architecture

### 3.1 Service Layer Changes

#### 3.1.1 KeystoreService Refactor

**File:** `packages/backend/src/services/keystore-service.ts`

**New Methods:**

```typescript
class KeystoreService {
  // Setup & Initialization
  async isSetupCompleted(): Promise<boolean>
  async completeSetup(data: SetupData): Promise<void>

  // Admin Management
  async getAdminAddresses(): Promise<string[]>
  async addAdminAddress(address: string): Promise<void>
  async removeAdminAddress(address: string, currentAdmin: string): Promise<void>
  isAdmin(address: string): boolean

  // Mnemonic Management
  async addMnemonic(data: AddMnemonicData): Promise<MnemonicEntry>
  async getMnemonic(id: string): Promise<MnemonicEntry>
  async listMnemonics(): Promise<MnemonicSummary[]>
  async deleteMnemonic(id: string): Promise<void>
  async switchActiveMnemonic(id: string): Promise<void>

  // Node Configuration
  async getNodeConfig(mnemonicId: string): Promise<NodeConfig>
  async canModifyNodeConfig(mnemonicId: string): Promise<boolean>
  async updateNodeConfig(mnemonicId: string, config: Partial<NodeConfig>): Promise<void>
  async deleteNodeData(mnemonicId: string): Promise<void>

  // Encryption
  async enableEncryption(password: string): Promise<void>
  async disableEncryption(password: string): Promise<void>
  async unlockKeystore(password: string): Promise<void>
  async lockKeystore(): Promise<void>
  isLocked(): boolean

  // Derived Keys
  async deriveGenesisAccounts(mnemonicId: string): Promise<DerivedAccount[]>
  async deriveFaucetAccount(mnemonicId: string): Promise<DerivedAccount>
  async getDecryptedMnemonic(mnemonicId: string): Promise<string>
}
```

**Setup Data Interface:**
```typescript
interface SetupData {
  adminAddress: string; // First admin address
  mnemonic: string; // Generated or imported
  mnemonicLabel: string;
  nodeConfig: {
    accountsCount: number;
    chainId: number;
    evmChainId: number;
    miningAuthor?: string; // Optional, defaults to 'auto'
  };
  encryption?: {
    enabled: boolean;
    password?: string; // Required if enabled=true
  };
}
```

**Add Mnemonic Data Interface:**
```typescript
interface AddMnemonicData {
  mnemonic: string;
  label: string;
  nodeConfig: {
    accountsCount: number;
    chainId: number;
    evmChainId: number;
    miningAuthor?: string;
  };
  setAsActive?: boolean; // Default false
}
```

#### 3.1.2 SetupService (NEW)

**File:** `packages/backend/src/services/setup-service.ts`

```typescript
export class SetupService {
  constructor(
    private keystoreService: KeystoreService,
    private authService: DevelopmentAuthService
  ) {}

  /**
   * Check if initial setup is required
   */
  async isSetupRequired(): Promise<boolean> {
    return !(await this.keystoreService.isSetupCompleted());
  }

  /**
   * Validate setup data before persisting
   */
  async validateSetupData(data: SetupData): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate admin address
    if (!isAddress(data.adminAddress)) {
      errors.push('Invalid admin address format');
    }

    // Validate mnemonic
    if (!validateMnemonic(data.mnemonic)) {
      errors.push('Invalid BIP-39 mnemonic');
    }

    // Validate node config
    if (data.nodeConfig.accountsCount < 1 || data.nodeConfig.accountsCount > 20) {
      errors.push('Account count must be between 1 and 20');
    }

    // Warn about chain ID conflicts
    const warnings = this.checkChainIdConflicts(
      data.nodeConfig.chainId,
      data.nodeConfig.evmChainId
    );

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Complete initial setup
   */
  async completeSetup(data: SetupData): Promise<{
    success: boolean;
    mnemonicId: string;
    dataDir: string;
  }> {
    // Validate first
    const validation = await this.validateSetupData(data);
    if (!validation.valid) {
      throw new Error(`Setup validation failed: ${validation.errors.join(', ')}`);
    }

    // Persist to keystore
    await this.keystoreService.completeSetup(data);

    // Get active mnemonic info
    const mnemonic = await this.keystoreService.getActiveMnemonic();
    const dataDir = await this.keystoreService.getDataDir();

    return {
      success: true,
      mnemonicId: mnemonic.id,
      dataDir
    };
  }

  /**
   * Check for chain ID conflicts with known networks
   */
  private checkChainIdConflicts(chainId: number, evmChainId: number): string[] {
    const warnings: string[] = [];

    const knownChainIds: Record<number, string> = {
      1: 'Ethereum Mainnet',
      1029: 'Conflux Core Space Mainnet',
      1030: 'Conflux eSpace Mainnet',
      71: 'Conflux Core Space Testnet',
      11155111: 'Ethereum Sepolia Testnet'
    };

    if (knownChainIds[chainId]) {
      warnings.push(`Chain ID ${chainId} conflicts with ${knownChainIds[chainId]}`);
    }

    if (knownChainIds[evmChainId]) {
      warnings.push(`EVM Chain ID ${evmChainId} conflicts with ${knownChainIds[evmChainId]}`);
    }

    return warnings;
  }
}
```

#### 3.1.3 DevKitManager Updates

**File:** `packages/backend/src/devkit-manager.ts`

**Changes:**

```typescript
export class DevKitManager {
  // ... existing code ...

  /**
   * Initialize with setup check
   */
  async initialize(): Promise<void> {
    // Check if setup is completed
    const setupCompleted = await this.keystoreService.isSetupCompleted();
    if (!setupCompleted) {
      logger.warn('⚠️  Initial setup not completed - node operations disabled');
      this.devkit = null; // No DevKit instance until setup
      return;
    }

    // Existing initialization logic...
    const activeMnemonic = await this.keystoreService.getActiveMnemonic();
    const dataDir = await this.keystoreService.getDataDir();

    logger.info(`Initializing DevKit with wallet: ${activeMnemonic.label}`);
    logger.info(`Data directory: ${dataDir}`);

    const config: DevKitConfig = {
      mnemonic: await this.keystoreService.getDecryptedMnemonic(activeMnemonic.id),
      dataDir: dataDir,
      chainId: activeMnemonic.nodeConfig.chainId,
      evmChainId: activeMnemonic.nodeConfig.evmChainId,
      accountsCount: activeMnemonic.nodeConfig.accountsCount,
      // ... rest of config
    };

    this.devkit = new DevKitCompatClass(config);
    logger.success(`DevKit instance created with wallet: ${activeMnemonic.label}`);
  }

  /**
   * Check if DevKit is ready for operations
   */
  isReady(): boolean {
    return this.devkit !== null;
  }

  /**
   * Get DevKit instance (throws if not ready)
   */
  getDevKit(): DevKitCompat {
    if (!this.devkit) {
      throw new Error('DevKit not initialized - complete initial setup first');
    }
    return this.devkit;
  }

  /**
   * Switch mnemonic with config validation
   */
  async switchMnemonic(mnemonicId: string): Promise<{
    success: boolean;
    nodeRestarted: boolean;
    activeLabel: string;
    dataDir: string;
  }> {
    // Get target mnemonic
    const targetMnemonic = await this.keystoreService.getMnemonic(mnemonicId);

    // Check if node is running BEFORE creating new instance
    const wasRunning = this.devkit ? await this.isNodeRunning() : false;
    const wasMining = wasRunning && (await this.isMining());

    logger.info(`Switching to mnemonic: ${targetMnemonic.label}`);
    logger.info(`Node status BEFORE switch - Running: ${wasRunning}, Mining: ${wasMining}`);

    // Stop node if running
    if (wasRunning && this.devkit) {
      logger.info('Stopping node before mnemonic switch...');
      try {
        await this.devkit.stop();
        logger.success('Node stopped successfully');
      } catch (error) {
        logger.warn('Failed to stop node gracefully:', error);
      }
    }

    // Update keystore active index
    await this.keystoreService.switchActiveMnemonic(mnemonicId);

    // Get decrypted mnemonic and config
    const mnemonic = await this.keystoreService.getDecryptedMnemonic(mnemonicId);
    const dataDir = await this.keystoreService.getDataDir();
    const nodeConfig = targetMnemonic.nodeConfig;

    logger.info(`Switched to wallet: ${targetMnemonic.label}`);
    logger.info(`New data directory: ${dataDir}`);

    // Create new DevKit instance with node config
    const newConfig: DevKitConfig = {
      mnemonic: mnemonic,
      dataDir: dataDir,
      chainId: nodeConfig.chainId,
      evmChainId: nodeConfig.evmChainId,
      accountsCount: nodeConfig.accountsCount,
      // ... rest of config
    };

    this.devkit = new DevKitCompatClass(newConfig);
    logger.success('DevKit instance recreated with new wallet');

    // Notify listeners
    if (this.updateCallback) {
      this.updateCallback(this.devkit);
      logger.info('DevKit instance reference updated in dependent services');
    }

    let nodeRestarted = false;

    // Restart node if it was running
    if (wasRunning) {
      logger.info('Restarting node with new wallet configuration...');
      try {
        await this.devkit.start({
          configChanged: true, // Clear data on wallet switch
        });
        logger.success('Node restarted successfully');

        if (wasMining) {
          logger.info('Mining automatically restored by node startup');
        }

        nodeRestarted = true;
      } catch (error) {
        logger.error('Failed to restart node:', error);
        throw new Error(`Failed to restart node: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      nodeRestarted,
      activeLabel: targetMnemonic.label,
      dataDir: dataDir,
    };
  }
}
```

#### 3.1.4 AuthService Updates

**File:** `packages/backend/src/auth/DevelopmentAuthService.ts`

**Changes:**

```typescript
export class DevelopmentAuthService {
  // ... existing code ...

  /**
   * Resolve admin addresses from keystore (multi-admin support)
   */
  private async resolveAdminAddresses(): Promise<string[]> {
    const keystoreService = getKeystoreService();

    // Check if setup is completed
    const setupCompleted = await keystoreService.isSetupCompleted();
    if (!setupCompleted) {
      // Development mode: allow test accounts as admins before setup
      if (this.isDevelopment) {
        logger.warn('⚠️  Setup not completed - using development test accounts as admins');
        return this.testAccounts;
      }

      // Production mode: no admins until setup
      logger.warn('⚠️  Setup not completed - no admin addresses available');
      return [];
    }

    // Get admin addresses from keystore
    const adminAddresses = await keystoreService.getAdminAddresses();

    // Development mode: add test accounts to admin list
    if (this.isDevelopment) {
      const allAdmins = [...new Set([...adminAddresses, ...this.testAccounts])];
      logger.info(`Admin addresses (dev mode): ${allAdmins.join(', ')}`);
      return allAdmins;
    }

    logger.info(`Admin addresses: ${adminAddresses.join(', ')}`);
    return adminAddresses;
  }

  /**
   * Check if address is admin (updated for multi-admin)
   */
  async isAdmin(address: string): Promise<boolean> {
    const adminAddresses = await this.resolveAdminAddresses();
    return adminAddresses.some(
      admin => admin.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Initialize with setup check
   */
  async initialize(): Promise<void> {
    // Resolve admin addresses (handles setup state)
    this.adminAddresses = await this.resolveAdminAddresses();

    // Auto-connect in development if test account
    if (this.isDevelopment && this.config.autoConnectDev && this.adminAddresses.length > 0) {
      const devAddress = this.adminAddresses[0];
      const sessionId = this.generateSessionId();

      this.sessions.set(sessionId, {
        sessionId,
        address: devAddress,
        isAdmin: true,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.sessionTimeout,
      });

      logger.info('🔧 Development session created automatically:', {
        address: devAddress,
        sessionId: `${sessionId.substring(0, 8)}...`,
        expires: new Date(Date.now() + this.sessionTimeout).toLocaleString(),
      });
    }
  }
}
```

### 3.2 Middleware Updates

**File:** `packages/backend/src/middleware/setup-check.ts` (NEW)

```typescript
import { Request, Response, NextFunction } from 'express';
import { getKeystoreService } from '../services/keystore-service';

/**
 * Middleware to check if initial setup is completed
 * Blocks node-related endpoints if setup not done
 */
export async function requireSetup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const keystoreService = getKeystoreService();
  const setupCompleted = await keystoreService.isSetupCompleted();

  if (!setupCompleted) {
    return res.status(503).json({
      error: 'Setup required',
      message: 'Initial setup must be completed before accessing this endpoint',
      setupEndpoint: '/api/setup/status',
    });
  }

  next();
}

/**
 * List of endpoints that should be accessible before setup
 */
export const SETUP_EXEMPT_ROUTES = [
  '/health',
  '/api/setup/status',
  '/api/setup/validate',
  '/api/setup/complete',
  '/api/auth/challenge',
  '/api/auth/verify',
  '/api/auth/session',
];

/**
 * Apply setup check middleware selectively
 */
export function applySetupCheck(app: Express): void {
  app.use((req, res, next) => {
    // Allow exempt routes
    if (SETUP_EXEMPT_ROUTES.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Check setup for all other routes
    requireSetup(req, res, next);
  });
}
```

---

## 4. API Endpoints

### 4.1 Setup Endpoints

#### GET /api/setup/status

**Purpose:** Check if initial setup is required

**Auth:** None (public)

**Response:**
```json
{
  "setupRequired": true,
  "version": 2,
  "keystoreExists": false
}
```

or

```json
{
  "setupRequired": false,
  "version": 2,
  "keystoreExists": true,
  "setupCompletedAt": "2026-01-18T12:00:00.000Z",
  "adminCount": 2,
  "mnemonicCount": 3,
  "encryptionEnabled": true
}
```

#### POST /api/setup/validate

**Purpose:** Validate setup data before submission

**Auth:** None (public)

**Request:**
```json
{
  "adminAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "mnemonic": "word1 word2 word3...",
  "mnemonicLabel": "Production",
  "nodeConfig": {
    "accountsCount": 10,
    "chainId": 2029,
    "evmChainId": 2030,
    "miningAuthor": "auto"
  },
  "encryption": {
    "enabled": true,
    "password": "securePassword123"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Chain ID 1029 conflicts with Conflux Core Space Mainnet"
  ]
}
```

#### POST /api/setup/complete

**Purpose:** Complete initial setup and create keystore

**Auth:** None (public, but requires valid signature in production)

**Request:**
```json
{
  "adminAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "signature": "0xabcd...", // Signature of setup challenge (production only)
  "mnemonic": "word1 word2 word3...",
  "mnemonicLabel": "Production",
  "nodeConfig": {
    "accountsCount": 10,
    "chainId": 2029,
    "evmChainId": 2030,
    "miningAuthor": "auto"
  },
  "encryption": {
    "enabled": true,
    "password": "securePassword123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "mnemonicId": "mnemonic_1737204800000",
  "dataDir": "/workspace/.conflux-dev/wallet-a1b2c3d4",
  "message": "Setup completed successfully"
}
```

### 4.2 Admin Management Endpoints

#### GET /api/devkit/admin/list

**Purpose:** List all admin addresses

**Auth:** Required (admin only)

**Response:**
```json
{
  "admins": [
    {
      "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "isPrimary": true,
      "addedAt": "2026-01-18T12:00:00.000Z"
    },
    {
      "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "isPrimary": false,
      "addedAt": "2026-01-18T13:00:00.000Z"
    }
  ]
}
```

#### POST /api/devkit/admin/add

**Purpose:** Add a new admin address

**Auth:** Required (admin only)

**Request:**
```json
{
  "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "signature": "0xabcd..." // Signature from new admin proving ownership
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "message": "Admin address added successfully"
}
```

#### DELETE /api/devkit/admin/remove

**Purpose:** Remove an admin address

**Auth:** Required (admin only)

**Request:**
```json
{
  "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin address removed successfully"
}
```

**Error (cannot remove self):**
```json
{
  "error": "Cannot remove current admin",
  "message": "You cannot remove your own admin address"
}
```

### 4.3 Mnemonic Management Endpoints

#### GET /api/devkit/wallet/list

**Purpose:** List all mnemonics with summaries

**Auth:** Required

**Response:**
```json
{
  "mnemonics": [
    {
      "id": "mnemonic_1737204800000",
      "label": "Production",
      "type": "encrypted",
      "isActive": true,
      "createdAt": "2026-01-18T12:00:00.000Z",
      "nodeConfig": {
        "accountsCount": 10,
        "chainId": 2029,
        "evmChainId": 2030,
        "miningAuthor": "auto",
        "immutable": true
      },
      "dataDir": "/workspace/.conflux-dev/wallet-a1b2c3d4",
      "dataSize": "125MB"
    },
    {
      "id": "mnemonic_1737205000000",
      "label": "Testing",
      "type": "plaintext",
      "isActive": false,
      "createdAt": "2026-01-18T12:03:20.000Z",
      "nodeConfig": {
        "accountsCount": 5,
        "chainId": 2029,
        "evmChainId": 2030,
        "miningAuthor": "auto",
        "immutable": true
      },
      "dataDir": "/workspace/.conflux-dev/wallet-e5f6g7h8",
      "dataSize": "0MB"
    }
  ],
  "activeIndex": 0
}
```

#### POST /api/devkit/wallet/add

**Purpose:** Add a new mnemonic with node configuration

**Auth:** Required (admin only)

**Request:**
```json
{
  "mnemonic": "word1 word2 word3...",
  "label": "Development",
  "nodeConfig": {
    "accountsCount": 15,
    "chainId": 2029,
    "evmChainId": 2030,
    "miningAuthor": "0x..." // Optional, defaults to 'auto'
  },
  "setAsActive": false
}
```

**Response:**
```json
{
  "success": true,
  "mnemonicId": "mnemonic_1737206000000",
  "label": "Development",
  "dataDir": "/workspace/.conflux-dev/wallet-i9j0k1l2",
  "message": "Mnemonic added successfully"
}
```

#### POST /api/devkit/wallet/switch

**Purpose:** Switch active mnemonic (node must be stopped)

**Auth:** Required (admin only)

**Request:**
```json
{
  "mnemonicId": "mnemonic_1737205000000"
}
```

**Response:**
```json
{
  "success": true,
  "activeLabel": "Testing",
  "dataDir": "/workspace/.conflux-dev/wallet-e5f6g7h8",
  "message": "Switched to Testing"
}
```

**Error (node running):**
```json
{
  "error": "Node is running",
  "message": "Stop the node before switching mnemonics"
}
```

#### DELETE /api/devkit/wallet/delete

**Purpose:** Delete a mnemonic and its data

**Auth:** Required (admin only)

**Request:**
```json
{
  "mnemonicId": "mnemonic_1737205000000",
  "deleteData": true // Confirm data deletion
}
```

**Response:**
```json
{
  "success": true,
  "deletedDataDir": "/workspace/.conflux-dev/wallet-e5f6g7h8",
  "dataSize": "125MB",
  "message": "Mnemonic and blockchain data deleted successfully"
}
```

**Error (is active):**
```json
{
  "error": "Cannot delete active mnemonic",
  "message": "Switch to another mnemonic before deleting"
}
```

### 4.4 Node Configuration Endpoints

#### GET /api/devkit/node/config/:mnemonicId

**Purpose:** Get node configuration for a mnemonic

**Auth:** Required

**Response:**
```json
{
  "mnemonicId": "mnemonic_1737204800000",
  "config": {
    "accountsCount": 10,
    "chainId": 2029,
    "evmChainId": 2030,
    "miningAuthor": "auto",
    "immutable": true,
    "configHash": "abc123...",
    "createdAt": "2026-01-18T12:00:00.000Z"
  },
  "canModify": false,
  "reason": "Data directory exists - delete data to modify config"
}
```

#### PUT /api/devkit/node/config/:mnemonicId

**Purpose:** Update node configuration (only if no data exists)

**Auth:** Required (admin only)

**Request:**
```json
{
  "accountsCount": 15,
  "chainId": 2031,
  "evmChainId": 2032
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Node configuration updated",
  "newConfigHash": "def456..."
}
```

**Error (immutable):**
```json
{
  "error": "Configuration is immutable",
  "message": "Data directory exists. Delete blockchain data to modify configuration.",
  "dataDir": "/workspace/.conflux-dev/wallet-a1b2c3d4"
}
```

#### DELETE /api/devkit/node/data/:mnemonicId

**Purpose:** Delete blockchain data directory

**Auth:** Required (admin only)

**Request:**
```json
{
  "confirm": true
}
```

**Response:**
```json
{
  "success": true,
  "deletedDir": "/workspace/.conflux-dev/wallet-a1b2c3d4",
  "dataSize": "125MB",
  "message": "Blockchain data deleted. Configuration can now be modified."
}
```

**Error (node running):**
```json
{
  "error": "Node is running",
  "message": "Stop the node before deleting data",
  "lockFile": "/workspace/.conflux-dev/wallet-a1b2c3d4/node.lock"
}
```

### 4.5 Updated Existing Endpoints

#### POST /api/devkit/node/start

**Changes:**
- No longer accepts `accountsCount`, `chainId`, `evmChainId` parameters
- Uses node config from active mnemonic
- Returns config info in response

**New Response:**
```json
{
  "message": "Node started successfully",
  "status": {
    "core": {"status": "running", "connected": true},
    "evm": {"status": "running", "connected": true}
  },
  "config": {
    "accountsCount": 10,
    "chainId": 2029,
    "evmChainId": 2030,
    "miningAuthor": "0x..."
  }
}
```

---

## 5. Frontend Components

### 5.1 Setup Wizard

**File:** `packages/frontend/src/components/SetupWizard.tsx` (NEW)

**Component Structure:**

```tsx
export function SetupWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [setupData, setSetupData] = useState<Partial<SetupData>>({});

  return (
    <Container size="md" py="xl">
      <Paper shadow="md" p="xl" radius="md">
        <Stepper active={step - 1} breakpoint="sm">
          <Stepper.Step label="Connect Wallet" description="Sign to verify ownership">
            <Step1ConnectWallet onNext={(address, signature) => {
              setSetupData({ ...setupData, adminAddress: address, signature });
              setStep(2);
            }} />
          </Stepper.Step>

          <Stepper.Step label="Admin Setup" description="Configure admin access">
            <Step2AdminSetup
              currentAdmin={setupData.adminAddress!}
              onNext={() => setStep(3)}
            />
          </Stepper.Step>

          <Stepper.Step label="Create Wallet" description="Generate or import mnemonic">
            <Step3CreateWallet onNext={(mnemonic, label, enableEncryption, password) => {
              setSetupData({
                ...setupData,
                mnemonic,
                mnemonicLabel: label,
                encryption: { enabled: enableEncryption, password }
              });
              setStep(4);
            }} />
          </Stepper.Step>

          <Stepper.Step label="Node Config" description="Configure blockchain settings">
            <Step4NodeConfig onNext={(nodeConfig) => {
              setSetupData({ ...setupData, nodeConfig });
              setStep(5);
            }} />
          </Stepper.Step>

          <Stepper.Step label="Complete" description="Review and finish">
            <Step5Complete
              setupData={setupData as SetupData}
              onComplete={() => {
                // Setup complete - reload app
                window.location.reload();
              }}
            />
          </Stepper.Step>
        </Stepper>
      </Paper>
    </Container>
  );
}
```

**Step 1: Connect Wallet**

```tsx
function Step1ConnectWallet({ onNext }: { onNext: (address: string, signature: string) => void }) {
  const { address, signMessage } = useAccount();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Get challenge from backend
      const { message, nonce } = await apiClient.getAuthChallenge(address);

      // Sign challenge
      const signature = await signMessage({ message });

      // Verify signature
      await apiClient.verifyAuth(address, signature);

      onNext(address, signature);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to authenticate wallet',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Text>Connect your wallet to become the first admin of this DevKit instance.</Text>

      {!address ? (
        <ConnectButton />
      ) : (
        <>
          <Alert icon={<IconWallet />} color="blue">
            Connected as: <Code>{address}</Code>
          </Alert>

          <Button
            onClick={handleConnect}
            loading={loading}
            leftSection={<IconSignature />}
          >
            Sign to Continue
          </Button>
        </>
      )}
    </Stack>
  );
}
```

**Step 2: Admin Setup**

```tsx
function Step2AdminSetup({ currentAdmin, onNext }: { currentAdmin: string; onNext: () => void }) {
  return (
    <Stack gap="md">
      <Alert icon={<IconShield />} color="green">
        Admin address set: <Code>{currentAdmin}</Code>
      </Alert>

      <Text size="sm" c="dimmed">
        You can add additional admin addresses later in the Configuration tab.
      </Text>

      <Group justify="flex-end">
        <Button onClick={onNext}>Continue</Button>
      </Group>
    </Stack>
  );
}
```

**Step 3: Create Wallet**

```tsx
function Step3CreateWallet({
  onNext
}: {
  onNext: (mnemonic: string, label: string, enableEncryption: boolean, password?: string) => void
}) {
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [mnemonic, setMnemonic] = useState('');
  const [label, setLabel] = useState('Production');
  const [enableEncryption, setEnableEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGenerate = async () => {
    const { mnemonic: generated } = await apiClient.generateMnemonic();
    setMnemonic(generated);
  };

  const handleNext = () => {
    if (!mnemonic) {
      notifications.show({ title: 'Error', message: 'Mnemonic is required', color: 'red' });
      return;
    }

    if (enableEncryption) {
      if (!password) {
        notifications.show({ title: 'Error', message: 'Password is required', color: 'red' });
        return;
      }
      if (password !== confirmPassword) {
        notifications.show({ title: 'Error', message: 'Passwords do not match', color: 'red' });
        return;
      }
    }

    onNext(mnemonic, label, enableEncryption, password);
  };

  return (
    <Stack gap="md">
      <SegmentedControl
        value={mode}
        onChange={(value) => setMode(value as 'generate' | 'import')}
        data={[
          { label: 'Generate New', value: 'generate' },
          { label: 'Import Existing', value: 'import' }
        ]}
      />

      {mode === 'generate' ? (
        <>
          <Button onClick={handleGenerate} leftSection={<IconWand />}>
            Generate Mnemonic
          </Button>

          {mnemonic && (
            <Alert icon={<IconAlertTriangle />} color="yellow">
              <Text fw={500} mb="xs">Save your mnemonic phrase securely!</Text>
              <Code block>{mnemonic}</Code>
            </Alert>
          )}
        </>
      ) : (
        <Textarea
          label="Mnemonic Phrase"
          placeholder="word1 word2 word3..."
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          minRows={3}
        />
      )}

      <TextInput
        label="Wallet Label"
        placeholder="Production"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <Divider label="Security" />

      <Checkbox
        label="Enable encryption"
        description="Encrypt mnemonic and private keys with password"
        checked={enableEncryption}
        onChange={(e) => setEnableEncryption(e.target.checked)}
      />

      {enableEncryption && (
        <>
          <PasswordInput
            label="Encryption Password"
            placeholder="Enter secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </>
      )}

      <Group justify="flex-end">
        <Button onClick={handleNext} disabled={!mnemonic}>
          Continue
        </Button>
      </Group>
    </Stack>
  );
}
```

**Step 4: Node Config**

```tsx
function Step4NodeConfig({ onNext }: { onNext: (config: NodeConfig) => void }) {
  const [accountsCount, setAccountsCount] = useState(10);
  const [chainId, setChainId] = useState(2029);
  const [evmChainId, setEvmChainId] = useState(2030);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    // Validate chain IDs
    const validateChainIds = async () => {
      const validation = await apiClient.validateSetupData({
        nodeConfig: { accountsCount, chainId, evmChainId, miningAuthor: 'auto' }
      });
      setWarnings(validation.warnings || []);
    };

    validateChainIds();
  }, [chainId, evmChainId]);

  const handleNext = () => {
    onNext({
      accountsCount,
      chainId,
      evmChainId,
      miningAuthor: 'auto'
    });
  };

  return (
    <Stack gap="md">
      <NumberInput
        label="Number of Accounts"
        description="Genesis accounts to generate (1-20)"
        value={accountsCount}
        onChange={(value) => setAccountsCount(Number(value))}
        min={1}
        max={20}
      />

      <NumberInput
        label="Core Space Chain ID"
        description="Default: 2029 (local)"
        value={chainId}
        onChange={(value) => setChainId(Number(value))}
      />

      <NumberInput
        label="eSpace Chain ID"
        description="Default: 2030 (local)"
        value={evmChainId}
        onChange={(value) => setEvmChainId(Number(value))}
      />

      {warnings.length > 0 && (
        <Alert icon={<IconAlertTriangle />} color="yellow">
          <Text fw={500} mb="xs">Warnings:</Text>
          <List size="sm">
            {warnings.map((warning, i) => (
              <List.Item key={i}>{warning}</List.Item>
            ))}
          </List>
        </Alert>
      )}

      <Alert icon={<IconLock />} color="blue">
        <Text fw={500}>Configuration Immutability</Text>
        <Text size="sm">
          These settings cannot be changed after creation without deleting blockchain data.
        </Text>
      </Alert>

      <Group justify="flex-end">
        <Button onClick={handleNext}>Continue</Button>
      </Group>
    </Stack>
  );
}
```

**Step 5: Complete**

```tsx
function Step5Complete({ setupData, onComplete }: { setupData: SetupData; onComplete: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiClient.completeSetup(setupData);

      notifications.show({
        title: 'Success',
        message: 'Setup completed successfully!',
        color: 'green'
      });

      onComplete();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Setup failed',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Alert icon={<IconCheck />} color="green">
        <Text fw={500} mb="xs">Setup Summary</Text>
        <List size="sm">
          <List.Item>Admin: {setupData.adminAddress}</List.Item>
          <List.Item>Wallet: {setupData.mnemonicLabel}</List.Item>
          <List.Item>Accounts: {setupData.nodeConfig.accountsCount}</List.Item>
          <List.Item>Chain IDs: {setupData.nodeConfig.chainId} / {setupData.nodeConfig.evmChainId}</List.Item>
          <List.Item>Encryption: {setupData.encryption?.enabled ? 'Enabled' : 'Disabled'}</List.Item>
        </List>
      </Alert>

      <Text size="sm" c="dimmed">
        Click Complete to create your DevKit configuration and start developing.
      </Text>

      <Group justify="flex-end">
        <Button onClick={handleComplete} loading={loading} size="lg">
          Complete Setup
        </Button>
      </Group>
    </Stack>
  );
}
```

### 5.2 Dashboard (Merged DevNode + Monitoring)

**File:** `packages/frontend/src/components/Dashboard.tsx` (NEW, replaces DevNodeControlPanel + BlockchainMonitor)

```tsx
export function Dashboard() {
  const { status, fetchStatus } = useDevNodeStore();
  const { wallets, activeWallet, switchWallet } = useWalletStore();

  return (
    <Stack gap="md">
      {/* Header with Wallet Selector */}
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>

        {!status?.isRunning && (
          <Select
            label="Active Wallet"
            value={activeWallet?.id}
            onChange={async (value) => {
              if (value) await switchWallet(value);
            }}
            data={wallets.map(w => ({
              value: w.id,
              label: w.label
            }))}
          />
        )}
      </Group>

      {/* Active Wallet Info Card */}
      {activeWallet && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Group gap="xs">
              <IconWallet size={20} />
              <Title order={5}>Active Wallet</Title>
            </Group>
            <Badge color={status?.isRunning ? "green" : "gray"}>
              {activeWallet.label}
            </Badge>
          </Group>

          <Stack gap="xs" mt="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Data Directory</Text>
              <Code>{activeWallet.dataDir.split('/').pop()}</Code>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Accounts</Text>
              <Badge>{activeWallet.nodeConfig.accountsCount}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Chain IDs</Text>
              <Badge>{activeWallet.nodeConfig.chainId} / {activeWallet.nodeConfig.evmChainId}</Badge>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Node Controls */}
      <NodeControlPanel />

      {/* Real-time Monitoring */}
      {status?.isRunning && (
        <>
          <NodeStatsCards />
          <BlockchainMonitor />
        </>
      )}
    </Stack>
  );
}
```

### 5.3 Configuration Tab (Expanded)

**File:** `packages/frontend/src/components/Configuration.tsx` (NEW, replaces WalletSettingsEnhanced)

```tsx
export function Configuration() {
  const [activeTab, setActiveTab] = useState<'wallets' | 'admins' | 'security'>('wallets');

  return (
    <Stack gap="md">
      <Title order={2}>Configuration</Title>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
        <Tabs.List>
          <Tabs.Tab value="wallets" leftSection={<IconWallet />}>
            Wallets & Node Config
          </Tabs.Tab>
          <Tabs.Tab value="admins" leftSection={<IconShield />}>
            Admin Addresses
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconLock />}>
            Security
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="wallets" pt="md">
          <WalletsPanel />
        </Tabs.Panel>

        <Tabs.Panel value="admins" pt="md">
          <AdminsPanel />
        </Tabs.Panel>

        <Tabs.Panel value="security" pt="md">
          <SecurityPanel />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
```

**Wallets Panel:**

```tsx
function WalletsPanel() {
  const { wallets, activeWallet, addWallet, deleteWallet } = useWalletStore();
  const [opened, setOpened] = useState(false);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text>Manage mnemonics and their node configurations</Text>
        <Button leftSection={<IconPlus />} onClick={() => setOpened(true)}>
          Add Wallet
        </Button>
      </Group>

      <Stack gap="sm">
        {wallets.map(wallet => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isActive={wallet.id === activeWallet?.id}
            onDelete={() => deleteWallet(wallet.id)}
          />
        ))}
      </Stack>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Add Wallet">
        <AddWalletForm onSuccess={() => setOpened(false)} />
      </Modal>
    </Stack>
  );
}
```

**Wallet Card:**

```tsx
function WalletCard({ wallet, isActive, onDelete }: WalletCardProps) {
  const [configOpened, setConfigOpened] = useState(false);

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between">
        <Group>
          <Badge color={isActive ? "green" : "gray"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <Text fw={500}>{wallet.label}</Text>
        </Group>

        <Group gap="xs">
          <ActionIcon onClick={() => setConfigOpened(true)}>
            <IconSettings size={18} />
          </ActionIcon>
          <ActionIcon color="red" onClick={onDelete} disabled={isActive}>
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <SimpleGrid cols={3} mt="md">
        <div>
          <Text size="xs" c="dimmed">Accounts</Text>
          <Text size="sm">{wallet.nodeConfig.accountsCount}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">Chain IDs</Text>
          <Text size="sm">{wallet.nodeConfig.chainId} / {wallet.nodeConfig.evmChainId}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">Data Size</Text>
          <Text size="sm">{wallet.dataSize}</Text>
        </div>
      </SimpleGrid>

      <Modal opened={configOpened} onClose={() => setConfigOpened(false)} title="Node Configuration">
        <NodeConfigForm wallet={wallet} onClose={() => setConfigOpened(false)} />
      </Modal>
    </Card>
  );
}
```

**Node Config Form:**

```tsx
function NodeConfigForm({ wallet, onClose }: { wallet: MnemonicSummary; onClose: () => void }) {
  const [canModify, setCanModify] = useState(false);
  const [accountsCount, setAccountsCount] = useState(wallet.nodeConfig.accountsCount);

  useEffect(() => {
    // Check if config can be modified
    apiClient.canModifyNodeConfig(wallet.id).then(result => {
      setCanModify(result.canModify);
    });
  }, [wallet.id]);

  const handleDeleteData = async () => {
    if (!confirm('Delete blockchain data? This action cannot be undone.')) return;

    try {
      await apiClient.deleteNodeData(wallet.id);
      notifications.show({
        title: 'Success',
        message: 'Blockchain data deleted. Configuration can now be modified.',
        color: 'green'
      });
      setCanModify(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete data',
        color: 'red'
      });
    }
  };

  const handleSaveConfig = async () => {
    try {
      await apiClient.updateNodeConfig(wallet.id, {
        accountsCount
      });

      notifications.show({
        title: 'Success',
        message: 'Node configuration updated',
        color: 'green'
      });

      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update config',
        color: 'red'
      });
    }
  };

  return (
    <Stack gap="md">
      {!canModify && (
        <Alert icon={<IconLock />} color="yellow">
          <Text fw={500}>Configuration is locked</Text>
          <Text size="sm">
            Blockchain data exists for this wallet. Delete data to modify configuration.
          </Text>
          <Button
            color="red"
            size="xs"
            mt="sm"
            leftSection={<IconTrash />}
            onClick={handleDeleteData}
          >
            Delete Blockchain Data ({wallet.dataSize})
          </Button>
        </Alert>
      )}

      <NumberInput
        label="Number of Accounts"
        value={accountsCount}
        onChange={(value) => setAccountsCount(Number(value))}
        min={1}
        max={20}
        disabled={!canModify}
      />

      <TextInput
        label="Core Space Chain ID"
        value={wallet.nodeConfig.chainId}
        disabled
      />

      <TextInput
        label="eSpace Chain ID"
        value={wallet.nodeConfig.evmChainId}
        disabled
      />

      <Text size="xs" c="dimmed">
        Chain IDs cannot be modified after creation.
      </Text>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveConfig} disabled={!canModify}>
          Save Changes
        </Button>
      </Group>
    </Stack>
  );
}
```

### 5.4 App Entry Point Update

**File:** `packages/frontend/src/App.tsx`

```tsx
export function App() {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    // Check setup status on mount
    apiClient.getSetupStatus().then(result => {
      setSetupRequired(result.setupRequired);
    });
  }, []);

  if (setupRequired === null) {
    return <LoadingOverlay visible />;
  }

  if (setupRequired) {
    return <SetupWizard />;
  }

  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/accounts" element={<AccountsTable />} />
          <Route path="/swap" element={<SwapInterface />} />
        </Routes>
      </Shell>
    </Router>
  );
}
```

---

## 6. CLI Implementation

### 6.1 CLI Commands

**File:** `packages/backend/src/cli/index.ts` (NEW)

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import { getKeystoreService } from '../services/keystore-service';
import { SetupService } from '../services/setup-service';

const program = new Command();

program
  .name('conflux-devkit')
  .description('Conflux DevKit Backend CLI')
  .version('2.0.0');

/**
 * Setup command
 */
program
  .command('setup')
  .description('Run initial setup wizard')
  .action(async () => {
    const keystoreService = getKeystoreService();
    const setupService = new SetupService(keystoreService, null);

    const setupRequired = await setupService.isSetupRequired();
    if (!setupRequired) {
      console.log('✓ Setup already completed');
      return;
    }

    console.log('Conflux DevKit - Initial Setup\n');

    // Step 1: Generate or import mnemonic
    const { mnemonicAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mnemonicAction',
        message: 'Mnemonic setup:',
        choices: ['Generate new', 'Import existing']
      }
    ]);

    let mnemonic: string;
    if (mnemonicAction === 'Generate new') {
      mnemonic = await keystoreService.generateMnemonic();
      console.log('\nYour mnemonic phrase:');
      console.log(`\n${mnemonic}\n`);
      console.log('⚠️  Save this phrase securely!\n');
    } else {
      const { importedMnemonic } = await inquirer.prompt([
        {
          type: 'input',
          name: 'importedMnemonic',
          message: 'Enter mnemonic phrase:'
        }
      ]);
      mnemonic = importedMnemonic;
    }

    // Step 2: Wallet label
    const { label } = await inquirer.prompt([
      {
        type: 'input',
        name: 'label',
        message: 'Wallet label:',
        default: 'Production'
      }
    ]);

    // Step 3: Node configuration
    const { accountsCount, chainId, evmChainId } = await inquirer.prompt([
      {
        type: 'number',
        name: 'accountsCount',
        message: 'Number of accounts (1-20):',
        default: 10
      },
      {
        type: 'number',
        name: 'chainId',
        message: 'Core Space chain ID:',
        default: 2029
      },
      {
        type: 'number',
        name: 'evmChainId',
        message: 'eSpace chain ID:',
        default: 2030
      }
    ]);

    // Step 4: Encryption
    const { enableEncryption } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableEncryption',
        message: 'Enable encryption?',
        default: false
      }
    ]);

    let password: string | undefined;
    if (enableEncryption) {
      const { pass1, pass2 } = await inquirer.prompt([
        {
          type: 'password',
          name: 'pass1',
          message: 'Encryption password:'
        },
        {
          type: 'password',
          name: 'pass2',
          message: 'Confirm password:'
        }
      ]);

      if (pass1 !== pass2) {
        console.error('❌ Passwords do not match');
        process.exit(1);
      }

      password = pass1;
    }

    // Step 5: Admin address (derived from mnemonic)
    const derivedAccounts = await keystoreService.deriveAccountsFromMnemonic(
      mnemonic,
      'espace',
      1,
      0
    );
    const adminAddress = derivedAccounts[0].address;

    console.log(`\n✓ Admin address (derived): ${adminAddress}\n`);

    // Complete setup
    try {
      await setupService.completeSetup({
        adminAddress,
        mnemonic,
        mnemonicLabel: label,
        nodeConfig: {
          accountsCount,
          chainId,
          evmChainId,
          miningAuthor: 'auto'
        },
        encryption: {
          enabled: enableEncryption,
          password
        }
      });

      console.log('✓ Setup completed successfully!\n');
      console.log('You can now start the backend server:');
      console.log('  pnpm dev\n');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  });

/**
 * Wallet commands
 */
const wallet = program.command('wallet').description('Manage wallets');

wallet
  .command('list')
  .description('List all wallets')
  .action(async () => {
    const keystoreService = getKeystoreService();
    const mnemonics = await keystoreService.listMnemonics();

    console.log('\nWallets:\n');
    mnemonics.forEach((m, i) => {
      const active = m.isActive ? '●' : '○';
      console.log(`${active} ${m.label}`);
      console.log(`  ID: ${m.id}`);
      console.log(`  Accounts: ${m.nodeConfig.accountsCount}`);
      console.log(`  Data: ${m.dataSize}\n`);
    });
  });

wallet
  .command('add')
  .description('Add a new wallet')
  .action(async () => {
    // Similar to setup wizard...
  });

wallet
  .command('switch <id>')
  .description('Switch active wallet')
  .action(async (id: string) => {
    const devkitManager = getDevKitManager();

    try {
      const result = await devkitManager.switchMnemonic(id);
      console.log(`✓ Switched to: ${result.activeLabel}`);
      console.log(`  Data directory: ${result.dataDir}`);
    } catch (error) {
      console.error('❌ Failed to switch wallet:', error);
      process.exit(1);
    }
  });

/**
 * Admin commands
 */
const admin = program.command('admin').description('Manage admin addresses');

admin
  .command('list')
  .description('List admin addresses')
  .action(async () => {
    const keystoreService = getKeystoreService();
    const admins = await keystoreService.getAdminAddresses();

    console.log('\nAdmin addresses:\n');
    admins.forEach((addr, i) => {
      console.log(`${i + 1}. ${addr}`);
    });
    console.log();
  });

admin
  .command('add <address>')
  .description('Add admin address')
  .action(async (address: string) => {
    const keystoreService = getKeystoreService();

    try {
      await keystoreService.addAdminAddress(address);
      console.log(`✓ Added admin: ${address}`);
    } catch (error) {
      console.error('❌ Failed to add admin:', error);
      process.exit(1);
    }
  });

program.parse();
```

### 6.2 Package.json Binary

**File:** `packages/backend/package.json`

```json
{
  "name": "@conflux-devkit/backend",
  "version": "2.0.0",
  "bin": {
    "conflux-devkit": "./dist/cli.js",
    "conflux-devkit-backend": "./dist/cli.js"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsup",
    "cli": "tsx src/cli/index.ts"
  }
}
```

---

## 7. Security Model

### 7.1 Encryption Implementation

**Algorithm:** AES-256-GCM
**Key Derivation:** PBKDF2-SHA256 (100,000 iterations)
**Salt:** 32 bytes (random, stored in keystore)
**IV:** 12 bytes (random per encryption, prepended to ciphertext)

**Encrypted Data Format:**
```
base64(IV + EncryptedData + AuthTag)
```

**Implementation:**

```typescript
import { webcrypto } from 'crypto';

export class EncryptionService {
  private static ITERATIONS = 100000;
  private static KEY_LENGTH = 256;
  private static SALT_LENGTH = 32;
  private static IV_LENGTH = 12;

  /**
   * Derive encryption key from password
   */
  static async deriveKey(password: string, salt: Buffer): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await webcrypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await webcrypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data
   */
  static async encrypt(plaintext: string, password: string, salt: Buffer): Promise<string> {
    const key = await this.deriveKey(password, salt);
    const iv = webcrypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    const ciphertext = await webcrypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintextBuffer
    );

    // Prepend IV to ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return Buffer.from(combined).toString('base64');
  }

  /**
   * Decrypt data
   */
  static async decrypt(ciphertext: string, password: string, salt: Buffer): Promise<string> {
    const combined = Buffer.from(ciphertext, 'base64');

    // Extract IV and ciphertext
    const iv = combined.slice(0, this.IV_LENGTH);
    const encrypted = combined.slice(this.IV_LENGTH);

    const key = await this.deriveKey(password, salt);

    const decrypted = await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}
```

### 7.2 Admin Address Validation

**Multi-Admin Security:**

```typescript
export class AdminValidator {
  /**
   * Validate admin removal
   */
  static async canRemoveAdmin(
    addressToRemove: string,
    currentAdmin: string,
    allAdmins: string[]
  ): Promise<{ canRemove: boolean; reason?: string }> {
    // Cannot remove self
    if (addressToRemove.toLowerCase() === currentAdmin.toLowerCase()) {
      return {
        canRemove: false,
        reason: 'Cannot remove your own admin address'
      };
    }

    // Must keep at least one admin
    if (allAdmins.length <= 1) {
      return {
        canRemove: false,
        reason: 'Cannot remove the last admin address'
      };
    }

    return { canRemove: true };
  }

  /**
   * Validate admin addition
   */
  static async canAddAdmin(
    newAddress: string,
    currentAdmins: string[]
  ): Promise<{ canAdd: boolean; reason?: string }> {
    // Validate address format
    if (!isAddress(newAddress)) {
      return {
        canAdd: false,
        reason: 'Invalid Ethereum address format'
      };
    }

    // Check if already admin
    const isAlreadyAdmin = currentAdmins.some(
      admin => admin.toLowerCase() === newAddress.toLowerCase()
    );

    if (isAlreadyAdmin) {
      return {
        canAdd: false,
        reason: 'Address is already an admin'
      };
    }

    return { canAdd: true };
  }
}
```

### 7.3 Session Management

**Session Timeout:**
- Development: 24 hours
- Production: 1 hour

**Session Renewal:**
- Auto-renew on activity (extend expiry)
- Explicit logout endpoint clears session

**Concurrent Sessions:**
- Same address can have multiple sessions (different browsers)
- Each session has unique ID

---

## 8. Migration Strategy

### 8.1 Breaking Changes

**What Gets Deleted:**
1. `~/.devkit.keystore.json` (v1 schema)
2. `/workspace/.conflux-dev/*` (all old data directories)
3. Any environment variable config (`HARDHAT_VAR_DEPLOYER_MNEMONIC`)

**What Gets Created:**
1. New keystore v2 with setup wizard data
2. New data directories with hash-based naming
3. Lock files for running nodes

### 8.2 Development Team Steps

```bash
# 1. Stop all running services
pnpm ports:kill

# 2. Delete old configuration
rm ~/.devkit.keystore.json
rm -rf /workspace/.conflux-dev

# 3. Pull latest code
git pull origin dev

# 4. Install dependencies
pnpm install

# 5. Build all packages
pnpm build

# 6. Start backend (will prompt for setup)
pnpm dev:backend

# 7. In another terminal, start frontend
pnpm dev:frontend

# 8. Open browser to http://localhost:3000
# 9. Complete setup wizard
```

### 8.3 CI/CD Considerations

**Environment Variables (No Longer Used):**
- `HARDHAT_VAR_DEPLOYER_MNEMONIC` - REMOVE
- `HARDHAT_ADMIN_ADDRESS` - REMOVE (now in keystore)

**New Environment Variables:**
- `DEVKIT_KEYSTORE_PATH` - Optional, defaults to `~/.devkit.keystore.json`
- `DEVKIT_DATA_DIR` - Optional, defaults to `~/.conflux-dev`
- `DEVKIT_SKIP_SETUP` - For automated testing only

---

## 9. Testing Strategy

### 9.1 Unit Tests

**KeystoreService:**
- ✅ Setup completion
- ✅ Admin address CRUD
- ✅ Mnemonic CRUD
- ✅ Encryption/decryption
- ✅ Node config immutability

**SetupService:**
- ✅ Validation logic
- ✅ Chain ID conflict detection
- ✅ Setup data persistence

**DevKitManager:**
- ✅ Initialization with/without setup
- ✅ Wallet switching
- ✅ Node restart on switch
- ✅ Config enforcement

### 9.2 Integration Tests

**Setup Wizard Flow:**
1. Fresh install → setup required
2. Complete setup → keystore created
3. Restart backend → no setup required
4. Admin operations work

**Wallet Management:**
1. Add mnemonic → data dir created
2. Switch wallet (node stopped) → success
3. Switch wallet (node running) → error
4. Delete wallet → data dir removed

**Node Configuration:**
1. Start node → uses config from active wallet
2. Change config (no data) → success
3. Change config (with data) → blocked
4. Delete data → config modifiable

### 9.3 End-to-End Tests

**Scenario 1: Fresh Install**
```
1. User visits UI → Setup wizard shown
2. Connect wallet → Sign message
3. Generate mnemonic → Save phrase
4. Configure node → 10 accounts
5. Enable encryption → Set password
6. Complete setup → Dashboard shown
7. Start node → Running with 10 accounts
```

**Scenario 2: Multi-Wallet**
```
1. Add second wallet → "Testing"
2. Configure with 5 accounts
3. Stop node
4. Switch to "Testing" → Success
5. Start node → 5 accounts shown
6. Switch back to "Production" → 10 accounts restored
```

**Scenario 3: Config Immutability**
```
1. Start node → Mine some blocks
2. Stop node
3. Try to change account count → Blocked (data exists)
4. Delete blockchain data → Confirm deletion
5. Change account count → Success
6. Start node → New config applied
```

---

## 10. Implementation Phases

### Phase 1: Backend Foundation (Week 1)
**Tasks:**
- [ ] Create keystore v2 schema TypeScript interfaces
- [ ] Implement KeystoreService v2 methods
- [ ] Implement SetupService
- [ ] Implement EncryptionService
- [ ] Update DevKitManager for setup check
- [ ] Update AuthService for multi-admin
- [ ] Create setup-check middleware
- [ ] Write unit tests for services

**Deliverables:**
- Backend services fully functional
- Unit tests passing
- API endpoints stubbed (return mock data)

### Phase 2: API Endpoints (Week 2)
**Tasks:**
- [ ] Implement /api/setup/* endpoints
- [ ] Implement /api/devkit/admin/* endpoints
- [ ] Implement /api/devkit/wallet/* endpoints
- [ ] Implement /api/devkit/node/config/* endpoints
- [ ] Update existing /api/devkit/node/start endpoint
- [ ] Add setup-check middleware to routes
- [ ] Write integration tests for API

**Deliverables:**
- All API endpoints functional
- Postman collection for testing
- Integration tests passing

### Phase 3: CLI Implementation (Week 2)
**Tasks:**
- [ ] Create CLI entry point
- [ ] Implement `setup` command
- [ ] Implement `wallet` commands
- [ ] Implement `admin` commands
- [ ] Update package.json binary config
- [ ] Write CLI tests

**Deliverables:**
- CLI functional
- Can complete setup via CLI
- Can manage wallets via CLI

### Phase 4: Frontend - Setup Wizard (Week 3)
**Tasks:**
- [ ] Create SetupWizard component
- [ ] Implement Step1ConnectWallet
- [ ] Implement Step2AdminSetup
- [ ] Implement Step3CreateWallet
- [ ] Implement Step4NodeConfig
- [ ] Implement Step5Complete
- [ ] Update App.tsx entry point
- [ ] Add API client methods for setup

**Deliverables:**
- Setup wizard fully functional
- Can complete setup via web UI
- UI matches design specs

### Phase 5: Frontend - Dashboard (Week 4)
**Tasks:**
- [ ] Create Dashboard component (merge DevNode + Monitoring)
- [ ] Implement NodeControlPanel
- [ ] Implement NodeStatsCards
- [ ] Update BlockchainMonitor
- [ ] Add wallet selector to dashboard
- [ ] Wire up WebSocket for real-time updates

**Deliverables:**
- Dashboard functional
- Real-time monitoring working
- Wallet switching from dashboard

### Phase 6: Frontend - Configuration (Week 4)
**Tasks:**
- [ ] Create Configuration component
- [ ] Implement WalletsPanel
- [ ] Implement WalletCard
- [ ] Implement NodeConfigForm
- [ ] Implement AdminsPanel
- [ ] Implement SecurityPanel
- [ ] Add wallet management stores

**Deliverables:**
- Configuration tab fully functional
- Can add/delete wallets
- Can manage admins
- Can modify configs (with validation)

### Phase 7: Testing & Polish (Week 5)
**Tasks:**
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security audit
- [ ] UI/UX polish
- [ ] Documentation updates
- [ ] Migration guide
- [ ] Changelog

**Deliverables:**
- All tests passing
- Documentation complete
- Ready for deployment

### Phase 8: Deployment (Week 6)
**Tasks:**
- [ ] Code review
- [ ] Merge to dev branch
- [ ] Tag release (v2.0.0)
- [ ] Update CLAUDE.md
- [ ] Announce breaking changes
- [ ] Monitor for issues

**Deliverables:**
- v2.0.0 deployed
- Team trained on new flow
- Support documentation ready

---

## Summary

This plan implements a complete refactor of Conflux DevKit with:

✅ **Mandatory initial setup** - No default test mnemonic
✅ **Multi-admin support** - Equal rights, wallet-based auth
✅ **Immutable node configs** - Locked to blockchain data
✅ **Reorganized UI** - Dashboard + Configuration tabs
✅ **Enhanced security** - Encrypted mnemonics + derived keys
✅ **CLI parity** - Same functionality as web UI
✅ **No backward compatibility** - Fresh start, clean slate

**Estimated Timeline:** 6 weeks
**Breaking Changes:** YES - Full reset required
**Migration Path:** Delete old files, run setup wizard

---

**Next Steps:**
1. Review and approve this plan
2. Create GitHub issues for each phase
3. Assign tasks to team members
4. Begin Phase 1 implementation

**Questions? Clarifications needed?**
