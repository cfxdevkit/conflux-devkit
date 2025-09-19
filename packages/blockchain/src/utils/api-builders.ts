// API response builders for blockchain operations

import type {
  Block,
  ContractCallResult,
  DeploymentResult,
  NetworkConfig,
  NodeStatus,
  TransactionReceipt,
  WalletInfo,
} from '@conflux-devkit/core';
import {
  toBrowserBlock,
  toBrowserDeploymentResult,
  toBrowserNetworkConfig,
  toBrowserNodeStatus,
  toBrowserTransactionReceipt,
  toBrowserWalletInfo,
} from '@conflux-devkit/core';
import type {
  BlockInfoApiResponse,
  BlockListApiResponse,
  ContractCallApiResponse,
  ContractDeploymentApiResponse,
  ContractReadApiResponse,
  ContractWriteApiResponse,
  EventFilterApiResponse,
  EventLogApiResponse,
  NetworkInfoApiResponse,
  NetworkSwitchApiResponse,
  NodeStartApiResponse,
  NodeStatusApiResponse,
  NodeStopApiResponse,
  TransactionReceiptApiResponse,
  TransactionSendApiResponse,
  TransactionStatusApiResponse,
  WalletBalanceApiResponse,
  WalletCreateApiResponse,
  WalletFundApiResponse,
  WalletListApiResponse,
} from '../types/api';
import {
  createBlockchainApiError,
  createBlockchainApiResponse,
} from '../types/api';

// Contract API builders
export function buildContractDeploymentResponse(
  result: DeploymentResult,
  network?: string,
  chainId?: number,
  blockNumber?: bigint,
  gasUsed?: bigint
): ContractDeploymentApiResponse {
  const browserData = toBrowserDeploymentResult(result);

  return createBlockchainApiResponse(
    {
      contractName: browserData.contractName,
      address: browserData.address,
      txHash: browserData.txHash,
      gasUsed: browserData.gasUsed,
      network: browserData.network,
      chainType: browserData.chainType,
      deployedAt: browserData.timestamp,
      abi: browserData.abi,
      bytecode: browserData.bytecode,
      deployedBytecode: browserData.deployedBytecode,
    },
    network,
    chainId,
    blockNumber,
    gasUsed
  );
}

export function buildContractCallResponse(
  result: ContractCallResult,
  method: string,
  contractAddress: string,
  network?: string,
  chainId?: number,
  blockNumber?: bigint,
  gasUsed?: bigint
): ContractCallApiResponse {
  return createBlockchainApiResponse(
    {
      result: JSON.stringify(result.result),
      gasUsed: result.gasUsed?.toString() || '0',
      blockNumber: result.blockNumber?.toString() || '0',
      method,
      contractAddress,
      success: true,
    },
    network,
    chainId,
    blockNumber,
    gasUsed
  );
}

export function buildContractReadResponse(
  result: unknown,
  method: string,
  contractAddress: string,
  blockNumber: bigint,
  network?: string,
  chainId?: number
): ContractReadApiResponse {
  return createBlockchainApiResponse(
    {
      result: JSON.stringify(result),
      method,
      contractAddress,
      blockNumber: blockNumber.toString(),
    },
    network,
    chainId,
    blockNumber
  );
}

export function buildContractWriteResponse(
  hash: string,
  method: string,
  contractAddress: string,
  gasUsed: bigint,
  blockNumber: bigint,
  network?: string,
  chainId?: number
): ContractWriteApiResponse {
  return createBlockchainApiResponse(
    {
      hash,
      gasUsed: gasUsed.toString(),
      blockNumber: blockNumber.toString(),
      method,
      contractAddress,
      success: true,
    },
    network,
    chainId,
    blockNumber,
    gasUsed
  );
}

// Transaction API builders
export function buildTransactionSendResponse(
  hash: string,
  gasPrice: bigint,
  gasLimit: bigint,
  nonce: bigint,
  from: string,
  to: string | null,
  value: bigint,
  data: string,
  network?: string,
  chainId?: number
): TransactionSendApiResponse {
  return createBlockchainApiResponse(
    {
      hash,
      gasPrice: gasPrice.toString(),
      gasLimit: gasLimit.toString(),
      nonce: nonce.toString(),
      from,
      to,
      value: value.toString(),
      data,
    },
    network,
    chainId
  );
}

