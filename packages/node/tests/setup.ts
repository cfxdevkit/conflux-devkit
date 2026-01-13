/**
 * Test Setup - Global configuration for all tests
 */

// Increase test timeout for integration tests
import { afterAll, beforeAll, vi } from 'vitest';

// Global test timeout
beforeAll(() => {
  // Configure global test timeout
  vi.setConfig({ testTimeout: 60000 });
});

afterAll(() => {
  // Clean up any global resources
});

// Mock external dependencies if needed
vi.mock('@xcfx/node', () => ({
  createServer: vi.fn().mockImplementation(function () {
    return {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    };
  }),
  ConfluxNode: vi.fn().mockImplementation(function () {
    return {
      start: vi.fn(),
      stop: vi.fn(),
      getAccounts: vi.fn(() => []),
      // Add other mocked methods as needed
    };
  }),
}));

// Export test utilities
export const TEST_CONFIG = {
  chainId: 1029,
  evmChainId: 1030,
  jsonrpcHttpPort: 12537,
  jsonrpcHttpEthPort: 8545,
  jsonrpcWsPort: 12535,
  log: false,
};

export const MOCK_ACCOUNT = {
  index: 0,
  privateKey:
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  coreAddress: 'cfx:aang83fkv36m0rwayav8gp8xhnghvj56ua1sk87e04',
  evmAddress: '0x1234567890123456789012345678901234567890',
  mnemonic:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  path: "m/44'/60'/0'/0/0",
};
