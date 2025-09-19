// Client-side wallet types - Browser-safe versions of base types

import type { BaseWalletInfo, BaseAddress } from '@conflux-devkit/core';

// ============================================================================
// Client Address Type
// ============================================================================

export type ClientAddress = string;

// ============================================================================
// Client Wallet Interface
// ============================================================================

export interface ClientWalletInfo
  extends Omit<BaseWalletInfo, 'address' | 'privateKey'> {
  address: ClientAddress; // Browser-safe address
  privateKey: string; // Browser-safe private key
  balance: string; // Browser-safe balance (string for JSON serialization)
  balanceFormatted: string; // Human-readable balance
  isDefault?: boolean; // Whether this is the default wallet
  name?: string; // Optional display name for the wallet
  network?: string; // Network this wallet is associated with
}

// ============================================================================
// Client Wallet Creation Options
// ============================================================================

export interface ClientWalletCreateOptions {
  mnemonic?: string;
  name?: string;
  isDefault?: boolean;
  network?: string;
}

// ============================================================================
// Client Wallet Import Options
// ============================================================================

export interface ClientWalletImportOptions {
  privateKey: string;
  name?: string;
  isDefault?: boolean;
  network?: string;
}

// ============================================================================
// Client Wallet Update Options
// ============================================================================

export interface ClientWalletUpdateOptions {
  name?: string;
  isDefault?: boolean;
  network?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isClientAddress(value: unknown): value is ClientAddress {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isClientWalletInfo(value: unknown): value is ClientWalletInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'address' in value &&
    'privateKey' in value &&
    'index' in value &&
    'balance' in value &&
    'balanceFormatted' in value &&
    isClientAddress((value as any).address) &&
    typeof (value as any).privateKey === 'string' &&
    typeof (value as any).balance === 'string' &&
    typeof (value as any).balanceFormatted === 'string' &&
    typeof (value as any).index === 'number'
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createClientWalletInfo(
  base: BaseWalletInfo,
  balance: string = '0',
  balanceFormatted: string = '0',
  options: Partial<ClientWalletCreateOptions> = {}
): ClientWalletInfo {
  return {
    ...base,
    address: base.address,
    privateKey: base.privateKey,
    balance,
    balanceFormatted,
    isDefault: options.isDefault ?? false,
    name: options.name,
    network: options.network,
  };
}

export function normalizeClientAddress(address: string): ClientAddress {
  if (!isClientAddress(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  return address.toLowerCase() as ClientAddress;
}

export function formatClientBalance(
  balance: string,
  decimals: number = 18,
  symbol: string = 'CFX'
): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';

  const formatted = (num / Math.pow(10, decimals)).toFixed(6);
  return `${formatted} ${symbol}`;
}
