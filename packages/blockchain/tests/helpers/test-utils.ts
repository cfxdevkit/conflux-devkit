// Test utilities for blockchain package

import type {
  NetworkConfig,
  WalletInfo,
  TransactionRequest,
} from '@conflux-devkit/core';

/**
 * Create mock network configuration for testing
 */
export function createMockNetworkConfig(
  overrides: Partial<NetworkConfig> = {}
): NetworkConfig {
  return {
    name: 'Test Network',
    chainId: 2029,
    rpcUrl: 'https://test.confluxrpc.com',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
    evmChainId: 2030,
    networkType: 'evm',
    ...overrides,
  };
}

/**
 * Create mock wallet info for testing
 */
export function createMockWalletInfo(
  overrides: Partial<WalletInfo> = {}
): WalletInfo {
  return {
    index: 0,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    privateKey:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    mnemonic:
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    balance: 1000000000000000000n,
    balanceFormatted: '1.0 CFX',
    isMining: false,
    ...overrides,
  };
}

/**
 * Create mock transaction request for testing
 */
export function createMockTransactionRequest(
  overrides: Partial<TransactionRequest> = {}
): TransactionRequest {
  return {
    to: '0x9876543210fedcba9876543210fedcba98765432',
    value: 1000000000000000000n,
    gas: 21000n,
    gasPrice: 20000000000n,
    nonce: 0,
    ...overrides,
  };
}

/**
 * Create mock block for testing
 */
export function createMockBlock(overrides: any = {}) {
  return {
    number: 12345n,
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    parentHash:
      '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98',
    timestamp: 1640995200n,
    gasLimit: 30000000n,
    gasUsed: 21000n,
    transactions: [],
    ...overrides,
  };
}

/**
 * Create mock transaction receipt for testing
 */
export function createMockTransactionReceipt(overrides: any = {}) {
  return {
    transactionHash:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 12345n,
    blockHash:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0x9876543210fedcba9876543210fedcba98765432',
    gasUsed: 21000n,
    status: 'success' as const,
    transactionIndex: 0,
    effectiveGasPrice: 20000000000n,
    logs: [],
    ...overrides,
  };
}

/**
 * Create mock contract call result for testing
 */
export function createMockContractCallResult(overrides: any = {}) {
  return {
    result:
      '0x0000000000000000000000000000000000000000000000000000000000000064',
    gasUsed: 21000n,
    blockNumber: 12345n,
    ...overrides,
  };
}

/**
 * Create mock deployment result for testing
 */
export function createMockDeploymentResult(overrides: any = {}) {
  return {
    id: 'deploy-123',
    network: 'evm',
    contract: 'TestToken',
    address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
    txHash:
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as `0x${string}`,
    gasUsed: 1000000n,
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
    isMock: false,
    blockNumber: 12345n,
    confirmations: 1,
    ...overrides,
  };
}

/**
 * Mock RPC response for testing
 */
export function createMockRpcResponse<T>(result: T, id: string | number = 1) {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Mock RPC error for testing
 */
export function createMockRpcError(
  code: number,
  message: string,
  id: string | number = 1
) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  };
}

/**
 * Wait for a specified amount of time (for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock fetch function for testing
 */
export function createMockFetch(responses: any[] = []) {
  let callCount = 0;
  return jest.fn().mockImplementation(() => {
    const response = responses[callCount] || responses[responses.length - 1];
    callCount++;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    });
  });
}