export function buildTransactionReceiptResponse(
  receipt: TransactionReceipt,
  network?: string,
  chainId?: number,
  blockNumber?: bigint,
  gasUsed?: bigint
): TransactionReceiptApiResponse {
  const browserReceipt = toBrowserTransactionReceipt(receipt);

  return createBlockchainApiResponse(
    {
      transactionHash: browserReceipt.transactionHash,
      blockNumber: browserReceipt.blockNumber,
      blockHash: browserReceipt.blockHash,
      from: browserReceipt.from,
      to: browserReceipt.to,
      gasUsed: browserReceipt.gasUsed,
      status: browserReceipt.status,
      contractAddress: browserReceipt.contractAddress,
      transactionIndex: browserReceipt.transactionIndex,
      effectiveGasPrice: browserReceipt.effectiveGasPrice,
      logs: browserReceipt.logs,
    },
    network,
    chainId,
    blockNumber,
    gasUsed
  );
}

export function buildTransactionStatusResponse(
  hash: string,
  status: 'pending' | 'confirmed' | 'failed',
  confirmations: number,
  blockNumber: bigint | null,
  gasUsed: bigint | null,
  receipt: TransactionReceipt | null,
  network?: string,
  chainId?: number
): TransactionStatusApiResponse {
  return createBlockchainApiResponse(
    {
      hash,
      status,
      confirmations: confirmations.toString(),
      blockNumber: blockNumber?.toString() || null,
      gasUsed: gasUsed?.toString() || null,
      receipt: receipt ? toBrowserTransactionReceipt(receipt) : null,
    },
    network,
    chainId,
    blockNumber || undefined,
    gasUsed || undefined
  );
}

// Wallet API builders
export function buildWalletCreateResponse(
  wallet: WalletInfo,
  network?: string,
  chainId?: number
): WalletCreateApiResponse {
  const browserWallet = toBrowserWalletInfo(wallet);

  return createBlockchainApiResponse(
    {
      address: browserWallet.address,
      privateKey: browserWallet.privateKey,
      mnemonic: browserWallet.mnemonic,
      index: browserWallet.index,
      isMining: browserWallet.isMining,
      createdAt: new Date().toISOString(),
    },
    network,
    chainId
  );
}

export function buildWalletListResponse(
  wallets: WalletInfo[],
  network?: string,
  chainId?: number
): WalletListApiResponse {
  const browserWallets = wallets.map(toBrowserWalletInfo);

  return createBlockchainApiResponse(
    browserWallets.map((wallet) => ({
      index: wallet.index,
      address: wallet.address,
      balance: wallet.balance,
      balanceFormatted: wallet.balanceFormatted,
      isMining: wallet.isMining,
      createdAt: new Date().toISOString(),
    })),
    network,
    chainId
  );
}

export function buildWalletBalanceResponse(
  address: string,
  balance: bigint,
  currency: string = 'CFX',
  network?: string,
  chainId?: number
): WalletBalanceApiResponse {
  const balanceFormatted = (balance / 1000000000000000000n).toString();

  return createBlockchainApiResponse(
    {
      address,
      balance: balance.toString(),
      balanceFormatted,
      currency,
      lastUpdated: new Date().toISOString(),
    },
    network,
    chainId
  );
}

export function buildWalletFundResponse(
  from: string,
  to: string,
  amount: bigint,
  txHash: string,
  success: boolean,
  network?: string,
  chainId?: number
): WalletFundApiResponse {
  return createBlockchainApiResponse(
    {
      from,
      to,
      amount: amount.toString(),
      txHash,
      success,
    },
    network,
    chainId
  );
}

// Node API builders
export function buildNodeStatusResponse(
  status: NodeStatus,
  uptime: number,
  version: string,
  network?: string,
  chainId?: number
): NodeStatusApiResponse {
  const browserStatus = toBrowserNodeStatus(status);

  return createBlockchainApiResponse(
    {
      ...browserStatus,
      uptime: uptime.toString(),
      version,
    },
    network,
    chainId
  );
}

export function buildNodeStartResponse(
  corePort: number,
  evmPort: number,
  chainId: number,
  evmChainId: number,
  message: string,
  network?: string
): NodeStartApiResponse {
  return createBlockchainApiResponse(
    {
      success: true,
      corePort: corePort.toString(),
      evmPort: evmPort.toString(),
      chainId: chainId.toString(),
      evmChainId: evmChainId.toString(),
      message,
      startedAt: new Date().toISOString(),
    },
    network,
    chainId
  );
}

export function buildNodeStopResponse(
  message: string,
  network?: string,
  chainId?: number
): NodeStopApiResponse {
  return createBlockchainApiResponse(
    {
      success: true,
      message,
      stoppedAt: new Date().toISOString(),
    },
    network,
    chainId
  );
}

// Network API builders
export function buildNetworkInfoResponse(
  config: NetworkConfig,
  blockNumber: bigint,
  gasPrice: bigint,
  connected: boolean,
  latency: number,
  network?: string,
  chainId?: number
): NetworkInfoApiResponse {
  const browserConfig = toBrowserNetworkConfig(config);

  return createBlockchainApiResponse(
    {
      ...browserConfig,
      evmChainId: browserConfig.evmChainId || '0',
      blockNumber: blockNumber.toString(),
      gasPrice: gasPrice.toString(),
      connected,
      latency: latency.toString(),
    },
    network,
    chainId,
    blockNumber
  );
}

