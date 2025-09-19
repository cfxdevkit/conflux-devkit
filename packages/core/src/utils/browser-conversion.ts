// Browser-safe conversion utilities

import type {
  Block,
  ContractCallResult,
  DeploymentResult,
  NetworkConfig,
  Transaction,
  TransactionReceipt,
  WalletInfo,
} from '../types/blockchain';
import type {
  BrowserBlock,
  BrowserContractCallResult,
  BrowserContractOrchestrator,
  BrowserDeploymentResult,
  BrowserNetworkConfig,
  BrowserNodeStatus,
  BrowserTransaction,
  BrowserTransactionReceipt,
  BrowserWalletInfo,
} from '../types/browser-safe';
import type {
  ContractEvent,
  ContractMethod,
  ContractOrchestrator,
} from '../types/contract-orchestration';
import type { NodeStatus } from '../types/node';
import {
  createBrowserSafeObject,
  normalizeAddress,
  normalizeBigInt,
  normalizeBlockNumber,
  normalizeTxHash,
} from './type-normalization';

/**
 * Convert WalletInfo to browser-safe format
 */
export function toBrowserWalletInfo(wallet: WalletInfo): BrowserWalletInfo {
  return {
    index: wallet.index,
    address: normalizeAddress(wallet.address),
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic,
    balance: wallet.balance ? normalizeBigInt(wallet.balance) : '0',
    balanceFormatted: wallet.balanceFormatted || '0',
    isMining: wallet.isMining || false,
  };
}

/**
 * Convert TransactionReceipt to browser-safe format
 */
export function toBrowserTransactionReceipt(
  receipt: TransactionReceipt
): BrowserTransactionReceipt {
  const result: BrowserTransactionReceipt = {
    transactionHash: normalizeTxHash(receipt.transactionHash),
    blockNumber: normalizeBlockNumber(receipt.blockNumber || 0),
    blockHash: receipt.blockHash || '',
    from: normalizeAddress(receipt.from),
    to: receipt.to ? normalizeAddress(receipt.to) : null,
    gasUsed: receipt.gasUsed ? normalizeBigInt(receipt.gasUsed) : '0',
    status: receipt.status,
    transactionIndex: normalizeBigInt(receipt.transactionIndex || 0),
    effectiveGasPrice: receipt.effectiveGasPrice
      ? normalizeBigInt(receipt.effectiveGasPrice)
      : '0',
    logs: receipt.logs.map((log) => ({
      address: normalizeAddress(log.address),
      topics: log.topics,
      data: log.data,
      blockNumber: normalizeBlockNumber(log.blockNumber || 0),
      blockHash: log.blockHash || '',
      transactionHash: normalizeTxHash(log.transactionHash || ''),
      logIndex: normalizeBigInt(log.logIndex || 0),
      transactionIndex: normalizeBigInt(log.transactionIndex || 0),
      removed: log.removed || false,
    })),
  };

  // Only include contractAddress if it's defined
  if (receipt.contractAddress !== undefined) {
    result.contractAddress = receipt.contractAddress
      ? normalizeAddress(receipt.contractAddress)
      : null;
  }

  return result;
}

/**
 * Convert Block to browser-safe format
 */
export function toBrowserBlock(block: Block): BrowserBlock {
  return {
    number: block.number ? normalizeBlockNumber(block.number) : null,
    hash: block.hash || '',
    parentHash: block.parentHash,
    timestamp: normalizeBigInt(block.timestamp),
    gasLimit: normalizeBigInt(block.gasLimit),
    gasUsed: block.gasUsed ? normalizeBigInt(block.gasUsed) : '0',
    baseFeePerGas: '0', // Not available in Block interface
    transactions: block.transactions.map((tx) =>
      typeof tx === 'string' ? tx : normalizeTxHash(tx.hash)
    ),
  };
}

/**
 * Convert Transaction to browser-safe format
 */
export function toBrowserTransaction(
  transaction: Transaction
): BrowserTransaction {
  return {
    hash: normalizeTxHash(transaction.hash),
    from: normalizeAddress(transaction.from),
    to: transaction.to ? normalizeAddress(transaction.to) : null,
    value: transaction.value ? normalizeBigInt(transaction.value) : '0',
    gas: transaction.gas ? normalizeBigInt(transaction.gas) : '0',
    gasPrice: transaction.gasPrice
      ? normalizeBigInt(transaction.gasPrice)
      : '0',
    nonce: normalizeBigInt(transaction.nonce),
    blockNumber: transaction.blockNumber
      ? normalizeBlockNumber(transaction.blockNumber)
      : null,
    blockHash: transaction.blockHash,
    transactionIndex: transaction.transactionIndex
      ? normalizeBigInt(transaction.transactionIndex)
      : '0',
  };
}

