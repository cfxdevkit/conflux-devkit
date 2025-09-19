import type { EvmClient } from '@conflux-devkit/blockchain';
import { createWalletClient, http, parseEther } from 'viem';
import { ConfluxNode } from './ConfluxNode';
import type { ExecutionResult, NodeConfig } from './types';

interface AbiItem {
  type: string;
  name?: string;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
  stateMutability?: string;
}

type ContractAbi = AbiItem[];

export async function deployContract(
  contractCode: string,
  abi: unknown[],
  constructorArgs: unknown[] = [],
  config: Partial<NodeConfig> = {}
): Promise<ExecutionResult<{ address: string; txHash: string }>> {
  const node = new ConfluxNode();

  return node.executeScript(async (node) => {
    const evmClient = node.getEvmClient();
    const miningWallet = node.getMiningWallet();

    if (!miningWallet) {
      throw new Error('No mining wallet available');
    }

    // Create wallet client
    const walletClient = createWalletClient({
      account: miningWallet.privateKey as `0x${string}`,
      transport: http(`http://127.0.0.1:${config.evmPort || 8545}`),
    });

    // Deploy contract
    const hash = await walletClient.deployContract({
      abi,
      bytecode: contractCode as `0x${string}`,
      args: constructorArgs,
      chain: null,
    });

    // Wait for deployment
    const receipt = await (evmClient as EvmClient).getTransactionReceipt({
      hash: hash,
    });

    if (!receipt || !receipt.contractAddress) {
      throw new Error('Contract deployment failed');
    }

    return {
      address: receipt.contractAddress,
      txHash: hash,
    };
  }, config);
}

export async function callContractMethod(
  contractAddress: string,
  abi: unknown[],
  methodName: string,
  args: unknown[] = [],
  config: Partial<NodeConfig> = {}
): Promise<ExecutionResult<unknown>> {
  const node = new ConfluxNode();

  return node.executeScript(async (node) => {
    const evmClient = node.getEvmClient();

    // Read contract method
    const result = await (evmClient as EvmClient).readContract({
      address: contractAddress as `0x${string}`,
      abi: abi as ContractAbi,
      functionName: methodName,
      args,
    });

    return result;
  }, config);
}

export async function sendTransaction(
  to: string,
  value: string = '0',
  data: string = '0x',
  config: Partial<NodeConfig> = {}
): Promise<ExecutionResult<{ txHash: string; receipt: unknown }>> {
  const node = new ConfluxNode();

  return node.executeScript(async (node) => {
    const evmClient = node.getEvmClient();
    const miningWallet = node.getMiningWallet();

    if (!miningWallet) {
      throw new Error('No mining wallet available');
    }

    // Create wallet client
    const walletClient = createWalletClient({
      account: miningWallet.privateKey as `0x${string}`,
      transport: http(`http://127.0.0.1:${config.evmPort || 8545}`),
    });

    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(value),
      data: data as `0x${string}`,
      chain: null,
    });

    // Wait for receipt
    const receipt = await (evmClient as EvmClient).getTransactionReceipt({
      hash: hash,
    });

    return { txHash: hash, receipt };
  }, config);
}

export async function getBlockInfo(
  blockNumber?: number,
  config: Partial<NodeConfig> = {}
): Promise<ExecutionResult<unknown>> {
  const node = new ConfluxNode();

  return node.executeScript(async (node) => {
    const evmClient = node.getEvmClient();

    if (blockNumber) {
      return await (evmClient as EvmClient).getBlock({
        blockNumber: BigInt(blockNumber),
      });
    } else {
      return await (evmClient as EvmClient).getBlock({ blockTag: 'latest' });
    }
  }, config);
}

export async function runCompleteDeploymentFlow(
  contracts: Array<{
    name: string;
    code: string;
    abi: unknown[];
    args?: unknown[];
  }>,
  config: Partial<NodeConfig> = {}
): Promise<
  ExecutionResult<Array<{ name: string; address: string; txHash: string }>>
> {
  const node = new ConfluxNode();

  return node.executeScript(async (node) => {
    const evmClient = node.getEvmClient();
    const miningWallet = node.getMiningWallet();

    if (!evmClient || !miningWallet) {
      throw new Error('EVM client or mining wallet not available');
    }

    // Create wallet client
    const walletClient = createWalletClient({
      account: miningWallet.privateKey as `0x${string}`,
      transport: http(`http://127.0.0.1:${config.evmPort || 8545}`),
    });

    const results = [];

    for (const contract of contracts) {
      // Deploy contract
      const hash = await walletClient.deployContract({
        abi: contract.abi,
        bytecode: contract.code as `0x${string}`,
        args: contract.args || [],
        chain: null,
      });

      // Wait for deployment
      const receipt = await (evmClient as EvmClient).getTransactionReceipt({
        hash: hash,
      });

      if (!receipt || !receipt.contractAddress) {
        throw new Error(`Contract ${contract.name} deployment failed`);
      }

      results.push({
        name: contract.name,
        address: receipt.contractAddress,
        txHash: hash,
      });
    }

    return results;
  }, config);
}
