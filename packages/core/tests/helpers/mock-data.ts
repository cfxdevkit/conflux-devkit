// Mock data for testing

import type { NetworkConfig } from '../../src/types/blockchain';

/**
 * Sample network configurations for testing
 */
export const MOCK_NETWORKS: Record<string, NetworkConfig> = {
  mainnetCore: {
    name: 'Conflux Mainnet Core',
    chainId: 2029,
    rpcUrl: 'https://main.confluxrpc.com',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
  },
  mainnetEvm: {
    name: 'Conflux Mainnet EVM',
    chainId: 2029,
    evmChainId: 2030,
    rpcUrl: 'https://main.confluxrpc.com',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
  },
  testnetCore: {
    name: 'Conflux Testnet Core',
    chainId: 2029,
    rpcUrl: 'https://test.confluxrpc.com',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
  },
  testnetEvm: {
    name: 'Conflux Testnet EVM',
    chainId: 2029,
    evmChainId: 2030,
    rpcUrl: 'https://test.confluxrpc.com',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
  },
  localCore: {
    name: 'Conflux Local Core',
    chainId: 2029,
    rpcUrl: 'http://localhost:12537',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
  },
  localEvm: {
    name: 'Conflux Local EVM',
    chainId: 2029,
    evmChainId: 2030,
    rpcUrl: 'http://localhost:8545',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: true,
  },
};

/**
 * Sample addresses for testing
 */
export const MOCK_ADDRESSES = {
  evm: '0x1234567890abcdef1234567890abcdef12345678' as const,
  core: 'CFX:TYPE.USER:abc123def456',
  coreTestnet: 'CFXTEST:TYPE.USER:abc123def456',
  coreLocal: 'NET:TYPE.USER:abc123def456',
  invalid: 'invalid-address',
  empty: '',
  short: '0x1234',
};

/**
 * Sample BigInt values for testing
 */
export const MOCK_BIGINTS = {
  zero: 0n,
  one: 1n,
  thousand: 1000n,
  million: 1000000n,
  billion: 1000000000n,
  wei: 1000000000000000000n, // 1 CFX in wei
  negative: -1000n,
  max: BigInt(Number.MAX_SAFE_INTEGER),
  min: BigInt(Number.MIN_SAFE_INTEGER),
};

/**
 * Sample transaction hashes for testing
 */
export const MOCK_TX_HASHES = {
  valid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  short: '0x1234',
  invalid: 'invalid-hash',
  empty: '',
};

/**
 * Sample block numbers for testing
 */
export const MOCK_BLOCK_NUMBERS = {
  zero: 0n,
  one: 1n,
  thousand: 1000n,
  million: 1000000n,
  max: BigInt(Number.MAX_SAFE_INTEGER),
  negative: -1n,
};

/**
 * Sample API responses for testing
 */
export const MOCK_API_RESPONSES = {
  success: {
    success: true,
    data: { message: 'success', value: 42 },
    meta: {
      requestId: 'req-123',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      duration: 150,
      version: '1.0.0',
    },
  },
  error: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: { field: 'email', reason: 'Invalid format' },
      timestamp: new Date('2024-01-01T00:00:00Z'),
    },
  },
  paginated: {
    success: true,
    data: [1, 2, 3, 4, 5],
    meta: {
      pagination: {
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
      },
      requestId: 'req-123',
      timestamp: new Date('2024-01-01T00:00:00Z'),
    },
  },
};

/**
 * Sample contract ABI for testing
 */
export const MOCK_CONTRACT_ABI = [
  {
    type: 'constructor',
    inputs: [{ name: 'initialSupply', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
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
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
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
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
];

/**
 * Sample contract deployment result for testing
 */
export const MOCK_DEPLOYMENT_RESULT = {
  contractName: 'TestToken',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
  blockNumber: 12345n,
  blockHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98',
  gasUsed: 1000000n,
  gasPrice: 20000000000n,
  abi: MOCK_CONTRACT_ABI,
  bytecode: '0x608060405234801561001057600080fd5b50...',
  deployedBytecode: '0x608060405234801561001057600080fd5b50...',
  deployedAt: new Date('2024-01-01T00:00:00Z'),
  network: 'evm',
  networkId: '2030',
  chainId: 2030,
  evmChainId: 2030,
  chainType: 'evm',
  typesGenerated: true,
};
