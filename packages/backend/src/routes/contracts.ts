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

/**
 * Contract Deployment API Routes
 *
 * REST endpoints for compiling and deploying Solidity contracts
 */

import { Router } from 'express';
import { createPublicClient, createWalletClient, http as viemHttp } from 'viem';
import { privateKeyToAccount as evmPrivateKeyToAccount } from 'viem/accounts';
import {
  http as coreHttp,
  createPublicClient as createCorePublicClient,
  createWalletClient as createCoreWalletClient,
} from 'cive';
import { privateKeyToAccount as corePrivateKeyToAccount } from 'cive/accounts';
import {
  getChainConfig,
  toCiveChain,
  toViemChain,
  isValidChainId,
  type SupportedChainId,
} from '@conflux-devkit/core/config';
import type { AuthenticatedRequest } from '../auth/AuthService.js';
import {
  TEST_CONTRACTS,
  type TestContractName,
} from '../contracts/index.js';
import {
  compileSolidity,
  compileMultipleSources,
  getSolcVersion,
  type CompilationResult,
} from '../services/solidity-compiler.js';
import {
  getContractStorageService,
  type StoredContract,
} from '../services/contract-storage-service.js';
import { getKeystoreService } from '../services/keystore-service.js';
import { getWebSocketServer } from '../server/WebSocketServer.js';
import { logger } from '../utils/logger.js';

// Default RPC URLs for local node
const DEFAULT_EVM_RPC = 'http://localhost:8545';
const DEFAULT_CORE_RPC = 'http://localhost:12537';

/**
 * Get Core chain definition for a given network ID
 * Uses the chain configuration from @conflux-devkit/core
 */
function getCoreChain(networkId: number) {
  if (!isValidChainId(networkId)) {
    throw new Error(`Unsupported Core chain ID: ${networkId}. Supported IDs: 1029, 1, 2029`);
  }
  const chainConfig = getChainConfig(networkId as SupportedChainId);
  return toCiveChain(chainConfig);
}

/**
 * Get EVM chain definition for a given network ID
 * Uses the chain configuration from @conflux-devkit/core
 */
function getEvmChain(networkId: number) {
  if (!isValidChainId(networkId)) {
    throw new Error(`Unsupported EVM chain ID: ${networkId}. Supported IDs: 1030, 71, 2030`);
  }
  const chainConfig = getChainConfig(networkId as SupportedChainId);
  return toViemChain(chainConfig);
}

// Re-export for backward compatibility
type DeployedContract = StoredContract;

/**
 * Create contract routes
 */
