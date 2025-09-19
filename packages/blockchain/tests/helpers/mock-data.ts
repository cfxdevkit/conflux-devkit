// Mock data for blockchain package testing

import type { NetworkConfig } from '@conflux-devkit/core';

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
    networkType: 'core',
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
    networkType: 'evm',
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
    networkType: 'core',
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
    networkType: 'evm',
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
    networkType: 'core',
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
    networkType: 'evm',
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
 * Sample private keys for testing
 */
export const MOCK_PRIVATE_KEYS = {
  valid:
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as `0x${string}`,
  invalid: 'invalid-key',
  short: '0x1234',
  empty: '',
};

/**
 * Sample mnemonics for testing
 */
export const MOCK_MNEMONICS = {
  valid:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  invalid: 'invalid mnemonic phrase',
  short: 'abandon abandon',
  empty: '',
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
 * Sample contract ABIs for testing
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
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
];

/**
 * Sample contract bytecode for testing
 */
export const MOCK_CONTRACT_BYTECODE =
  '0x608060405234801561001057600080fd5b50...';

/**
 * Sample RPC responses for testing
 */
export const MOCK_RPC_RESPONSES = {
  getBalance: {
    jsonrpc: '2.0',
    id: 1,
    result: '0xde0b6b3a7640000', // 1 ETH in hex
  },
  getBlockNumber: {
    jsonrpc: '2.0',
    id: 1,
    result: '0x3039', // 12345 in hex
  },
  getTransactionCount: {
    jsonrpc: '2.0',
    id: 1,
    result: '0x0', // 0 in hex
  },
  sendTransaction: {
    jsonrpc: '2.0',
    id: 1,
    result:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  call: {
    jsonrpc: '2.0',
    id: 1,
    result:
      '0x0000000000000000000000000000000000000000000000000000000000000064',
  },
  error: {
    jsonrpc: '2.0',
    id: 1,
    error: {
      code: -32601,
      message: 'Method not found',
    },
  },
};
