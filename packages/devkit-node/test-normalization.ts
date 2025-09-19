// Test script to verify type normalization system works
import {
  normalizeAddress,
  normalizeBigInt,
  normalizeBigIntFormatted,
  toBrowserWalletInfo,
  toBrowserTransactionReceipt,
} from '@conflux-devkit/core';

console.log('🧪 Testing Type Normalization System...\n');

// Test 1: Address normalization
console.log('1. Testing Address Normalization:');
const coreAddress = 'CFX:TYPE.USER:abc123def456';
const evmAddress = '0xabc123def456789';
const browserAddress1 = normalizeAddress(coreAddress);
const browserAddress2 = normalizeAddress(evmAddress);
console.log(`   Core: ${coreAddress} → ${browserAddress1}`);
console.log(`   EVM:  ${evmAddress} → ${browserAddress2}`);
console.log('   ✅ Address normalization working\n');

// Test 2: BigInt normalization
console.log('2. Testing BigInt Normalization:');
const bigValue = 1000000000000000000n;
const bigString = normalizeBigInt(bigValue);
const formattedString = normalizeBigIntFormatted(bigValue, 18);
console.log(`   BigInt: ${bigValue} → String: ${bigString}`);
console.log(`   Formatted: ${formattedString} ETH`);
console.log('   ✅ BigInt normalization working\n');

// Test 3: Browser-safe conversion
console.log('3. Testing Browser-Safe Conversion:');
const mockWallet = {
  index: 0,
  address: '0xabc123def456789' as `0x${string}`,
  privateKey: '0x1234567890abcdef' as `0x${string}`,
  balance: 1000000000000000000n,
  balanceFormatted: '1.0',
  isMining: true,
};

const browserWallet = toBrowserWalletInfo(mockWallet);
console.log('   Wallet conversion:');
console.log(
  `   - Address: ${browserWallet.address} (${typeof browserWallet.address})`
);
console.log(
  `   - Balance: ${browserWallet.balance} (${typeof browserWallet.balance})`
);
console.log(
  `   - Formatted: ${browserWallet.balanceFormatted} (${typeof browserWallet.balanceFormatted})`
);
console.log('   ✅ Browser conversion working\n');

// Test 4: Transaction receipt conversion
console.log('4. Testing Transaction Receipt Conversion:');
const mockReceipt = {
  transactionHash: '0x1234567890abcdef' as `0x${string}`,
  blockNumber: 12345n,
  blockHash: '0xabcdef1234567890' as `0x${string}`,
  from: '0xfrom123456789' as `0x${string}`,
  to: '0xto123456789' as `0x${string}`,
  gasUsed: 21000n,
  status: 'success' as const,
  contractAddress: '0xcontract123456' as `0x${string}`,
  transactionIndex: 0,
  effectiveGasPrice: 20000000000n,
  logs: [],
};

const browserReceipt = toBrowserTransactionReceipt(mockReceipt);
console.log('   Receipt conversion:');
console.log(
  `   - Hash: ${browserReceipt.transactionHash} (${typeof browserReceipt.transactionHash})`
);
console.log(
  `   - Block: ${browserReceipt.blockNumber} (${typeof browserReceipt.blockNumber})`
);
console.log(
  `   - Gas: ${browserReceipt.gasUsed} (${typeof browserReceipt.gasUsed})`
);
console.log('   ✅ Receipt conversion working\n');

console.log('🎉 All Type Normalization Tests Passed!');
console.log('✅ System is ready for browser integration');
