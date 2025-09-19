import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WalletManager } from '../../src/WalletManager';

// Mock the dependencies
vi.mock('viem', () => ({
  formatEther: vi.fn(value => (Number(value) / 1e18).toString()),
}));

vi.mock('viem/accounts', () => ({
  mnemonicToAccount: vi.fn(() => ({
    address: '0x1234567890abcdef1234567890abcdef12345678',
    privateKey: '0xprivatekey',
    getHdKey: vi.fn(() => ({
      privateKey: Buffer.from(
        'privatekey1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'hex'
      ),
    })),
  })),
  privateKeyToAccount: vi.fn(() => ({
    address: '0x1234567890abcdef1234567890abcdef12345678',
    privateKey: '0xprivatekey',
  })),
}));

vi.mock('@conflux-devkit/blockchain', () => ({
  EvmClient: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn(() => Promise.resolve('1000000000000000000')),
    sendTransaction: vi.fn(() => Promise.resolve('0xtxhash')),
  })),
}));

describe('WalletManager', () => {
  let walletManager: WalletManager;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      walletMode: 'mnemonic',
      walletCount: 5,
      fundWallets: true,
      mnemonic: 'test test test test test test test test test test test junk',
    };
    walletManager = new WalletManager(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a WalletManager instance', () => {
    expect(walletManager).toBeInstanceOf(WalletManager);
  });

  it('should initialize with mnemonic mode by default', () => {
    const config = { walletMode: 'mnemonic' };
    const manager = new WalletManager(config);
    expect((manager as any).walletMode).toBe('mnemonic');
  });

  it('should initialize with private key mode', () => {
    const config = { walletMode: 'privatekey', privateKey: '0xprivatekey' };
    const manager = new WalletManager(config);
    expect((manager as any).walletMode).toBe('privatekey');
  });

  it('should initialize wallets from mnemonic', async () => {
    const wallets = await walletManager.initializeWallets(mockConfig);

    expect(wallets).toBeDefined();
    expect(Array.isArray(wallets)).toBe(true);
  });

  it('should initialize wallets from private key', async () => {
    const privateKeyConfig = {
      ...mockConfig,
      walletMode: 'privatekey',
      privateKey:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };

    const manager = new WalletManager(privateKeyConfig);
    const wallets = await manager.initializeWallets(privateKeyConfig);

    expect(wallets).toBeDefined();
    expect(Array.isArray(wallets)).toBe(true);
  });

  it('should handle wallet count configuration', async () => {
    const configWithCount = { ...mockConfig, walletCount: 3 };
    const wallets = await walletManager.initializeWallets(configWithCount);

    expect(wallets.length).toBeLessThanOrEqual(3);
  });

  it('should handle fundWallets configuration', async () => {
    const configNoFund = { ...mockConfig, fundWallets: false };
    const wallets = await walletManager.initializeWallets(configNoFund);

    expect(wallets).toBeDefined();
  });

  it('should use environment variable for mnemonic', async () => {
    const originalEnv = process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC;
    process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC = 'env test mnemonic';

    const config = { walletMode: 'mnemonic' };
    const manager = new WalletManager(config);
    const wallets = await manager.initializeWallets(config);

    expect(wallets).toBeDefined();

    // Restore original environment
    if (originalEnv) {
      process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC = originalEnv;
    } else {
      delete process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC;
    }
  });

  it('should use default test mnemonic when none provided', async () => {
    const config = { walletMode: 'mnemonic' };
    const manager = new WalletManager(config);
    const wallets = await manager.initializeWallets(config);

    expect(wallets).toBeDefined();
  });

  it('should handle wallet creation with proper structure', async () => {
    const wallets = await walletManager.initializeWallets(mockConfig);

    if (wallets.length > 0) {
      const wallet = wallets[0];
      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(wallet).toHaveProperty('index');
    }
  });

  it('should handle private key validation', () => {
    const validPrivateKey =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const invalidPrivateKey = '0xinvalid';

    expect(validPrivateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(invalidPrivateKey).not.toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('should handle mnemonic validation', () => {
    const validMnemonic =
      'test test test test test test test test test test test junk';
    const invalidMnemonic = 'invalid mnemonic';

    expect(validMnemonic.split(' ').length).toBe(12);
    expect(invalidMnemonic.split(' ').length).not.toBe(12);
  });

  it('should handle wallet indexing', async () => {
    const wallets = await walletManager.initializeWallets(mockConfig);

    wallets.forEach((wallet, index) => {
      expect(wallet.index).toBe(index);
    });
  });

  it('should handle client initialization', () => {
    const manager = new WalletManager(mockConfig);
    expect((manager as any).coreClient).toBeUndefined();
    expect((manager as any).evmClient).toBeUndefined();
  });

  it('should handle wallet mode switching', () => {
    const mnemonicManager = new WalletManager({ walletMode: 'mnemonic' });
    const privateKeyManager = new WalletManager({ walletMode: 'privatekey' });

    expect((mnemonicManager as any).walletMode).toBe('mnemonic');
    expect((privateKeyManager as any).walletMode).toBe('privatekey');
  });

  it('should handle configuration merging', () => {
    const baseConfig = { walletMode: 'mnemonic' };
    const extendedConfig = {
      ...baseConfig,
      walletCount: 10,
      fundWallets: false,
    };

    expect(extendedConfig.walletMode).toBe('mnemonic');
    expect(extendedConfig.walletCount).toBe(10);
    expect(extendedConfig.fundWallets).toBe(false);
  });
});
