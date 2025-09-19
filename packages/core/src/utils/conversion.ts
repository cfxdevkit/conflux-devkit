// Type conversion utilities

/**
 * Convert string to bigint safely
 */
export function stringToBigInt(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Invalid bigint value: ${value}`);
  }
}

/**
 * Convert bigint to string
 */
export function bigIntToString(value: bigint): string {
  return value.toString();
}

/**
 * Convert hex string to bigint
 */
export function hexToBigInt(hex: `0x${string}`): bigint {
  return BigInt(hex);
}

/**
 * Convert bigint to hex string
 */
export function bigIntToHex(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}` as `0x${string}`;
}

/**
 * Convert number to hex string
 */
export function numberToHex(value: number): `0x${string}` {
  return `0x${value.toString(16)}` as `0x${string}`;
}

/**
 * Convert hex string to number
 */
export function hexToNumber(hex: `0x${string}`): number {
  return parseInt(hex, 16);
}

/**
 * Convert string to number safely
 */
export function stringToNumber(value: string): number {
  const num = parseFloat(value);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid number value: ${value}`);
  }
  return num;
}

/**
 * Convert number to string
 */
export function numberToString(value: number): string {
  return value.toString();
}