export function buildNetworkSwitchResponse(
  from: string,
  to: string,
  success: boolean,
  message: string,
  network?: string,
  chainId?: number
): NetworkSwitchApiResponse {
  return createBlockchainApiResponse(
    {
      from,
      to,
      success,
      message,
      switchedAt: new Date().toISOString(),
    },
    network,
    chainId
  );
}

// Block API builders
export function buildBlockInfoResponse(
  block: Block,
  transactionCount: number,
  size: number,
  network?: string,
  chainId?: number
): BlockInfoApiResponse {
  const browserBlock = toBrowserBlock(block);

  return createBlockchainApiResponse(
    {
      number: browserBlock.number || '0',
      hash: browserBlock.hash,
      parentHash: browserBlock.parentHash,
      timestamp: browserBlock.timestamp,
      gasLimit: browserBlock.gasLimit,
      gasUsed: browserBlock.gasUsed,
      transactionCount: transactionCount.toString(),
      size: size.toString(),
    },
    network,
    chainId
  );
}

export function buildBlockListResponse(
  blocks: Array<Block & { transactionCount: number; gasUsed: bigint }>,
  network?: string,
  chainId?: number
): BlockListApiResponse {
  const browserBlocks = blocks.map((block) => ({
    number: block.number?.toString() || '0',
    hash: block.hash || '',
    timestamp: block.timestamp.toString(),
    transactionCount: block.transactionCount.toString(),
    gasUsed: block.gasUsed.toString(),
  }));

  return createBlockchainApiResponse(browserBlocks, network, chainId);
}

// Event API builders
export function buildEventLogResponse(
  log: {
    address: string;
    topics: string[];
    data: string;
    blockNumber: bigint;
    transactionHash: string;
    logIndex: number;
    transactionIndex: number;
    removed: boolean;
  },
  network?: string,
  chainId?: number
): EventLogApiResponse {
  return createBlockchainApiResponse(
    {
      address: log.address,
      topics: log.topics,
      data: log.data,
      blockNumber: log.blockNumber.toString(),
      transactionHash: log.transactionHash,
      logIndex: log.logIndex.toString(),
      transactionIndex: log.transactionIndex.toString(),
      removed: log.removed,
    },
    network,
    chainId,
    log.blockNumber
  );
}

export function buildEventFilterResponse(
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
    blockNumber: bigint;
    transactionHash: string;
    logIndex: number;
    transactionIndex: number;
    removed: boolean;
  }>,
  network?: string,
  chainId?: number
): EventFilterApiResponse {
  const browserLogs = logs.map((log) => ({
    address: log.address,
    topics: log.topics,
    data: log.data,
    blockNumber: log.blockNumber.toString(),
    transactionHash: log.transactionHash,
    logIndex: log.logIndex.toString(),
    transactionIndex: log.transactionIndex.toString(),
    removed: log.removed,
  }));

  return createBlockchainApiResponse(browserLogs, network, chainId);
}

// Error builders
export function buildContractError(
  message: string,
  method: string,
  contractAddress: string,
  network?: string,
  chainId?: number,
  details?: Record<string, unknown>
) {
  return createBlockchainApiError(
    'CONTRACT_ERROR',
    message,
    network,
    chainId,
    undefined,
    { method, contractAddress, ...details }
  );
}

export function buildTransactionError(
  message: string,
  hash: string,
  network?: string,
  chainId?: number,
  details?: Record<string, unknown>
) {
  return createBlockchainApiError(
    'TRANSACTION_ERROR',
    message,
    network,
    chainId,
    undefined,
    { hash, ...details }
  );
}

export function buildWalletError(
  message: string,
  address: string,
  network?: string,
  chainId?: number,
  details?: Record<string, unknown>
) {
  return createBlockchainApiError(
    'WALLET_ERROR',
    message,
    network,
    chainId,
    undefined,
    { address, ...details }
  );
}

export function buildNodeError(
  message: string,
  network?: string,
  chainId?: number,
  details?: Record<string, unknown>
) {
  return createBlockchainApiError(
    'NODE_ERROR',
    message,
    network,
    chainId,
    undefined,
    details
  );
}

export function buildNetworkError(
  message: string,
  network?: string,
  chainId?: number,
  details?: Record<string, unknown>
) {
  return createBlockchainApiError(
    'NETWORK_ERROR',
    message,
    network,
    chainId,
    undefined,
    details
  );
}
