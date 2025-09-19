// Validation types and schemas

// Input validation types
export interface WalletInput {
  address: `0x${string}`; // Must be valid hex address
  privateKey: `0x${string}`; // Must be valid hex private key
  mnemonic?: string; // Must be valid BIP39 mnemonic
}

export interface TransactionInput {
  to: `0x${string}`; // Must be valid hex address
  value: bigint; // Must be valid bigint
  data?: `0x${string}`; // Must be valid hex data
  gasLimit?: bigint; // Must be valid bigint
  gasPrice?: bigint; // Must be valid bigint
}

export interface ContractInput {
  address: `0x${string}`; // Must be valid hex address
  abi: AbiItem[]; // Must be valid ABI
  name: string; // Must be non-empty string
}

export interface NodeConfigInput {
  corePort?: number; // Must be valid port number
  evmPort?: number; // Must be valid port number
  blockInterval?: number; // Must be positive number
  chainId?: number; // Must be valid chain ID
  evmChainId?: number; // Must be valid chain ID
  dataDir?: string; // Must be valid directory path
  silent?: boolean;
  walletMode?: 'mnemonic' | 'privatekey';
  mnemonic?: string; // Must be valid BIP39 mnemonic if provided
  privateKey?: string; // Must be valid hex private key if provided
  fundWallets?: boolean;
  walletCount?: number; // Must be positive number
}

// Validation result types
export interface ValidationFieldError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationFieldError[];
}

// Validation error codes
export const VALIDATION_ERROR_CODES = {
  REQUIRED: 'REQUIRED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_TYPE: 'INVALID_TYPE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_PATTERN: 'INVALID_PATTERN',
  INVALID_VALUE: 'INVALID_VALUE',
} as const;

export type ValidationErrorCode =
  (typeof VALIDATION_ERROR_CODES)[keyof typeof VALIDATION_ERROR_CODES];

// Validation utility functions
export function createValidationFieldError(
  field: string,
  message: string,
  code: ValidationErrorCode,
  value?: unknown
): ValidationFieldError {
  return {
    field,
    message,
    code,
    value,
  };
}

export function createValidationResult<T>(
  success: boolean,
  data?: T,
  errors: ValidationFieldError[] = []
): ValidationResult<T> {
  return {
    success,
    data,
    errors,
  };
}

// Import AbiItem from blockchain types
import type { AbiItem } from './blockchain';
