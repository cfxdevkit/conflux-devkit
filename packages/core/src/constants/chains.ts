// Chain constants

export const CHAIN_IDS = {
  CONFLUX_TESTNET: 1,
  CONFLUX_MAINNET: 1029,
  LOCAL_DEVELOPMENT: 2030,
} as const;

export const EVM_CHAIN_IDS = {
  CONFLUX_TESTNET: 71,
  CONFLUX_MAINNET: 1030,
  LOCAL_DEVELOPMENT: 2031,
} as const;

export const CURRENCY_SYMBOLS = {
  CFX: 'CFX',
  DCFX: 'DCFX',
} as const;

export const WALLET_TYPES = {
  MNEMONIC: 'mnemonic',
  PRIVATE_KEY: 'privateKey',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export const DEFAULT_GAS_LIMITS = {
  SIMPLE_TRANSFER: 21000,
  CONTRACT_CALL: 100000,
  CONTRACT_DEPLOYMENT: 500000,
} as const;

export const DEFAULT_GAS_PRICES = {
  LOW: 1000000000n, // 1 gwei
  MEDIUM: 2000000000n, // 2 gwei
  HIGH: 5000000000n, // 5 gwei
} as const;
