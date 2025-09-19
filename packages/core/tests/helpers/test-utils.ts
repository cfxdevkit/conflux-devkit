// Test utilities and helpers

import type { NetworkConfig } from '../../src/types/blockchain';

/**
 * Create a mock network configuration for testing
 */
export function createMockNetworkConfig(overrides: Partial<NetworkConfig> = {}): NetworkConfig {
  return {
    name: 'Test Network',
    chainId: 2029,
    evmChainId: 2030,
    rpcUrl: 'https://test.confluxrpc.com',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
    ...overrides,
  };
}

/**
 * Create a mock wallet info for testing
 */
export function createMockWalletInfo(overrides: any = {}) {
  return {
    index: 0,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    privateKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    balance: 1000000000000000000n,
    balanceFormatted: '1.0 CFX',
    isMining: false,
    ...overrides,
  };
}

/**
 * Create a mock transaction receipt for testing
 */
export function createMockTransactionReceipt(overrides: any = {}) {
  return {
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 12345n,
    blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    transactionIndex: 0,
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0x9876543210fedcba9876543210fedcba98765432',
    gasUsed: 21000n,
    effectiveGasPrice: 20000000000n,
    status: 'success' as const,
    logs: [],
    ...overrides,
  };
}

/**
 * Create a mock block for testing
 */
export function createMockBlock(overrides: any = {}) {
  return {
    number: 12345n,
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    parentHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98',
    timestamp: 1640995200n,
    gasLimit: 30000000n,
    gasUsed: 21000n,
    baseFeePerGas: 20000000000n,
    transactions: [],
    ...overrides,
  };
}

/**
 * Create a mock contract ABI for testing
 */
export function createMockABI() {
  return [
    {
      type: 'function',
      name: 'totalSupply',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'transfer',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
      ],
    },
  ];
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random string for testing
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random address for testing
 */
export function generateRandomAddress(): `0x${string}` {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result as `0x${string}`;
}

/**
 * Generate a random Core address for testing
 */
export function generateRandomCoreAddress(): string {
  const randomPart = generateRandomString(20);
  return `CFX:TYPE.USER:${randomPart}`;
}
