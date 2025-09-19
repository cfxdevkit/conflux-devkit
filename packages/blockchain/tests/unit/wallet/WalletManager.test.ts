// WalletManager tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletManager } from '../../../src/wallet/WalletManager';
import {
  createMockNetworkConfig,
  createMockWalletInfo,
} from '../../helpers/test-utils';
import {
  MOCK_NETWORKS,
  MOCK_MNEMONICS,
  MOCK_PRIVATE_KEYS,
  MOCK_ADDRESSES,
} from '../../helpers/mock-data';
import {
  expectValidWalletInfo,
  expectValidMnemonic,
  expectValidPrivateKey,
} from '../../helpers/assertions';

// Mock dependencies
vi.mock('bip32', () => ({
  BIP32Factory: vi.fn(),
}));

vi.mock('bip39', () => ({
  mnemonicToSeedSync: vi.fn(),
}));

vi.mock('tiny-secp256k1', () => ({}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn(),
}));

vi.mock('viem', () => ({
  formatEther: vi.fn(),
}));

// Mock network manager
vi.mock('../../../src/network', () => ({
  networkManager: {
    getNetwork: vi.fn(),
    getLocalNetwork: vi.fn(),
    getTestnetNetwork: vi.fn(),
    getMainnetNetwork: vi.fn(),
  },
}));

// Mock the createBip32 function
vi.mock('../../../src/wallet/WalletManager', async () => {
  const actual = await vi.importActual('../../../src/wallet/WalletManager');
  return {
    ...actual,
    createBip32: vi.fn(),
  };
});

