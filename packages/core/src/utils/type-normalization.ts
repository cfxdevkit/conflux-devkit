// Type normalization utilities for different client formats and browser compatibility

// Core address format from cive (e.g., "CFX:TYPE.USER:abc123...")
export type CoreAddress = string;

// EVM address format from viem (e.g., "0xabc123...")
export type EvmAddress = `0x${string}`;

// Unified address type that can represent both formats
export type UnifiedAddress = CoreAddress | EvmAddress;

// Browser-safe address (always a string)
export type BrowserAddress = string;

// Network type for determining which client to use
export type NetworkType = 'core' | 'evm';

/**
 * Normalize an address to browser-safe string format
 * Handles both Core and EVM address formats
 */
export function normalizeAddress(address: UnifiedAddress): BrowserAddress {
  if (typeof address === 'string') {
    // Handle Core address format
    if (
      address.startsWith('CFX:') ||
      address.startsWith('CFXTEST:') ||
      address.startsWith('NET')
    ) {
      return address;
    }
    // Handle EVM address format
    if (address.startsWith('0x')) {
      return address;
    }
    // Fallback for other string formats
    return address;
  }

  // Handle viem Address type (which is `0x${string}`)
  return address as string;
}

/**
 * Convert address to EVM format (0x...)
 * Throws error if conversion is not possible
 */
export function toEvmAddress(address: UnifiedAddress): EvmAddress {
  const normalized = normalizeAddress(address);

  if (normalized.startsWith('0x')) {
    return normalized as EvmAddress;
  }

  // For Core addresses, we would need to convert them to EVM format
  // This is a complex operation that requires the Conflux SDK
  throw new Error(`Cannot convert Core address to EVM format: ${normalized}`);
}

/**
 * Convert address to Core format (CFX:...)
 * Throws error if conversion is not possible
 */
export function toCoreAddress(address: UnifiedAddress): CoreAddress {
  const normalized = normalizeAddress(address);

  if (
    normalized.startsWith('CFX:') ||
    normalized.startsWith('CFXTEST:') ||
    normalized.startsWith('NET')
  ) {
    return normalized;
  }

  // For EVM addresses, we would need to convert them to Core format
  // This is a complex operation that requires the Conflux SDK
  throw new Error(`Cannot convert EVM address to Core format: ${normalized}`);
}

/**
 * Check if an address is in EVM format
 */
export function isEvmAddress(address: UnifiedAddress): boolean {
  const normalized = normalizeAddress(address);
  return normalized.startsWith('0x');
}

/**
 * Check if an address is in Core format
 */
export function isCoreAddress(address: UnifiedAddress): boolean {
  const normalized = normalizeAddress(address);
  return (
    normalized.startsWith('CFX:') ||
    normalized.startsWith('CFXTEST:') ||
    normalized.startsWith('NET')
  );
}

/**
 * Get the network type based on address format
 */
export function getAddressNetworkType(address: UnifiedAddress): NetworkType {
  if (isEvmAddress(address)) {
    return 'evm';
  }
  if (isCoreAddress(address)) {
    return 'core';
  }
  throw new Error(`Unknown address format: ${address}`);
}

/**
 * Normalize bigint values to browser-safe strings
 */
export function normalizeBigInt(value: bigint | string | number): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value;
}

/**
 * Normalize bigint values to browser-safe strings with formatting
 */
export function normalizeBigIntFormatted(
  value: bigint | string | number,
  decimals: number = 18
): string {
  const str = normalizeBigInt(value);
  const num = BigInt(str);
  const divisor = BigInt(10 ** decimals);
  const quotient = num / divisor;
  const remainder = num % divisor;

  if (remainder === 0n) {
    return quotient.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');

  if (trimmed === '') {
    return quotient.toString();
  }

  return `${quotient}.${trimmed}`;
}

/**
 * Normalize transaction hash to browser-safe string
 */
export function normalizeTxHash(hash: string | `0x${string}`): string {
  if (typeof hash === 'string') {
    return hash;
  }
  return hash as string;
}

/**
 * Normalize block number to browser-safe string
 */
export function normalizeBlockNumber(
  blockNumber: bigint | number | string
): string {
  if (typeof blockNumber === 'bigint') {
    return blockNumber.toString();
  }
  if (typeof blockNumber === 'number') {
    return blockNumber.toString();
  }
  return blockNumber;
}

/**
 * Create a browser-safe object from blockchain data
 */
export function createBrowserSafeObject<T extends Record<string, unknown>>(
  data: T,
  addressFields: (keyof T)[] = [],
  bigintFields: (keyof T)[] = [],
  hashFields: (keyof T)[] = []
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (addressFields.includes(key as keyof T)) {
      result[key] = normalizeAddress(value as UnifiedAddress);
    } else if (bigintFields.includes(key as keyof T)) {
      result[key] = normalizeBigInt(value as string | number | bigint);
    } else if (hashFields.includes(key as keyof T)) {
      result[key] = normalizeTxHash(value as string);
    } else if (typeof value === 'bigint') {
      result[key] = normalizeBigInt(value);
    } else if (typeof value === 'string') {
      result[key] = value;
    } else if (typeof value === 'number') {
      result[key] = value.toString();
    } else if (value === null || value === undefined) {
      result[key] = '';
    } else if (Array.isArray(value)) {
      result[key] = JSON.stringify(
        value.map((item) =>
          typeof item === 'bigint'
            ? normalizeBigInt(item)
            : typeof item === 'object' && item !== null
              ? createBrowserSafeObject(item as Record<string, unknown>)
              : String(item)
        )
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = JSON.stringify(
        createBrowserSafeObject(value as Record<string, unknown>)
      );
    } else {
      result[key] = String(value);
    }
  }

  return result;
}