/**
 * Convert ContractCallResult to browser-safe format
 */
export function toBrowserContractCallResult(
  result: ContractCallResult
): BrowserContractCallResult {
  return {
    result: JSON.stringify(result.result),
    gasUsed: normalizeBigInt(result.gasUsed),
    blockNumber: normalizeBlockNumber(result.blockNumber),
  };
}

/**
 * Convert DeploymentResult to browser-safe format
 */
export function toBrowserDeploymentResult(
  result: DeploymentResult
): BrowserDeploymentResult {
  return {
    contractName: result.contract,
    address: normalizeAddress(result.address),
    txHash: normalizeTxHash(result.txHash),
    gasUsed: normalizeBigInt(result.gasUsed),
    timestamp:
      result.timestamp instanceof Date
        ? result.timestamp.toISOString()
        : result.timestamp,
    abi: '[]', // Not available in DeploymentResult interface
    bytecode: '0x', // Not available in DeploymentResult interface
    deployedBytecode: '0x', // Not available in DeploymentResult interface
    network: result.network,
    chainId: '0', // Not available in DeploymentResult interface
    evmChainId: undefined, // Not available in DeploymentResult interface
    chainType: 'evm', // Default since not specified
  };
}

/**
 * Convert NodeStatus to browser-safe format
 */
export function toBrowserNodeStatus(status: NodeStatus): BrowserNodeStatus {
  return {
    running: status.running,
    corePort: normalizeBigInt(status.corePort || 0),
    evmPort: normalizeBigInt(status.evmPort || 0),
    chainId: normalizeBigInt(status.chainId || 0),
    evmChainId: normalizeBigInt(status.evmChainId || 0),
    blockNumber: normalizeBlockNumber(status.blockNumber || 0),
    peerCount: normalizeBigInt(status.peerCount || 0),
    walletMode: status.walletMode || 'mnemonic',
    wallets: (status.wallets || []).map(toBrowserWalletInfo),
    miningAddress: status.miningAddress
      ? normalizeAddress(status.miningAddress)
      : null,
    health: status.health || 'unknown',
    lastHealthCheck: status.lastHealthCheck
      ? status.lastHealthCheck.toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Convert NetworkConfig to browser-safe format
 */
export function toBrowserNetworkConfig(
  config: NetworkConfig
): BrowserNetworkConfig {
  return {
    name: config.name,
    rpcUrl: config.rpcUrl,
    chainId: normalizeBigInt(config.chainId),
    evmChainId: config.evmChainId
      ? normalizeBigInt(config.evmChainId)
      : undefined,
    currency: {
      name: config.currency.name,
      symbol: config.currency.symbol,
      decimals: normalizeBigInt(config.currency.decimals),
    },
    isTestnet: config.isTestnet,
    networkType: config.networkType || 'evm',
  };
}

/**
 * Convert ContractOrchestrator to browser-safe format
 */
export function toBrowserContractOrchestrator(
  orchestrator: ContractOrchestrator
): BrowserContractOrchestrator {
  return {
    name: orchestrator.name,
    address: normalizeAddress(orchestrator.address),
    abi: JSON.stringify(orchestrator.abi),
    bytecode: orchestrator.bytecode,
    deployedBytecode: orchestrator.deployedBytecode,
    chainType: orchestrator.chainType,
    networkId: orchestrator.networkId,
    chainId: normalizeBigInt(orchestrator.chainId),
    evmChainId: orchestrator.evmChainId
      ? normalizeBigInt(orchestrator.evmChainId)
      : undefined,
    network: toBrowserNetworkConfig({
      ...orchestrator.network,
      chainId: orchestrator.chainId,
      evmChainId: orchestrator.evmChainId,
      networkType: orchestrator.chainType,
    } as NetworkConfig),
    methods: {
      read: orchestrator.methods.read.map((m: ContractMethod) => m.name),
      write: orchestrator.methods.write.map((m: ContractMethod) => m.name),
      events: orchestrator.methods.events.map((e: ContractEvent) => e.name),
    },
    capabilities: {
      read: orchestrator.capabilities.canRead,
      write: orchestrator.capabilities.canWrite,
      events: orchestrator.capabilities.hasEvents,
    },
  };
}

/**
 * Generic function to convert any object to browser-safe format
 */
export function toBrowserSafe<T extends Record<string, unknown>>(
  data: T,
  addressFields: (keyof T)[] = [],
  bigintFields: (keyof T)[] = [],
  hashFields: (keyof T)[] = []
): Record<string, string> {
  return createBrowserSafeObject(data, addressFields, bigintFields, hashFields);
}
