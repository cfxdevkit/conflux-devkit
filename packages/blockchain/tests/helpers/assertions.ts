// Custom assertions for blockchain package testing

import type {
  WalletInfo,
  TransactionReceipt,
  NetworkConfig,
} from '@conflux-devkit/core';

/**
 * Assert that a wallet info object is valid
 */
export function expectValidWalletInfo(wallet: WalletInfo) {
  expect(wallet).toBeDefined();
  expect(wallet.index).toBeGreaterThanOrEqual(0);
  expect(wallet.address).toBeDefined();
  expect(wallet.privateKey).toBeDefined();
  expect(wallet.mnemonic).toBeDefined();
  expect(wallet.balance).toBeDefined();
  expect(wallet.balanceFormatted).toBeDefined();
  expect(typeof wallet.isMining).toBe('boolean');
}

/**
 * Assert that a transaction receipt is valid
 */
export function expectValidTransactionReceipt(receipt: TransactionReceipt) {
  expect(receipt).toBeDefined();
  expect(receipt.transactionHash).toBeDefined();
  expect(receipt.blockNumber).toBeDefined();
  expect(receipt.from).toBeDefined();
  expect(receipt.status).toMatch(/^(pending|success|failed)$/);
  expect(receipt.gasUsed).toBeDefined();
  expect(receipt.transactionIndex).toBeDefined();
  expect(receipt.effectiveGasPrice).toBeDefined();
  expect(Array.isArray(receipt.logs)).toBe(true);
}

/**
 * Assert that a network config is valid
 */
export function expectValidNetworkConfig(config: NetworkConfig) {
  expect(config).toBeDefined();
  expect(config.name).toBeDefined();
  expect(config.chainId).toBeDefined();
  expect(config.rpcUrl).toBeDefined();
  expect(config.currency).toBeDefined();
  expect(config.currency.name).toBeDefined();
  expect(config.currency.symbol).toBeDefined();
  expect(config.currency.decimals).toBeDefined();
  expect(typeof config.isTestnet).toBe('boolean');
}

/**
 * Assert that an address is valid (EVM format)
 */
export function expectValidEvmAddress(address: string) {
  expect(address).toBeDefined();
  expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
}

/**
 * Assert that an address is valid (Core format)
 */
export function expectValidCoreAddress(address: string) {
  expect(address).toBeDefined();
  expect(address).toMatch(/^(CFX|CFXTEST|NET):TYPE\.USER:[a-zA-Z0-9]+$/);
}

/**
 * Assert that a private key is valid
 */
export function expectValidPrivateKey(privateKey: string) {
  expect(privateKey).toBeDefined();
  expect(privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
}

/**
 * Assert that a mnemonic is valid
 */
export function expectValidMnemonic(mnemonic: string) {
  expect(mnemonic).toBeDefined();
  expect(mnemonic.split(' ')).toHaveLength(12);
  expect(mnemonic.split(' ').every(word => word.length > 0)).toBe(true);
}

/**
 * Assert that a transaction hash is valid
 */
export function expectValidTransactionHash(hash: string) {
  expect(hash).toBeDefined();
  expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
}

/**
 * Assert that a BigInt value is positive
 */
export function expectPositiveBigInt(value: bigint) {
  expect(value).toBeDefined();
  expect(value).toBeGreaterThan(0n);
}

/**
 * Assert that a BigInt value is non-negative
 */
export function expectNonNegativeBigInt(value: bigint) {
  expect(value).toBeDefined();
  expect(value).toBeGreaterThanOrEqual(0n);
}

/**
 * Assert that a string is a valid hex string
 */
export function expectValidHexString(value: string, prefix: boolean = true) {
  expect(value).toBeDefined();
  if (prefix) {
    expect(value).toMatch(/^0x[a-fA-F0-9]+$/);
  } else {
    expect(value).toMatch(/^[a-fA-F0-9]+$/);
  }
}

/**
 * Assert that a response is a valid RPC response
 */
export function expectValidRpcResponse(response: any) {
  expect(response).toBeDefined();
  expect(response.jsonrpc).toBe('2.0');
  expect(response.id).toBeDefined();
  expect(response.result !== undefined || response.error !== undefined).toBe(
    true
  );
}

/**
 * Assert that a response is a valid RPC error
 */
export function expectValidRpcError(response: any) {
  expect(response).toBeDefined();
  expect(response.jsonrpc).toBe('2.0');
  expect(response.id).toBeDefined();
  expect(response.error).toBeDefined();
  expect(response.error.code).toBeDefined();
  expect(response.error.message).toBeDefined();
}