export function createContractRoutes(): Router {
  const router = Router();

  // ===== COMPILER INFO =====

  /**
   * GET /contracts/compiler
   * Get compiler information
   */
  router.get('/compiler', (_req, res) => {
    try {
      res.json({
        version: getSolcVersion(),
        defaultEvmVersion: 'paris',
        defaultOptimizer: { enabled: true, runs: 200 },
      });
    } catch (error) {
      logger.error('Failed to get compiler info:', error);
      res.status(500).json({ error: 'Failed to get compiler information' });
    }
  });

  // ===== TEST CONTRACTS =====

  /**
   * GET /contracts/templates
   * List available test contract templates
   */
  router.get('/templates', (_req, res) => {
    try {
      const templates = Object.entries(TEST_CONTRACTS).map(([key, contract]) => ({
        id: key,
        name: contract.name,
        description: contract.description,
      }));

      res.json({ templates });
    } catch (error) {
      logger.error('Failed to list templates:', error);
      res.status(500).json({ error: 'Failed to list contract templates' });
    }
  });

  /**
   * GET /contracts/templates/:name
   * Get a specific test contract template with source and ABI
   */
  router.get('/templates/:name', (req, res) => {
    try {
      const name = req.params.name as TestContractName;
      const contract = TEST_CONTRACTS[name];

      if (!contract) {
        return res.status(404).json({
          error: `Template not found: ${name}`,
          available: Object.keys(TEST_CONTRACTS),
        });
      }

      // Compile to get ABI
      const compiled = contract.getCompiled();

      res.json({
        id: name,
        name: contract.name,
        description: contract.description,
        source: contract.source,
        abi: compiled.abi,
        bytecode: compiled.bytecode,
        compilerVersion: compiled.compilerVersion,
        gasEstimates: compiled.gasEstimates,
      });
    } catch (error) {
      logger.error('Failed to get template:', error);
      res.status(500).json({ error: 'Failed to get contract template' });
    }
  });

  // ===== COMPILATION =====

  /**
   * POST /contracts/compile
   * Compile Solidity source code
   */
  router.post('/compile', (req, res) => {
    try {
      const { source, contractName, optimizer, evmVersion } = req.body;

      if (!source || typeof source !== 'string') {
        return res.status(400).json({ error: 'Source code is required' });
      }

      const name = contractName || 'Contract';

      const result = compileSolidity({
        contractName: name,
        source,
        optimizer,
        evmVersion,
      });

      res.json(result);
    } catch (error) {
      logger.error('Compilation failed:', error);
      res.status(500).json({
        error: 'Compilation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /contracts/compile-multiple
   * Compile multiple Solidity sources
   */
  router.post('/compile-multiple', (req, res) => {
    try {
      const { sources, optimizer, evmVersion } = req.body;

      if (!sources || typeof sources !== 'object') {
        return res.status(400).json({ error: 'Sources object is required' });
      }

      const result = compileMultipleSources(sources, optimizer, evmVersion);
      res.json(result);
    } catch (error) {
      logger.error('Multi-source compilation failed:', error);
      res.status(500).json({
        error: 'Compilation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ===== DEPLOYMENT =====

  /**
   * POST /contracts/deploy
   * Deploy a compiled contract
   */
  router.post('/deploy', async (req: AuthenticatedRequest, res) => {
    try {
      const {
        chain,
        abi,
        bytecode,
        constructorArgs = [],
        accountIndex = 0,
        contractName = 'Contract',
      } = req.body;

      // Validate chain
      if (chain !== 'evm' && chain !== 'core') {
        return res.status(400).json({ error: 'Chain must be "evm" or "core"' });
      }

      // Validate bytecode
      if (!bytecode || typeof bytecode !== 'string') {
        return res.status(400).json({ error: 'Bytecode is required' });
      }

      // Validate ABI
      if (!abi || !Array.isArray(abi)) {
        return res.status(400).json({ error: 'ABI array is required' });
      }

      // Get deployer account from keystore
      const keystore = getKeystoreService();
      await keystore.initialize();

      if (!(await keystore.isSetupCompleted())) {
        return res.status(400).json({ error: 'Setup not completed' });
      }

      if (keystore.isLocked()) {
        return res.status(400).json({ error: 'Keystore is locked' });
      }

      const mnemonic = await keystore.getActiveMnemonic();
      const accounts = await keystore.deriveGenesisAccounts(mnemonic.id);

      if (accountIndex >= accounts.length) {
        return res.status(400).json({
          error: `Account index ${accountIndex} out of range (0-${accounts.length - 1})`,
        });
      }

      const deployer = accounts[accountIndex];

      let result: { address: string; transactionHash: string };

      if (chain === 'evm') {
        result = await deployToEvm({
          abi,
          bytecode: bytecode as `0x${string}`,
          args: constructorArgs,
          privateKey: deployer.evmPrivateKey as `0x${string}`,
          evmChainId: mnemonic.nodeConfig.evmChainId,
        });
      } else {
        result = await deployToCore({
          abi,
          bytecode: bytecode as `0x${string}`,
          args: constructorArgs,
          privateKey: deployer.privateKey as `0x${string}`,
          chainId: mnemonic.nodeConfig.chainId,
        });
      }

      // Store deployed contract persistently
      const contractStorage = getContractStorageService();
      await contractStorage.initialize();

      const deploymentId = `${chain}-${Date.now()}`;
      const deployment: DeployedContract = {
        id: deploymentId,
        name: contractName,
        address: result.address,
        chain,
        chainId: chain === 'evm' ? mnemonic.nodeConfig.evmChainId : mnemonic.nodeConfig.chainId,
        network: contractStorage.getNetwork(),
        deployedAt: new Date().toISOString(),
        deployer: chain === 'evm' ? deployer.evm : deployer.core,
        transactionHash: result.transactionHash,
        abi,
        constructorArgs,
      };

      await contractStorage.addContract(deployment);

      logger.info(`Contract deployed: ${contractName} at ${result.address} on ${chain}`);

      // Broadcast deployment via WebSocket for real-time updates
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.notifyContractDeployment({
          id: deployment.id,
          name: deployment.name,
          address: deployment.address,
          chain: deployment.chain,
          chainId: deployment.chainId,
          deployer: deployment.deployer,
          transactionHash: deployment.transactionHash,
        });
      }

      res.json({
        success: true,
        deployment,
      });
    } catch (error) {
      logger.error('Deployment failed:', error);
      res.status(500).json({
        error: 'Deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /contracts/deploy-template
   * Deploy a test contract template
   */
  router.post('/deploy-template', async (req: AuthenticatedRequest, res) => {
    try {
      const {
        template,
        chain,
        constructorArgs = [],
        accountIndex = 0,
      } = req.body;

      // Validate template
      const templateName = template as TestContractName;
      const contract = TEST_CONTRACTS[templateName];

      if (!contract) {
        return res.status(400).json({
          error: `Template not found: ${template}`,
          available: Object.keys(TEST_CONTRACTS),
        });
      }

      // Validate chain
      if (chain !== 'evm' && chain !== 'core') {
        return res.status(400).json({ error: 'Chain must be "evm" or "core"' });
      }

      // Apply default constructor args if not provided
      let args = constructorArgs;
      if (args.length === 0) {
        if (templateName === 'SimpleStorage') {
          args = [42];
        } else if (templateName === 'TestToken') {
          args = ['Test Token', 'TEST', 1000000];
        }
      }

      // Get compiled contract
      const compiled = contract.getCompiled();

      // Get deployer account from keystore
      const keystore = getKeystoreService();
      await keystore.initialize();

      if (!(await keystore.isSetupCompleted())) {
        return res.status(400).json({ error: 'Setup not completed' });
      }

      if (keystore.isLocked()) {
        return res.status(400).json({ error: 'Keystore is locked' });
      }

      const mnemonic = await keystore.getActiveMnemonic();
      const accounts = await keystore.deriveGenesisAccounts(mnemonic.id);

      if (accountIndex >= accounts.length) {
        return res.status(400).json({
          error: `Account index ${accountIndex} out of range (0-${accounts.length - 1})`,
        });
      }

      const deployer = accounts[accountIndex];

      let result: { address: string; transactionHash: string };

      if (chain === 'evm') {
        result = await deployToEvm({
          abi: compiled.abi,
          bytecode: compiled.bytecode as `0x${string}`,
          args,
          privateKey: deployer.evmPrivateKey as `0x${string}`,
          evmChainId: mnemonic.nodeConfig.evmChainId,
        });
      } else {
        result = await deployToCore({
          abi: compiled.abi,
          bytecode: compiled.bytecode as `0x${string}`,
          args,
          privateKey: deployer.privateKey as `0x${string}`,
          chainId: mnemonic.nodeConfig.chainId,
        });
      }

      // Store deployed contract persistently
      const contractStorage = getContractStorageService();
      await contractStorage.initialize();

      const deploymentId = `${chain}-${Date.now()}`;
      const deployment: DeployedContract = {
        id: deploymentId,
        name: compiled.contractName,
        address: result.address,
        chain,
        chainId: chain === 'evm' ? mnemonic.nodeConfig.evmChainId : mnemonic.nodeConfig.chainId,
        network: contractStorage.getNetwork(),
        deployedAt: new Date().toISOString(),
        deployer: chain === 'evm' ? deployer.evm : deployer.core,
        transactionHash: result.transactionHash,
        abi: compiled.abi,
        constructorArgs: args,
      };

      await contractStorage.addContract(deployment);

      logger.info(`Template deployed: ${compiled.contractName} at ${result.address} on ${chain}`);

      // Broadcast deployment via WebSocket for real-time updates
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.notifyContractDeployment({
          id: deployment.id,
          name: deployment.name,
          address: deployment.address,
          chain: deployment.chain,
          chainId: deployment.chainId,
          deployer: deployment.deployer,
          transactionHash: deployment.transactionHash,
        });
      }

      res.json({
        success: true,
        deployment,
      });
    } catch (error) {
      logger.error('Template deployment failed:', error);
      res.status(500).json({
        error: 'Deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ===== DEPLOYED CONTRACTS =====

  /**
   * GET /contracts/deployed
   * List all deployed contracts
   */
  router.get('/deployed', async (_req, res) => {
    try {
      const contractStorage = getContractStorageService();
      await contractStorage.initialize();

      const contracts = await contractStorage.getAllContracts();
      res.json({ contracts });
    } catch (error) {
      logger.error('Failed to list deployed contracts:', error);
      res.status(500).json({ error: 'Failed to list deployed contracts' });
    }
  });

  /**
   * GET /contracts/deployed/:id
   * Get a specific deployed contract
   */
  router.get('/deployed/:id', async (req, res) => {
    try {
      const contractStorage = getContractStorageService();
      await contractStorage.initialize();

      const contract = await contractStorage.getContract(req.params.id);

      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.json({ contract });
    } catch (error) {
      logger.error('Failed to get deployed contract:', error);
      res.status(500).json({ error: 'Failed to get deployed contract' });
    }
  });

  /**
   * DELETE /contracts/deployed/:id
   * Remove a deployed contract from tracking (doesn't affect blockchain)
   */
  router.delete('/deployed/:id', async (req, res) => {
    try {
      const contractStorage = getContractStorageService();
      await contractStorage.initialize();

      const deleted = await contractStorage.deleteContract(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete deployed contract:', error);
      res.status(500).json({ error: 'Failed to delete deployed contract' });
    }
  });

  /**
   * DELETE /contracts/deployed
   * Clear all deployed contracts from tracking
   */
  router.delete('/deployed', async (_req, res) => {
    try {
      const contractStorage = getContractStorageService();
      await contractStorage.initialize();

      await contractStorage.clearAllContracts();
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to clear deployed contracts:', error);
      res.status(500).json({ error: 'Failed to clear deployed contracts' });
    }
  });

  // ===== CONTRACT INTERACTION =====

  /**
   * POST /contracts/call
   * Call a read-only function on a deployed contract
   */
  router.post('/call', async (req, res) => {
    try {
      const { address, abi, functionName, args = [], chain } = req.body;

      if (!address || !abi || !functionName || !chain) {
        return res.status(400).json({
          error: 'Missing required fields: address, abi, functionName, chain',
        });
      }

      let result: unknown;

      if (chain === 'evm') {
        const publicClient = createPublicClient({
          transport: viemHttp(DEFAULT_EVM_RPC),
        });

        result = await publicClient.readContract({
          address: address as `0x${string}`,
          abi,
          functionName,
          args,
        });
      } else if (chain === 'core') {
        const publicClient = createCorePublicClient({
          transport: coreHttp(DEFAULT_CORE_RPC),
        });

        result = await publicClient.readContract({
          address: address as any,
          abi,
          functionName,
          args,
        });
      } else {
        return res.status(400).json({ error: 'Chain must be "evm" or "core"' });
      }

      // Convert BigInt to string for JSON serialization
      const serializedResult = serializeBigInt(result);

      res.json({ result: serializedResult });
    } catch (error) {
      logger.error('Contract call failed:', error);
      res.status(500).json({
        error: 'Contract call failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /contracts/send
   * Send a transaction to a contract function
   */
  router.post('/send', async (req: AuthenticatedRequest, res) => {
    try {
      const {
        address,
        abi,
        functionName,
        args = [],
        chain,
        accountIndex = 0,
      } = req.body;

      if (!address || !abi || !functionName || !chain) {
        return res.status(400).json({
          error: 'Missing required fields: address, abi, functionName, chain',
        });
      }

      // Get sender account from keystore
      const keystore = getKeystoreService();
      await keystore.initialize();

      if (!(await keystore.isSetupCompleted())) {
        return res.status(400).json({ error: 'Setup not completed' });
      }

      if (keystore.isLocked()) {
        return res.status(400).json({ error: 'Keystore is locked' });
      }

      const mnemonic = await keystore.getActiveMnemonic();
      const accounts = await keystore.deriveGenesisAccounts(mnemonic.id);

      if (accountIndex >= accounts.length) {
        return res.status(400).json({
          error: `Account index ${accountIndex} out of range (0-${accounts.length - 1})`,
        });
      }

      const sender = accounts[accountIndex];

      let transactionHash: string;

      if (chain === 'evm') {
        const evmChain = getEvmChain(mnemonic.nodeConfig.evmChainId);
        const account = evmPrivateKeyToAccount(sender.evmPrivateKey as `0x${string}`);
        const walletClient = createWalletClient({
          account,
          transport: viemHttp(DEFAULT_EVM_RPC),
        });

        transactionHash = await walletClient.writeContract({
          address: address as `0x${string}`,
          abi,
          functionName,
          args,
          chain: evmChain,
        });
      } else if (chain === 'core') {
        const coreChain = getCoreChain(mnemonic.nodeConfig.chainId);
        const account = corePrivateKeyToAccount(
          sender.privateKey as `0x${string}`,
          { networkId: mnemonic.nodeConfig.chainId }
        );
        const walletClient = createCoreWalletClient({
          account,
          chain: coreChain,
          transport: coreHttp(DEFAULT_CORE_RPC),
        });

        transactionHash = await walletClient.writeContract({
          address: address as any,
          abi,
          functionName,
          args,
        });
      } else {
        return res.status(400).json({ error: 'Chain must be "evm" or "core"' });
      }

      res.json({
        success: true,
        transactionHash,
        sender: chain === 'evm' ? sender.evm : sender.core,
      });
    } catch (error) {
      logger.error('Contract send failed:', error);
      res.status(500).json({
        error: 'Contract transaction failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

// ===== HELPER FUNCTIONS =====

/**
 * Deploy contract to eSpace
 */
async function deployToEvm(params: {
  abi: unknown[];
  bytecode: `0x${string}`;
  args: unknown[];
  privateKey: `0x${string}`;
  evmChainId: number;
  rpcUrl?: string;
}): Promise<{ address: string; transactionHash: string }> {
  const { abi, bytecode, args, privateKey, evmChainId, rpcUrl = DEFAULT_EVM_RPC } = params;

  const evmChain = getEvmChain(evmChainId);
  const account = evmPrivateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    transport: viemHttp(rpcUrl),
  });

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args,
    chain: evmChain,
  });

  const publicClient = createPublicClient({
    transport: viemHttp(rpcUrl),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    address: (receipt as { contractAddress?: string }).contractAddress || '',
    transactionHash: hash,
  };
}

/**
 * Deploy contract to Core Space
 */
async function deployToCore(params: {
  abi: unknown[];
  bytecode: `0x${string}`;
  args: unknown[];
  privateKey: `0x${string}`;
  chainId: number;
  rpcUrl?: string;
}): Promise<{ address: string; transactionHash: string }> {
  const { abi, bytecode, args, privateKey, chainId, rpcUrl = DEFAULT_CORE_RPC } = params;

  const coreChain = getCoreChain(chainId);
  const account = corePrivateKeyToAccount(privateKey, { networkId: chainId });
  const walletClient = createCoreWalletClient({
    account,
    chain: coreChain,
    transport: coreHttp(rpcUrl),
  });

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args,
  });

  const publicClient = createCorePublicClient({
    transport: coreHttp(rpcUrl),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress =
    (receipt as { contractAddress?: string }).contractAddress ||
    (receipt as { contractCreated?: string }).contractCreated ||
    '';

  return {
    address: contractAddress,
    transactionHash: hash,
  };
}

/**
 * Serialize BigInt values to strings for JSON
 */
function serializeBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeBigInt(v);
    }
    return result;
  }
  return value;
}
