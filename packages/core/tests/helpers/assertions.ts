// Custom assertions for testing

import { expect } from 'vitest';

/**
 * Assert that a value is a valid EVM address
 */
export function expectValidEvmAddress(address: string): void {
  expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
}

/**
 * Assert that a value is a valid Core address
 */
export function expectValidCoreAddress(address: string): void {
  expect(address).toMatch(/^(CFX|CFXTEST|NET):TYPE\.USER:[a-zA-Z0-9]+$/);
}

/**
 * Assert that a value is a valid address (either EVM or Core)
 */
export function expectValidAddress(address: string): void {
  const isEvm = address.match(/^0x[a-fA-F0-9]{40}$/);
  const isCore = address.match(/^(CFX|CFXTEST|NET):TYPE\.USER:[a-zA-Z0-9]+$/);
  expect(isEvm || isCore).toBeTruthy();
}

/**
 * Assert that a value is a valid BigInt string
 */
export function expectValidBigIntString(value: string): void {
  expect(value).toMatch(/^-?\d+$/);
  expect(() => BigInt(value)).not.toThrow();
}

/**
 * Assert that a value is a valid transaction hash
 */
export function expectValidTxHash(hash: string): void {
  expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
}

/**
 * Assert that a value is a valid block number
 */
export function expectValidBlockNumber(blockNumber: string | bigint): void {
  const num = typeof blockNumber === 'string' ? blockNumber : blockNumber.toString();
  expectValidBigIntString(num);
  expect(BigInt(num)).toBeGreaterThanOrEqual(0n);
}

/**
 * Assert that an API response is successful
 */
export function expectSuccessResponse(response: any): void {
  expect(response).toHaveProperty('success', true);
  expect(response).toHaveProperty('data');
  expect(response).not.toHaveProperty('error');
}

/**
 * Assert that an API response is an error
 */
export function expectErrorResponse(response: any): void {
  expect(response).toHaveProperty('success', false);
  expect(response).toHaveProperty('error');
  expect(response.error).toHaveProperty('code');
  expect(response.error).toHaveProperty('message');
  expect(response.error).toHaveProperty('timestamp');
  expect(response).not.toHaveProperty('data');
}

/**
 * Assert that a network configuration is valid
 */
export function expectValidNetworkConfig(config: any): void {
  expect(config).toHaveProperty('name');
  expect(config).toHaveProperty('chainId');
  expect(config).toHaveProperty('rpcUrl');
  expect(config).toHaveProperty('currency');
  expect(config.currency).toHaveProperty('name');
  expect(config.currency).toHaveProperty('symbol');
  expect(config.currency).toHaveProperty('decimals');
  expect(config).toHaveProperty('isTestnet');
  expect(typeof config.isTestnet).toBe('boolean');
}

/**
 * Assert that a wallet info is valid
 */
export function expectValidWalletInfo(wallet: any): void {
  expect(wallet).toHaveProperty('index');
  expect(wallet).toHaveProperty('address');
  expect(wallet).toHaveProperty('privateKey');
  expect(wallet).toHaveProperty('mnemonic');
  expect(wallet).toHaveProperty('balance');
  expect(wallet).toHaveProperty('balanceFormatted');
  expect(wallet).toHaveProperty('isMining');
  expectValidAddress(wallet.address);
  expectValidBigIntString(wallet.balance);
}

/**
 * Assert that a transaction receipt is valid
 */
export function expectValidTransactionReceipt(receipt: any): void {
  expect(receipt).toHaveProperty('transactionHash');
  expect(receipt).toHaveProperty('blockNumber');
  expect(receipt).toHaveProperty('blockHash');
  expect(receipt).toHaveProperty('transactionIndex');
  expect(receipt).toHaveProperty('from');
  expect(receipt).toHaveProperty('to');
  expect(receipt).toHaveProperty('gasUsed');
  expect(receipt).toHaveProperty('effectiveGasPrice');
  expect(receipt).toHaveProperty('status');
  expect(receipt).toHaveProperty('logs');
  expectValidTxHash(receipt.transactionHash);
  expectValidAddress(receipt.from);
  expectValidAddress(receipt.to);
  expectValidBigIntString(receipt.blockNumber);
  expectValidBigIntString(receipt.gasUsed);
  expectValidBigIntString(receipt.effectiveGasPrice);
}

/**
 * Assert that a contract orchestrator is valid
 */
export function expectValidContractOrchestrator(orchestrator: any): void {
  expect(orchestrator).toHaveProperty('name');
  expect(orchestrator).toHaveProperty('address');
  expect(orchestrator).toHaveProperty('abi');
  expect(orchestrator).toHaveProperty('bytecode');
  expect(orchestrator).toHaveProperty('deployedBytecode');
  expect(orchestrator).toHaveProperty('chainType');
  expect(orchestrator).toHaveProperty('networkId');
  expect(orchestrator).toHaveProperty('chainId');
  expect(orchestrator).toHaveProperty('evmChainId');
  expect(orchestrator).toHaveProperty('network');
  expect(orchestrator).toHaveProperty('methods');
  expect(orchestrator).toHaveProperty('capabilities');
  expectValidAddress(orchestrator.address);
  expect(typeof orchestrator.name).toBe('string');
  expect(typeof orchestrator.chainType).toBe('string');
  expect(['core', 'evm']).toContain(orchestrator.chainType);
}

/**
 * Assert that an error has the expected properties
 */
export function expectValidError(error: any, expectedCode?: string): void {
  expect(error).toHaveProperty('name');
  expect(error).toHaveProperty('message');
  expect(error).toHaveProperty('code');
  expect(error).toHaveProperty('stack');
  if (expectedCode) {
    expect(error.code).toBe(expectedCode);
  }
}

/**
 * Assert that a value is within a range
 */
export function expectInRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Assert that a value is a valid timestamp
 */
export function expectValidTimestamp(timestamp: any): void {
  expect(timestamp).toBeInstanceOf(Date);
  expect(timestamp.getTime()).toBeGreaterThan(0);
  expect(timestamp.getTime()).toBeLessThan(Date.now() + 1000); // Allow 1 second future
}
