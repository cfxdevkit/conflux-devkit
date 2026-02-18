/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { type Abi, decodeFunctionData, getAbiItem, formatUnits } from 'viem';

/**
 * Decoded transaction data
 */
export interface DecodedTransaction {
  functionName: string;
  args: readonly unknown[];
  signature: string;
  parameters: DecodedParameter[];
}

export interface DecodedParameter {
  name: string;
  type: string;
  value: unknown;
  displayValue: string;
}

/**
 * Contract ABI cache for decoding transactions
 */
export interface ContractAbiEntry {
  address: string;
  name: string;
  abi: Abi;
}

/**
 * Global ABI cache - maps lowercase addresses to contract entries
 */
const abiCache = new Map<string, ContractAbiEntry>();

/**
 * Add a contract's ABI to the cache for decoding
 */
export function addContractToCache(entry: ContractAbiEntry): void {
  abiCache.set(entry.address.toLowerCase(), entry);
}

/**
 * Remove a contract from the cache
 */
export function removeContractFromCache(address: string): void {
  abiCache.delete(address.toLowerCase());
}

/**
 * Clear all contracts from the cache
 */
export function clearAbiCache(): void {
  abiCache.clear();
}

/**
 * Get all cached contracts
 */
export function getCachedContracts(): ContractAbiEntry[] {
  return Array.from(abiCache.values());
}

/**
 * Format a parameter value for display
 */
function formatParameterValue(type: string, value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  // Handle BigInt values
  if (typeof value === 'bigint') {
    // Check if it looks like a token amount (18 decimals is common)
    if (type.startsWith('uint') || type.startsWith('int')) {
      const strValue = value.toString();
      // If it's a large number, try formatting with 18 decimals
      if (strValue.length > 12) {
        const formatted = formatUnits(value, 18);
        // Only use formatted value if it makes sense (not too many leading zeros)
        if (!formatted.startsWith('0.000000000000000')) {
          return `${formatted} (raw: ${strValue})`;
        }
      }
      return strValue;
    }
    return value.toString();
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3) {
      return `[${value.map((v) => formatParameterValue('unknown', v)).join(', ')}]`;
    }
    return `[${value.length} items]`;
  }

  // Handle bytes
  if (type === 'bytes' || type.startsWith('bytes')) {
    const strValue = String(value);
    if (strValue.length > 20) {
      return `${strValue.slice(0, 10)}...${strValue.slice(-8)}`;
    }
    return strValue;
  }

  // Handle addresses
  if (type === 'address') {
    const strValue = String(value);
    return `${strValue.slice(0, 6)}...${strValue.slice(-4)}`;
  }

  // Handle strings
  if (type === 'string') {
    const strValue = String(value);
    if (strValue.length > 50) {
      return `"${strValue.slice(0, 47)}..."`;
    }
    return `"${strValue}"`;
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return String(value);
}

/**
 * Try to decode a transaction's input data using cached ABIs
 */
export function decodeTransactionInput(
  input: string,
  toAddress?: string
): DecodedTransaction | null {
  // Skip if no input data or just the empty function selector
  if (!input || input === '0x' || input.length < 10) {
    return null;
  }

  // Try to find the ABI for this contract address first
  if (toAddress) {
    const entry = abiCache.get(toAddress.toLowerCase());
    if (entry) {
      const decoded = tryDecodeWithAbi(input, entry.abi);
      if (decoded) {
        return decoded;
      }
    }
  }

  // If not found or decoding failed, try all cached ABIs
  for (const entry of abiCache.values()) {
    const decoded = tryDecodeWithAbi(input, entry.abi);
    if (decoded) {
      return decoded;
    }
  }

  // Return the function selector if we couldn't decode
  return {
    functionName: `Unknown (${input.slice(0, 10)})`,
    args: [],
    signature: input.slice(0, 10),
    parameters: [],
  };
}

/**
 * Try to decode input data with a specific ABI
 */
function tryDecodeWithAbi(input: string, abi: Abi): DecodedTransaction | null {
  try {
    const { functionName, args } = decodeFunctionData({
      abi,
      data: input as `0x${string}`,
    });

    // Get the function definition from the ABI to get parameter names
    const functionDef = getAbiItem({ abi, name: functionName });

    const parameters: DecodedParameter[] = [];
    const decodedArgs = args ?? [];

    if (functionDef && 'inputs' in functionDef && functionDef.inputs) {
      functionDef.inputs.forEach((input, index) => {
        const value = decodedArgs[index];
        parameters.push({
          name: input.name || `arg${index}`,
          type: input.type,
          value,
          displayValue: formatParameterValue(input.type, value),
        });
      });
    }

    // Build function signature
    const paramTypes = parameters.map((p) => p.type).join(', ');
    const signature = `${functionName}(${paramTypes})`;

    return {
      functionName,
      args: decodedArgs,
      signature,
      parameters,
    };
  } catch {
    // This ABI doesn't match the input data
    return null;
  }
}

/**
 * Get the function selector (first 4 bytes) from input data
 */
export function getFunctionSelector(input: string): string | null {
  if (!input || input === '0x' || input.length < 10) {
    return null;
  }
  return input.slice(0, 10);
}