describe('WalletManager', () => {
  let mockBip32: any;
  let mockBip39: any;
  let mockViemAccounts: any;
  let mockViem: any;
  let mockNetworkManager: any;
  let walletManager: WalletManager;
  let mockRoot: any;
  let mockChild: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mocks
    mockBip32 = {
      fromSeed: vi.fn(),
    };
    mockBip39 = {
      mnemonicToSeedSync: vi.fn(),
    };
    mockViemAccounts = {
      privateKeyToAccount: vi.fn(),
    };
    mockViem = {
      formatEther: vi.fn(),
    };

    // Mock BIP32 root and child
    mockChild = {
      privateKey: Buffer.from(
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        'hex'
      ),
    };
    mockRoot = {
      derivePath: vi.fn().mockImplementation(path => {
        // Generate different private key based on derivation path
        const index = parseInt(path.split('/').pop() || '0');
        const privateKeyHex = `abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789${index.toString(16).padStart(2, '0')}`;
        return {
          privateKey: Buffer.from(privateKeyHex, 'hex'),
        };
      }),
    };

    // Apply mocks
    const bip32Module = await import('bip32');
    const bip39Module = await import('bip39');
    const viemAccountsModule = await import('viem/accounts');
    const viemModule = await import('viem');

    vi.mocked(bip32Module.BIP32Factory).mockReturnValue(mockBip32);
    vi.mocked(bip39Module.mnemonicToSeedSync).mockReturnValue(
      Buffer.from('test-seed')
    );
    let addressCounter = 0;
    vi.mocked(viemAccountsModule.privateKeyToAccount).mockImplementation(
      privateKey => {
        // Generate different address for each call
        const address =
          `0x${'0'.repeat(38)}${(++addressCounter).toString(16).padStart(2, '0')}` as `0x${string}`;
        return { address };
      }
    );
    vi.mocked(viemModule.formatEther).mockReturnValue('1.0 CFX');

    mockBip32.fromSeed.mockReturnValue(mockRoot);

    // Mock the createBip32 function
    const walletModule = await import('../../../src/wallet/WalletManager');
    vi.mocked(walletModule.createBip32).mockReturnValue(mockBip32);

    // Setup network manager mocks
    mockNetworkManager = {
      getNetwork: vi.fn(),
      getLocalNetwork: vi.fn(),
      getTestnetNetwork: vi.fn(),
      getMainnetNetwork: vi.fn(),
    };

    // Mock the network manager module
    const networkModule = await import('../../../src/network');
    Object.assign(networkModule.networkManager, mockNetworkManager);

    mockNetworkManager.getNetwork.mockReturnValue(MOCK_NETWORKS.mainnetEvm);
    mockNetworkManager.getLocalNetwork.mockReturnValue(MOCK_NETWORKS.localEvm);
    mockNetworkManager.getTestnetNetwork.mockReturnValue(
      MOCK_NETWORKS.testnetEvm
    );
    mockNetworkManager.getMainnetNetwork.mockReturnValue(
      MOCK_NETWORKS.mainnetEvm
    );

    // Create wallet manager
    walletManager = new WalletManager();
  });

  describe('Static Factory Methods', () => {
    it('should create wallet manager for network', () => {
      const manager = WalletManager.createForNetwork('evm-mainnet');

      expect(manager).toBeDefined();
      expect(mockNetworkManager.getNetwork).toHaveBeenCalledWith('evm-mainnet');
    });

    it('should throw error for invalid network', () => {
      mockNetworkManager.getNetwork.mockReturnValue(null);

      expect(() => WalletManager.createForNetwork('invalid')).toThrow(
        'Network not found: invalid'
      );
    });

    it('should create local wallet manager', () => {
      const manager = WalletManager.createLocal();

      expect(manager).toBeDefined();
    });

    it('should create testnet wallet manager', () => {
      const manager = WalletManager.createTestnet();

      expect(manager).toBeDefined();
    });

    it('should create mainnet wallet manager', () => {
      const manager = WalletManager.createMainnet();

      expect(manager).toBeDefined();
    });
  });

  describe('generateWallet', () => {
    it('should generate wallet from valid mnemonic', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const index = 0;
      const network = createMockNetworkConfig();

      const wallet = await walletManager.generateWallet(
        mnemonic,
        index,
        network
      );

      expect(wallet).toBeDefined();
      expectValidWalletInfo(wallet);
      expect(wallet.mnemonic).toBe(mnemonic);
      expect(wallet.index).toBe(index);
    });

    it('should generate wallet with custom index', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const index = 5;
      const network = createMockNetworkConfig();

      const wallet = await walletManager.generateWallet(
        mnemonic,
        index,
        network
      );

      expect(wallet.index).toBe(index);
      expect(mockRoot.derivePath).toHaveBeenCalledWith(
        `m/44'/60'/0'/0/${index}`
      );
    });

    it('should throw error for invalid mnemonic', async () => {
      const mnemonic = MOCK_MNEMONICS.invalid;
      const index = 0;
      const network = createMockNetworkConfig();

      await expect(
        walletManager.generateWallet(mnemonic, index, network)
      ).rejects.toThrow('Failed to generate wallet');
    });

    it('should throw error for empty mnemonic', async () => {
      const mnemonic = MOCK_MNEMONICS.empty;
      const index = 0;
      const network = createMockNetworkConfig();

      await expect(
        walletManager.generateWallet(mnemonic, index, network)
      ).rejects.toThrow('Failed to generate wallet');
    });

    it('should throw error when private key derivation fails', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const index = 0;
      const network = createMockNetworkConfig();

      // Mock child without private key
      mockChild.privateKey = null;
      mockRoot.derivePath.mockReturnValue(mockChild);

      await expect(
        walletManager.generateWallet(mnemonic, index, network)
      ).rejects.toThrow('Failed to generate wallet');
    });

    it('should handle BIP32 errors', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const index = 0;
      const network = createMockNetworkConfig();

      // Mock BIP32 error
      mockBip32.fromSeed.mockImplementation(() => {
        throw new Error('BIP32 error');
      });

      await expect(
        walletManager.generateWallet(mnemonic, index, network)
      ).rejects.toThrow('Failed to generate wallet');
    });
  });

  describe('isValidMnemonic', () => {
    it('should validate correct mnemonic', () => {
      const mnemonic = MOCK_MNEMONICS.valid;

      const result = walletManager.isValidMnemonic(mnemonic);

      expect(result).toBe(true);
    });

    it('should reject invalid mnemonic', () => {
      const mnemonic = MOCK_MNEMONICS.invalid;

      const result = walletManager.isValidMnemonic(mnemonic);

      expect(result).toBe(false);
    });

    it('should reject empty mnemonic', () => {
      const mnemonic = MOCK_MNEMONICS.empty;

      const result = walletManager.isValidMnemonic(mnemonic);

      expect(result).toBe(false);
    });

    it('should reject short mnemonic', () => {
      const mnemonic = MOCK_MNEMONICS.short;

      const result = walletManager.isValidMnemonic(mnemonic);

      expect(result).toBe(false);
    });
  });

  describe('getWallet', () => {
    it('should return wallet if exists', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const network = createMockNetworkConfig();

      // Generate a wallet first
      const generatedWallet = await walletManager.generateWallet(
        mnemonic,
        0,
        network
      );

      // Get the wallet
      const wallet = walletManager.getWallet(generatedWallet.address);

      expect(wallet).toBeDefined();
      expect(wallet).toEqual(generatedWallet);
    });

    it('should return undefined if wallet does not exist', () => {
      const address = MOCK_ADDRESSES.evm;

      const wallet = walletManager.getWallet(address);

      expect(wallet).toBeUndefined();
    });
  });

  describe('getAllWallets', () => {
    it('should return empty array when no wallets', () => {
      const wallets = walletManager.getAllWallets();

      expect(wallets).toEqual([]);
    });

    it('should return all wallets', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const network = createMockNetworkConfig();

      // Generate multiple wallets
      const wallet1 = await walletManager.generateWallet(mnemonic, 0, network);
      const wallet2 = await walletManager.generateWallet(mnemonic, 1, network);

      const wallets = walletManager.getAllWallets();

      expect(wallets).toHaveLength(2);
      expect(wallets).toContain(wallet1);
      expect(wallets).toContain(wallet2);
    });
  });

  describe('removeWallet', () => {
    it('should remove existing wallet', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const network = createMockNetworkConfig();

      // Generate a wallet
      const wallet = await walletManager.generateWallet(mnemonic, 0, network);

      // Remove the wallet
      const removed = walletManager.removeWallet(wallet.address);

      expect(removed).toBe(true);
      expect(walletManager.getWallet(wallet.address)).toBeUndefined();
    });

    it('should return false for non-existent wallet', () => {
      const address = MOCK_ADDRESSES.evm;

      const removed = walletManager.removeWallet(address);

      expect(removed).toBe(false);
    });
  });

  describe('clearWallets', () => {
    it('should clear all wallets', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const network = createMockNetworkConfig();

      // Generate multiple wallets
      await walletManager.generateWallet(mnemonic, 0, network);
      await walletManager.generateWallet(mnemonic, 1, network);

      expect(walletManager.getAllWallets()).toHaveLength(2);

      // Clear wallets
      walletManager.clearWallets();

      expect(walletManager.getAllWallets()).toHaveLength(0);
    });
  });

  describe('getWalletCount', () => {
    it('should return zero when no wallets', () => {
      const count = walletManager.getWalletCount();

      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      const mnemonic = MOCK_MNEMONICS.valid;
      const network = createMockNetworkConfig();

      // Generate multiple wallets
      await walletManager.generateWallet(mnemonic, 0, network);
      await walletManager.generateWallet(mnemonic, 1, network);

      const count = walletManager.getWalletCount();

      expect(count).toBe(2);
    });
  });
});
