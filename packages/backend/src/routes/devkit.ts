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
 * DevKit API Routes
 *
 * REST endpoints that expose DevKit functionality
 */

import { Router } from 'express';
import type { AuthenticatedRequest } from '../auth/AuthService.js';
import type { DevKitCompat } from '../devkit-compat.js';
import type { DevKitWebSocketServer } from '../server/WebSocketServer.js';
import { getKeystoreService } from '../services/keystore-service.js';
import { logger } from '../utils/logger.js';

// Network state management
type NetworkType = 'local' | 'testnet' | 'mainnet';
let currentNetwork: NetworkType = 'local'; // Default to local network

// Helper to check if current network is local
function isLocalNetwork(): boolean {
  return currentNetwork === 'local';
}

// Helper to get network-specific capabilities
function getNetworkCapabilities(network: NetworkType) {
  const isLocal = network === 'local';
  return {
    canMine: isLocal,           // Mining only on local
    canUseFaucet: isLocal,      // Faucet only on local
    canControlNode: isLocal,    // Node start/stop only on local
    canResetNode: isLocal,      // Reset only on local
    canDeploy: true,            // Deploy works on all networks
    canMonitor: true,           // Monitor works on all networks
    requiresWallet: !isLocal,   // Non-local networks need wallet for transactions
  };
}

// Network configuration helper
function getNetworkConfig(network: NetworkType) {
  switch (network) {
    case 'testnet':
      return {
        // eSpace (EVM) configuration
        evmChainId: 71,
        rpcUrl: 'https://evmtestnet.confluxrpc.com',
        // Core Space configuration  
        coreNetworkId: 1, // Testnet Core network ID
        coreRpcUrl: 'https://test.confluxrpc.com',
      };
    case 'mainnet':
      return {
        // eSpace (EVM) configuration
        evmChainId: 1030,
        rpcUrl: 'https://evm.confluxrpc.com',
        // Core Space configuration
        coreNetworkId: 1029, // Mainnet Core network ID
        coreRpcUrl: 'https://main.confluxrpc.com',
      };
    default: // local
      return {
        // eSpace (EVM) configuration
        evmChainId: 2030, // Local EVM chain ID
        rpcUrl: 'http://localhost:8545', // Local EVM RPC
        // Core Space configuration
        coreNetworkId: 2029, // Local Core network ID
        coreRpcUrl: 'http://localhost:12537', // Local Core RPC
      };
  }
}

// Helper to create "local only" error response
function localOnlyError(res: any, operation: string) {
  return res.status(403).json({
    error: `Operation not available on ${currentNetwork}`,
    message: `${operation} is only available on local network. Switch to local network to use this feature.`,
    network: currentNetwork,
    requiredNetwork: 'local',
  });
}

export function createDevKitRoutes(
  getDevKit: () => DevKitCompat,
  wsServer?: DevKitWebSocketServer,
  devkitManager?: any // DevKitManager type (imported lazily to avoid circular deps)
): Router {
  const router = Router();

  // Status endpoint
  router.get('/status', async (_req, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      // Get DevKit status - handle case when node is stopped
      let chainStatus;
      let miningStatus;
      let config;
      let rpcUrls;
      let accounts;

      try {
        chainStatus = await devkit.getStatus();
        miningStatus = devkit.getMiningStatus();
        config = devkit.getConfig();
        rpcUrls = devkit.getRpcUrls();
        accounts = devkit.getAccounts();
      } catch (error) {
        // DevKit might be stopped, return safe defaults
        console.warn(
          'DevKit status check failed (node likely stopped):',
          error
        );

        // Get wallet info even when node is stopped
        const keystore = getKeystoreService();
        const walletInfo = {
          activeLabel: keystore.getActiveLabel(),
          activeIndex: keystore.getActiveIndex(),
          dataDir: await keystore.getDataDir(),
          mnemonicHash: (await keystore.getMnemonicHash()).substring(0, 8),
        };

        return res.json({
          status: 'stopped',
          running: false,
          mining: { isRunning: false, interval: 0, blocksMined: 0 },
          wallet: walletInfo,
          chains: {
            core: { connected: false, status: 'stopped', blockNumber: 0, gasPrice: '0', chainId: config?.chainId || 0 },
            evm: { connected: false, status: 'stopped', blockNumber: 0, gasPrice: '0', chainId: config?.evmChainId || 0 },
          },
          accounts: 0,
          timestamp: new Date().toISOString(),
          error: 'Node is stopped',
        });
      }

      // Check if node is actually running based on chain status
      const isRunning =
        chainStatus.core.status === 'running' ||
        chainStatus.evm.status === 'running';
      const nodeStatus = chainStatus.core.status; // Use core status as main indicator

      // Fetch real-time block data if node is running
      let coreBlockData = { blockNumber: 0, gasPrice: '0' };
      let evmBlockData = { blockNumber: 0, gasPrice: '0' };

      if (isRunning && accounts.length > 0) {
        try {
          logger.info('Fetching block data from RPC endpoints...', {
            coreUrl: rpcUrls.core,
            evmUrl: rpcUrls.evm,
          });

          // Use direct RPC calls for better reliability
          // Get Core Space block data
          try {
            const coreResponses = await Promise.all([
              fetch(rpcUrls.core, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'cfx_epochNumber',
                  params: [],
                  id: 1,
                }),
              }),
              fetch(rpcUrls.core, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'cfx_gasPrice',
                  params: [],
                  id: 2,
                }),
              }),
            ]);

            const [epochData, gasPriceData] = await Promise.all([
              coreResponses[0].json() as Promise<any>,
              coreResponses[1].json() as Promise<any>,
            ]);

            if (epochData.result && gasPriceData.result) {
              coreBlockData = {
                blockNumber: parseInt(epochData.result, 16),
                gasPrice: BigInt(gasPriceData.result).toString(),
              };
              logger.info('Core Space block data fetched:', coreBlockData);
            }
          } catch (error) {
            logger.error('Failed to fetch Core Space block data:', error);
          }

          // Get eSpace block data
          try {
            const evmResponses = await Promise.all([
              fetch(rpcUrls.evm, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_blockNumber',
                  params: [],
                  id: 1,
                }),
              }),
              fetch(rpcUrls.evm, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_gasPrice',
                  params: [],
                  id: 2,
                }),
              }),
            ]);

            const [blockData, gasData] = await Promise.all([
              evmResponses[0].json() as Promise<any>,
              evmResponses[1].json() as Promise<any>,
            ]);

            if (blockData.result && gasData.result) {
              evmBlockData = {
                blockNumber: parseInt(blockData.result, 16),
                gasPrice: BigInt(gasData.result).toString(),
              };
              logger.info('eSpace block data fetched:', evmBlockData);
            }
          } catch (error) {
            logger.error('Failed to fetch eSpace block data:', error);
          }
        } catch (error) {
          logger.error('Failed to fetch block data:', error);
        }
      }

      // Get active wallet information
      const keystore = getKeystoreService();
      const walletInfo = {
        activeLabel: keystore.getActiveLabel(),
        activeIndex: keystore.getActiveIndex(),
        dataDir: await keystore.getDataDir(),
        mnemonicHash: (await keystore.getMnemonicHash()).substring(0, 8),
      };

      res.json({
        status: nodeStatus,
        running: isRunning,
        mining: miningStatus,
        network: currentNetwork,
        networkConfig: getNetworkConfig(currentNetwork),
        capabilities: getNetworkCapabilities(currentNetwork),
        wallet: walletInfo,
        chains: {
          core: {
            ...chainStatus.core,
            blockNumber: coreBlockData.blockNumber,
            gasPrice: coreBlockData.gasPrice,
            chainId: config.chainId,
          },
          evm: {
            ...chainStatus.evm,
            blockNumber: evmBlockData.blockNumber,
            gasPrice: evmBlockData.gasPrice,
            chainId: config.evmChainId,
          },
        },
        accounts: accounts.length,
        rpcUrls: rpcUrls,
        timestamp: new Date().toISOString(),
        config: {
          chainId: config.chainId,
          evmChainId: config.evmChainId,
          accountsCount: config.accountsCount,
          jsonrpcHttpPort: config.jsonrpcHttpPort,
          jsonrpcWsPort: config.jsonrpcWsPort,
          jsonrpcHttpEthPort: config.jsonrpcHttpEthPort,
          jsonrpcWsEthPort: config.jsonrpcWsEthPort,
        },
      });
    } catch (error) {
      console.error('DevKit status error:', error);
      // Return graceful status instead of 500 error
      res.json({
        status: 'error',
        running: false,
        mining: { isRunning: false, interval: 0, blocksMined: 0 },
        chains: {
          core: { connected: false, status: 'error' },
          evm: { connected: false, status: 'error' },
        },
        accounts: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // RPC Proxy endpoint - allows frontend to make RPC calls through the backend
  // This avoids CORS issues when calling the local dev node directly
  router.post('/rpc/:chain', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const { chain } = req.params;
      const rpcRequest = req.body;

      if (!rpcRequest || !rpcRequest.method) {
        return res.status(400).json({ error: 'Invalid RPC request' });
      }

      // Determine RPC URL based on chain
      const config = devkit.getConfig();
      let rpcUrl: string;
      
      if (chain === 'evm' || chain === 'espace') {
        rpcUrl = `http://localhost:${config.jsonrpcHttpEthPort || 8545}`;
      } else if (chain === 'core') {
        rpcUrl = `http://localhost:${config.jsonrpcHttpPort || 12537}`;
      } else {
        return res.status(400).json({ error: `Unknown chain: ${chain}` });
      }

      // Forward the RPC request
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcRequest),
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error('RPC proxy error:', error);
      res.status(500).json({ 
        error: 'RPC request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get blocks with transactions since specified epoch/block numbers
  router.get('/blocks/since', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const { coreEpoch, evmBlock } = req.query;
      const config = devkit.getConfig();
      const coreRpcUrl = `http://localhost:${config.jsonrpcHttpPort || 12537}`;
      const evmRpcUrl = `http://localhost:${config.jsonrpcHttpEthPort || 8545}`;

      const blocksWithTxs: any[] = [];

      // Helper to fetch Core epoch
      async function fetchCoreEpoch(epochNumber: number) {
        const response = await fetch(coreRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'cfx_getBlockByEpochNumber',
            params: [`0x${epochNumber.toString(16)}`, true],
            id: 1,
          }),
        });
        const data = (await response.json()) as { result: any };
        return data.result;
      }

      // Helper to fetch eSpace block
      async function fetchEvmBlock(blockNumber: number) {
        const response = await fetch(evmRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [`0x${blockNumber.toString(16)}`, true],
            id: 1,
          }),
        });
        const data = (await response.json()) as { result: any };
        return data.result;
      }

      // Fetch current epoch/block numbers
      const [currentCoreResponse, currentEvmResponse] = await Promise.all([
        fetch(coreRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'cfx_epochNumber',
            params: [],
            id: 1,
          }),
        }),
        fetch(evmRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        }),
      ]);

      const currentCoreData = (await currentCoreResponse.json()) as { result: string };
      const currentEvmData = (await currentEvmResponse.json()) as { result: string };

      const currentCoreEpoch = parseInt(currentCoreData.result, 16);
      const currentEvmBlock = parseInt(currentEvmData.result, 16);

      const startCoreEpoch = coreEpoch ? parseInt(coreEpoch as string) + 1 : currentCoreEpoch;
      const startEvmBlock = evmBlock ? parseInt(evmBlock as string) + 1 : currentEvmBlock;

      // Fetch Core epochs with transactions (limit to reasonable range)
      const coreEpochsToFetch = Math.min(currentCoreEpoch - startCoreEpoch + 1, 100);
      for (let i = 0; i < coreEpochsToFetch; i++) {
        const epoch = startCoreEpoch + i;
        const block = await fetchCoreEpoch(epoch);
        
        if (block && block.transactions && block.transactions.length > 0) {
          const transactions = block.transactions.map((tx: any) => ({
            hash: tx.hash || '',
            from: tx.from || '',
            to: tx.to || undefined,
            value: tx.value ? (parseInt(tx.value, 16) / 1e18).toFixed(4) + ' CFX' : '0 CFX',
          }));

          blocksWithTxs.push({
            blockNumber: String(epoch),
            timestamp: Date.now(),
            chainType: 'core',
            transactionCount: transactions.length,
            transactions,
          });
        }
      }

      // Fetch eSpace blocks with transactions (limit to reasonable range)
      const evmBlocksToFetch = Math.min(currentEvmBlock - startEvmBlock + 1, 100);
      for (let i = 0; i < evmBlocksToFetch; i++) {
        const blockNum = startEvmBlock + i;
        const block = await fetchEvmBlock(blockNum);
        
        if (block && block.transactions && block.transactions.length > 0) {
          const transactions = block.transactions.map((tx: any) => ({
            hash: tx.hash || '',
            from: tx.from || '',
            to: tx.to || undefined,
            value: tx.value ? (parseInt(tx.value, 16) / 1e18).toFixed(4) + ' CFX' : '0 CFX',
          }));

          blocksWithTxs.push({
            blockNumber: String(blockNum),
            timestamp: Date.now(),
            chainType: 'evm',
            transactionCount: transactions.length,
            transactions,
          });
        }
      }

      res.json({
        blocks: blocksWithTxs,
        currentCoreEpoch,
        currentEvmBlock,
      });
    } catch (error) {
      logger.error('Failed to fetch blocks:', error);
      res.status(500).json({
        error: 'Failed to fetch blocks',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get all accounts
  router.get('/accounts', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const network = currentNetwork;
      const networkConfig = getNetworkConfig(network);
      
      // Get accounts from DevKit (these have the private keys we need)
      const devkitAccounts = devkit.getAccounts();
      const accountsData: any[] = [];
      
      const requesterAddress = Array.isArray(req.wallet?.address)
        ? req.wallet?.address[0]
        : req.wallet?.address;

      if (network === 'local') {
        // Use local DevKit accounts as-is for local network
        devkitAccounts.forEach((account) => {
          accountsData.push({
            index: account.index,
            addresses: {
              core: account.address.core,
              evm: account.address.evm,
            },
            isAdmin:
              requesterAddress?.toLowerCase() ===
              account.address.evm.toLowerCase(),
          });
        });
      } else {
        // Regenerate addresses for external networks using DevKit private keys
        const { privateKeyToAccount: corePrivateKeyToAccount } = await import(
          'cive/accounts'
        );
        const { privateKeyToAccount: evmPrivateKeyToAccount } = await import(
          'viem/accounts'
        );
        
        devkitAccounts.forEach((account) => {
          // Use the Core private key for Core address
          const corePrivateKey = account.privateKey as `0x${string}`;
          
          // Use the EVM private key for EVM address (Ethereum derivation path)
          const evmPrivateKey = account.evmPrivateKey as `0x${string}`;
          
          // Generate Core address for current network
          const coreAccount = corePrivateKeyToAccount(corePrivateKey, {
            networkId: networkConfig.coreNetworkId,
          });
          
          // Generate EVM address using the correct EVM private key
          const evmAccount = evmPrivateKeyToAccount(evmPrivateKey);
          
          accountsData.push({
            index: account.index,
            addresses: {
              core: coreAccount.address,
              evm: evmAccount.address,
            },
            isAdmin:
              requesterAddress?.toLowerCase() ===
              evmAccount.address.toLowerCase(),
          });
        });
      }

      // Get faucet account info (available to all users)
      let faucetAccount = null;
      try {
        if (network === 'local') {
          const faucet = await devkit.getFaucetAccount();
          faucetAccount = {
            addresses: {
              core: faucet.address.core,
              evm: faucet.address.evm,
            },
          };
        } else {
          // For external networks, regenerate faucet addresses
          const faucet = await devkit.getFaucetAccount();
          const { privateKeyToAccount: corePrivateKeyToAccount } = await import(
            'cive/accounts'
          );
          const { privateKeyToAccount: evmPrivateKeyToAccount } = await import(
            'viem/accounts'
          );
          
          const faucetCorePrivateKey = faucet.privateKey as `0x${string}`;
          const faucetEvmPrivateKey = faucet.evmPrivateKey as `0x${string}`;
          
          const faucetCoreAccount = corePrivateKeyToAccount(faucetCorePrivateKey, {
            networkId: networkConfig.coreNetworkId,
          });
          
          const faucetEvmAccount = evmPrivateKeyToAccount(faucetEvmPrivateKey);
          
          faucetAccount = {
            addresses: {
              core: faucetCoreAccount.address,
              evm: faucetEvmAccount.address,
            },
          };
        }
      } catch (error) {
        console.warn('Faucet account not available:', error);
      }

      res.json({
        accounts: accountsData,
        total: accountsData.length,
        faucetAccount,
        network: currentNetwork,
        // Note: Mnemonic is not exposed via DevKit API for security reasons
      });
    } catch (error) {
      logger.error('Failed to get accounts:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  });

  // Get account information
  router.get('/accounts/:index', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const indexParam = Array.isArray(req.params.index)
        ? req.params.index[0]
        : req.params.index;
      const index = parseInt(indexParam ?? '', 10);
      if (Number.isNaN(index) || index < 0 || index >= 10) {
        return res.status(400).json({ error: 'Invalid account index (0-9)' });
      }

      const network = currentNetwork;
      const networkConfig = getNetworkConfig(network);
      const devkitAccount = devkit.account(index);
      const requesterAddress = Array.isArray(req.wallet?.address)
        ? req.wallet?.address[0]
        : req.wallet?.address;
      
      if (network === 'local') {
        // Use local DevKit account as-is
        res.json({
          index,
          addresses: {
            core: devkitAccount.address.core,
            evm: devkitAccount.address.evm,
          },
          isAdmin:
            requesterAddress?.toLowerCase() ===
            devkitAccount.address.evm.toLowerCase(),
        });
      } else {
        // Regenerate addresses for external networks
        const { privateKeyToAccount: corePrivateKeyToAccount } = await import(
          'cive/accounts'
        );
        const { privateKeyToAccount: evmPrivateKeyToAccount } = await import(
          'viem/accounts'
        );
        
        const corePrivateKey = devkitAccount.privateKey as `0x${string}`;
        const evmPrivateKey = devkitAccount.evmPrivateKey as `0x${string}`;
        
        // Generate addresses for current network using correct private keys
        const coreAccount = corePrivateKeyToAccount(corePrivateKey, {
          networkId: networkConfig.coreNetworkId,
        });
        
        const evmAccount = evmPrivateKeyToAccount(evmPrivateKey);
        
        res.json({
          index,
          addresses: {
            core: coreAccount.address,
            evm: evmAccount.address,
          },
          isAdmin:
            requesterAddress?.toLowerCase() ===
            evmAccount.address.toLowerCase(),
        });
      }
    } catch (error) {
      logger.error('Account info failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get balance by address (Core or eSpace)
  router.get(
    '/balance/address/:address',
    async (req: AuthenticatedRequest, res) => {
      const devkit = getDevKit(); // Always get fresh instance
      const address = Array.isArray(req.params.address)
        ? req.params.address[0]
        : req.params.address;
      
      try {
        const network = currentNetwork;
        const networkConfig = getNetworkConfig(network);

        // Use proper address validation
        const { isAddress: isCoreAddress } = await import('cive/utils');
        const { isAddress: isEspaceAddress } = await import('viem');
        const isCore = isCoreAddress(address || '');
        const isEvm = isEspaceAddress(address || '');

        if (!isEvm && !isCore) {
          return res.status(400).json({ error: 'Invalid address format' });
        }

        // Check if node is running for local network
        if (network === 'local') {
          try {
            const status = await devkit.getStatus();
            if (status.core.status !== 'running' && status.evm.status !== 'running') {
              return res.json({
                address,
                balances: { core: '0', evm: '0' },
                error: 'Node is not running',
                nodeStatus: 'stopped',
                network,
                config: networkConfig,
              });
            }
          } catch {
            return res.json({
              address,
              balances: { core: '0', evm: '0' },
              error: 'Node is not running',
              nodeStatus: 'stopped',
              network,
              config: networkConfig,
            });
          }
        }

        let coreBalance = '0';
        let evmBalance = '0';

        // Query balances based on address type
        if (isCore) {
          const { createPublicClient: createCoreClient } = await import('cive');
          const { http: coreHttp } = await import('cive');
          const { formatCFX } = await import('cive');

          const coreClient = createCoreClient({
            transport: coreHttp(networkConfig.coreRpcUrl),
          });

          const coreBalanceDrip = await coreClient.getBalance({
            address: address as any,
          });
          coreBalance = formatCFX(coreBalanceDrip);
        } else if (isEvm) {
          const { createPublicClient: createViemClient } = await import('viem');
          const { http: viemHttp } = await import('viem');
          const { formatUnits } = await import('viem');

          const evmClient = createViemClient({
            transport: viemHttp(networkConfig.rpcUrl),
          });

          const evmBalanceWei = await evmClient.getBalance({
            address: address as `0x${string}`,
          });
          evmBalance = formatUnits(evmBalanceWei, 18);
        }

        res.json({
          address,
          balances: {
            core: coreBalance,
            evm: evmBalance,
          },
          network,
          config: networkConfig,
        });
      } catch (error) {
        logger.error('Address balance check failed:', error);

        res.json({
          address,
          balances: {
            core: '0',
            evm: '0',
          },
          error: 'Failed to fetch balance',
          details: error instanceof Error ? error.message : 'Unknown error',
          network: currentNetwork,
          config: getNetworkConfig(currentNetwork),
        });
      }
    }
  );

  // Get balance
  router.get(
    '/accounts/:index/balance',
    async (req: AuthenticatedRequest, res) => {
      const devkit = getDevKit(); // Always get fresh instance
      const indexParam = Array.isArray(req.params.index)
        ? req.params.index[0]
        : req.params.index;
      try {
        const index = parseInt(indexParam ?? '', 10);
        if (Number.isNaN(index) || index < 0 || index >= 10) {
          return res.status(400).json({ error: 'Invalid account index (0-9)' });
        }

        // Use the current backend network state
        const network = currentNetwork;
        const networkConfig = getNetworkConfig(network);

        // Only check local node status when using local network
        if (network === 'local') {
          try {
            const status = await devkit.getStatus();
            if (
              status.core.status !== 'running' &&
              status.evm.status !== 'running'
            ) {
              return res.json({
                index,
                balances: {
                  core: '0',
                  evm: '0',
                },
                error: 'Node is not running',
                nodeStatus: 'stopped',
                network,
                config: networkConfig,
              });
            }
          } catch {
            // Node is stopped, return zero balances
            return res.json({
              index,
              balances: {
                core: '0',
                evm: '0',
              },
              error: 'Node is not running',
              nodeStatus: 'stopped',
              network,
              config: networkConfig,
            });
          }
        }

        const account = devkit.account(index);
        let coreBalance: string;
        let evmBalance: string;

        if (network === 'local') {
          // Use DevKit's local clients for local network
          coreBalance = (await account.getBalance('core')) as string;
          evmBalance = (await account.getBalance('evm')) as string;
        } else {
          // For testnet/mainnet, create clients with external RPC URLs
          const { createPublicClient: createViemClient } = await import('viem');
          const { http: viemHttp } = await import('viem');
          const { formatUnits } = await import('viem');

          const { createPublicClient: createCoreClient } = await import('cive');
          const { http: coreHttp } = await import('cive');
          const { formatCFX } = await import('cive');

          // Create EVM client for external networks
          const evmClient = createViemClient({
            transport: viemHttp(networkConfig.rpcUrl),
          });

          // Create Core client for external networks
          const coreClient = createCoreClient({
            transport: coreHttp(networkConfig.coreRpcUrl),
          });

          // For external networks, derive Core address from private key for correct network
          const { privateKeyToAccount: corePrivateKeyToAccount } = await import(
            'cive/accounts'
          );
          const { privateKeyToAccount: evmPrivateKeyToAccount } = await import(
            'viem/accounts'
          );

          // Get private keys from DevKit account (Core and EVM use different derivation paths)
          const corePrivateKey = account.privateKey as `0x${string}`;
          const evmPrivateKey = account.evmPrivateKey as `0x${string}`;

          // Generate addresses for current network using correct private keys
          const coreAccount = corePrivateKeyToAccount(corePrivateKey, {
            networkId: networkConfig.coreNetworkId,
          });
          const evmAccount = evmPrivateKeyToAccount(evmPrivateKey);

          // Fetch balances from external networks using network-specific addresses
          const [evmBalanceWei, coreBalanceDrip] = await Promise.all([
            evmClient.getBalance({
              address: evmAccount.address as `0x${string}`,
            }),
            coreClient.getBalance({
              address: coreAccount.address,
            }),
          ]);

          evmBalance = formatUnits(evmBalanceWei, 18);
          coreBalance = formatCFX(coreBalanceDrip);
        }

        res.json({
          index,
          balances: {
            core: coreBalance,
            evm: evmBalance,
          },
          network,
          config: networkConfig,
        });
      } catch (error) {
        logger.error('Balance check failed:', error);

        // Return graceful error instead of 500
        res.json({
          index: parseInt(indexParam ?? '', 10) || 0,
          balances: {
            core: '0',
            evm: '0',
          },
          error: 'Failed to fetch balance',
          details: error instanceof Error ? error.message : 'Unknown error',
          network: currentNetwork,
          config: getNetworkConfig(currentNetwork),
        });
      }
    }
  );

  // Faucet: fund any address on Core or eSpace (LOCAL ONLY)
  router.post('/faucet', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Faucet');
    }

    try {
      logger.info('Faucet request received:', req.body);
      const { address, amount } = req.body as { address?: string | string[]; amount?: string | string[] };
      const addressValue = Array.isArray(address) ? address[0] : address;
      const amountValue = Array.isArray(amount) ? amount[0] : amount;

      if (!addressValue || !amountValue) {
        logger.error('Faucet request missing address or amount');
        return res.status(400).json({ error: 'Address and amount are required' });
      }

      logger.info(`Funding account ${addressValue} with ${amountValue} CFX`);
      // Use unified faucet that auto-detects address type (Core or eSpace)
      const txHash = await devkit.fundAccount(addressValue, amountValue);
      logger.info('Faucet transaction hash:', txHash);
      
      // Mine a block to ensure the faucet transaction is included in the blockchain
      try {
        logger.info('Mining block to include faucet transaction');
        await devkit.mineBlocks(1);
        logger.info('Block mined successfully');
      } catch (mineError) {
        logger.warn('Failed to mine block after faucet transfer:', mineError);
        // Don't fail the request if mining fails - the transfer was sent
      }

      logger.info('Faucet request completed successfully');
      res.json({
        transactionHash: txHash,
        address: addressValue,
        amount: amountValue,
      });
    } catch (error) {
      logger.error('Faucet funding failed:', error);
      res.status(500).json({
        error: 'Faucet funding failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Deploy contract endpoint
  router.post('/deploy', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const {
        abi,
        bytecode,
        args = [],
        accountIndex = 0,
        chain = 'core',
      } = req.body;

      if (!abi || !bytecode) {
        return res.status(400).json({ error: 'ABI and bytecode are required' });
      }

      const chainType = chain as 'core' | 'evm';
      const deployResult = await devkit.deployContract({
        abi,
        bytecode,
        args,
        account: accountIndex,
        chain: chainType,
      });

      const account = devkit.account(accountIndex);
      const contractAddress = deployResult[chainType];

      res.json({
        address: contractAddress,
        chain,
        deployer: account.address[chainType],
      });
    } catch (error) {
      logger.error('Deploy contract error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Deploy failed',
      });
    }
  });

  // Node info: client versions and network ids (core + eSpace)
  // Get version information (public endpoint - no auth required)
  router.get('/node/info', async (_req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const rpcUrls = devkit.getRpcUrls();
      const config = devkit.getConfig();

      const callRpc = async (url: string, method: string): Promise<any> => {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method, params: [], id: 1 }),
        });
        return response.json() as Promise<any>;
      };

      const [coreVersionResp, coreStatusResp, evmVersionResp, evmNetResp, evmChainIdResp] =
        await Promise.all([
          callRpc(rpcUrls.core, 'cfx_clientVersion').catch(() => null),
          callRpc(rpcUrls.core, 'cfx_getStatus').catch(() => null),
          callRpc(rpcUrls.evm, 'web3_clientVersion').catch(() => null),
          callRpc(rpcUrls.evm, 'net_version').catch(() => null),
          callRpc(rpcUrls.evm, 'eth_chainId').catch(() => null),
        ]);

      const parseHex = (hex?: string) => {
        if (!hex) return undefined;
        try {
          return parseInt(hex, 16);
        } catch (err) {
          return undefined;
        }
      };

      const coreNetworkId = coreStatusResp?.result?.networkId
        ? parseHex(coreStatusResp.result.networkId as string)
        : undefined;
      const coreChainId = coreStatusResp?.result?.chainId
        ? parseHex(coreStatusResp.result.chainId as string)
        : config.chainId;

      const evmNetworkId = evmNetResp?.result ? Number(evmNetResp.result as string) : undefined;
      const evmChainId = parseHex(evmChainIdResp?.result as string) ?? config.evmChainId;

      res.json({
        core: {
          clientVersion: coreVersionResp?.result,
          chainId: coreChainId,
          networkId: coreNetworkId,
        },
        eSpace: {
          clientVersion: evmVersionResp?.result,
          chainId: evmChainId,
          networkId: evmNetworkId,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch node info:', error);
      res.status(500).json({ error: 'Failed to fetch node info' });
    }
  });

  // ============================================
  // CONFIGURATION MANAGEMENT ENDPOINTS
  // ============================================

  // Get current configuration
  router.get('/config', async (_req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const config = devkit.getConfig();
      const rpcUrls = devkit.getRpcUrls();
      const miningStatus = devkit.getMiningStatus();
      
      res.json({
        node: {
          chainId: config.chainId,
          evmChainId: config.evmChainId,
          jsonrpcHttpPort: config.jsonrpcHttpPort,
          jsonrpcHttpEthPort: config.jsonrpcHttpEthPort,
          jsonrpcWsPort: config.jsonrpcWsPort,
          jsonrpcWsEthPort: config.jsonrpcWsEthPort,
          logging: config.log,
        },
        rpcUrls,
        mining: {
          isRunning: miningStatus?.isRunning ?? false,
          interval: miningStatus?.interval ?? 0,
          mode: miningStatus?.isRunning ? 'auto' : 'manual',
        },
        network: currentNetwork,
      });
    } catch (error) {
      logger.error('Failed to get configuration:', error);
      res.status(500).json({
        error: 'Failed to get configuration',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get configuration in a format suitable for CLI display
  router.get('/config/view', async (_req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const config = devkit.getConfig();
      const rpcUrls = devkit.getRpcUrls();
      const miningStatus = devkit.getMiningStatus();
      const keystore = getKeystoreService();
      
      // Format for CLI-style display
      const configView = {
        'Network Configuration': {
          'Core Space Chain ID': config.chainId,
          'eSpace Chain ID': config.evmChainId,
          'Current Network': currentNetwork,
        },
        'RPC Ports': {
          'Core HTTP RPC': config.jsonrpcHttpPort,
          'Core WebSocket': config.jsonrpcWsPort || 'Not configured',
          'eSpace HTTP RPC': config.jsonrpcHttpEthPort,
          'eSpace WebSocket': config.jsonrpcWsEthPort || 'Not configured',
        },
        'RPC URLs': {
          'Core Space': rpcUrls.core,
          'eSpace': rpcUrls.evm,
        },
        'Mining Configuration': {
          'Mode': miningStatus?.isRunning ? 'Auto' : 'Manual',
          'Interval (ms)': miningStatus?.interval ?? 'N/A',
          'Status': miningStatus?.isRunning ? 'Running' : 'Stopped',
        },
        'Wallet': {
          'Active Wallet': keystore.getActiveLabel(),
          'Wallets Count': keystore.getEntries().length,
          'Data Directory': await keystore.getDataDir(),
          'Mnemonic Hash': (await keystore.getMnemonicHash()).substring(0, 8) + '...',
        },
        'Logging': {
          'Enabled': config.log,
        },
      };
      
      res.json(configView);
    } catch (error) {
      logger.error('Failed to get config view:', error);
      res.status(500).json({
        error: 'Failed to get configuration',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Update configuration (requires node restart for most settings)
  router.post('/config/update', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const { 
        chainId, 
        evmChainId, 
        jsonrpcHttpPort, 
        jsonrpcHttpEthPort,
        logging,
        miningInterval,
      } = req.body;

      // Validate values if provided
      const updates: Record<string, any> = {};
      const requiresRestart: string[] = [];

      if (chainId !== undefined) {
        if (typeof chainId !== 'number' || chainId <= 0) {
          return res.status(400).json({ error: 'Invalid chainId' });
        }
        updates.chainId = chainId;
        requiresRestart.push('chainId');
      }

      if (evmChainId !== undefined) {
        if (typeof evmChainId !== 'number' || evmChainId <= 0) {
          return res.status(400).json({ error: 'Invalid evmChainId' });
        }
        updates.evmChainId = evmChainId;
        requiresRestart.push('evmChainId');
      }

      if (jsonrpcHttpPort !== undefined) {
        if (typeof jsonrpcHttpPort !== 'number' || jsonrpcHttpPort < 1 || jsonrpcHttpPort > 65535) {
          return res.status(400).json({ error: 'Invalid jsonrpcHttpPort' });
        }
        updates.jsonrpcHttpPort = jsonrpcHttpPort;
        requiresRestart.push('jsonrpcHttpPort');
      }

      if (jsonrpcHttpEthPort !== undefined) {
        if (typeof jsonrpcHttpEthPort !== 'number' || jsonrpcHttpEthPort < 1 || jsonrpcHttpEthPort > 65535) {
          return res.status(400).json({ error: 'Invalid jsonrpcHttpEthPort' });
        }
        updates.jsonrpcHttpEthPort = jsonrpcHttpEthPort;
        requiresRestart.push('jsonrpcHttpEthPort');
      }

      if (logging !== undefined) {
        updates.logging = Boolean(logging);
        requiresRestart.push('logging');
      }

      // Mining interval can be updated without restart
      if (miningInterval !== undefined) {
        if (typeof miningInterval !== 'number' || miningInterval < 100) {
          return res.status(400).json({ error: 'Mining interval must be at least 100ms' });
        }
        await devkit.setMiningInterval(miningInterval);
      }

      // Note: Node configuration updates require restart to take effect
      // The actual config update would need to be persisted and applied on restart
      
      res.json({
        success: true,
        updates,
        requiresRestart: requiresRestart.length > 0,
        restartRequired: requiresRestart,
        message: requiresRestart.length > 0 
          ? `Configuration updated. Restart the node for these changes to take effect: ${requiresRestart.join(', ')}`
          : 'Configuration updated',
      });
    } catch (error) {
      logger.error('Failed to update configuration:', error);
      res.status(500).json({
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Read contract function
  router.post('/contracts/read', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const {
        address,
        abi,
        functionName,
        args = [],
        chain = 'core',
      } = req.body;

      if (!address || !abi || !functionName) {
        return res.status(400).json({
          error: 'Address, ABI, and function name are required',
        });
      }

      const network = currentNetwork;
      
      if (network === 'local') {
        // Use DevKit for local network
        const chainType = chain as 'core' | 'evm';
        const result = await devkit.readContract({
          address,
          abi,
          functionName,
          args,
          chain: chainType,
        });

        // Convert BigInt values to strings for JSON serialization
        const serializableResult = JSON.parse(JSON.stringify(result, (_key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ));

        // Send response with custom JSON handling for BigInt
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
          result: serializableResult,
          functionName,
          chain,
        }, (_key, value) => typeof value === 'bigint' ? value.toString() : value));
      } else {
        // For external networks, we need to implement contract reading
        // For now, return an error since external contract interaction isn't implemented
        res.status(501).json({
          error: 'Contract interaction on external networks not yet implemented',
        });
      }
    } catch (error) {
      logger.error('Read contract error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Contract read failed',
      });
    }
  });

  // Write contract function
  router.post('/contracts/write', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const {
        address,
        abi,
        functionName,
        args = [],
        chain = 'core',
        accountIndex = 0,
      } = req.body;

      if (!address || !abi || !functionName) {
        return res.status(400).json({
          error: 'Address, ABI, and function name are required',
        });
      }

      const network = currentNetwork;
      
      if (network === 'local') {
        // Use DevKit for local network
        const chainType = chain as 'core' | 'evm';
        const transactionHash = await devkit.writeContract({
          address,
          abi,
          functionName,
          args,
          account: accountIndex,
          chain: chainType,
        });

        res.json({
          transactionHash,
          functionName,
          chain,
          account: accountIndex,
        });
      } else {
        // For external networks, we need to implement contract writing
        // For now, return an error since external contract interaction isn't implemented
        res.status(501).json({
          error: 'Contract interaction on external networks not yet implemented',
        });
      }
    } catch (error) {
      logger.error('Write contract error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Contract write failed',
      });
    }
  });

  // Get contract info
  router.get('/contracts/:address', async (req, res) => {
    try {
      const { address } = req.params;
      const chainParam = Array.isArray(req.query.chain) ? req.query.chain[0] : req.query.chain;
      const chain = (chainParam ?? 'core') as string;

      // For now, just return basic info
      // In a real implementation, you might want to store contract metadata
      res.json({
        address,
        chain,
        // Could add more contract details here
      });
    } catch (error) {
      logger.error('Contract info failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Send transaction (authenticated users only)
  router.post('/transactions/send', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    try {
      const { accountIndex = 0, to, value, chain = 'core' } = req.body;

      if (!to || !value) {
        return res
          .status(400)
          .json({ error: 'Recipient address and value are required' });
      }

      const chainType = chain as 'core' | 'evm';
      const account = devkit.account(accountIndex);
      const txHash = await account.transfer(to, value, chainType);

      res.json({
        transactionHash: txHash,
        from: account.address[chainType],
        to,
        value,
        chain,
      });
    } catch (error) {
      logger.error('Transaction failed:', error);
      res.status(500).json({
        error: 'Transaction failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Sign message (authenticated users only)
  router.post(
    '/accounts/:index/sign',
    async (req: AuthenticatedRequest, res) => {
      const devkit = getDevKit(); // Always get fresh instance
      try {
          const indexParam = Array.isArray(req.params.index)
            ? req.params.index[0]
            : req.params.index;
          const accountIndex = parseInt(indexParam ?? '', 10);
        const { message, chain = 'core' } = req.body as { message?: string | string[]; chain?: string | string[] };
        const messageValue = Array.isArray(message) ? message[0] : message;

        if (!messageValue) {
          return res.status(400).json({ error: 'Message is required' });
        }

        if (Number.isNaN(accountIndex) || accountIndex < 0) {
          return res.status(400).json({ error: 'Invalid account index' });
        }

        const chainValue = Array.isArray(chain) ? chain[0] : chain;
        const chainType = chainValue as 'core' | 'evm';
        const account = devkit.account(accountIndex);

        let signature: string;
        if (chainType === 'core') {
          signature = await account.core.signMessage(messageValue);
        } else {
          signature = await account.evm.signMessage(messageValue);
        }

        res.json({
          signature,
          message: messageValue,
          address: account.address[chainType],
          chain: chainType,
          accountIndex,
        });
      } catch (error) {
        logger.error('Message signing failed:', error);
        res.status(500).json({
          error: 'Message signing failed',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // ===== NODE CONTROL ENDPOINTS (LOCAL ONLY) =====

  // Start node (if stopped) - LOCAL ONLY
  router.post('/node/start', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Node start');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Check if already running (handle case where status check fails)
      try {
        const status = await devkit.getStatus();
        if (status.core.status === 'running') {
          return res.json({ message: 'Node is already running', status });
        }
      } catch (statusError) {
        // Status check failed, assume node is stopped and continue with start
        console.log(
          'Status check failed, assuming node is stopped:',
          statusError
        );
      }

      // Get configuration from request body
      const config = req.body || {};
      const startOptions: any = {};

      // Map configuration to start options
      if (config.chainId !== undefined) {
        startOptions.chainId = Number(config.chainId);
      }
      if (config.evmChainId !== undefined) {
        startOptions.evmChainId = Number(config.evmChainId);
      }
      if (config.accountsCount !== undefined) {
        startOptions.accountsCount = Number(config.accountsCount);
      }
      if (config.miningAuthor !== undefined && config.miningAuthor !== '') {
        startOptions.miningAuthor = config.miningAuthor;
      }
      // Note: autoMining and miningInterval are deprecated
      // Mining is controlled via testClient - use /mining/start and /mining/stop endpoints
      if (config.persistence !== undefined) {
        startOptions.persistence = config.persistence;
      }
      if (config.configChanged) {
        startOptions.configChanged = true;
      }

      logger.info('Starting node with config:', startOptions);
      await devkit.start(startOptions);

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      res.json({
        message: 'Node started successfully',
        status: await devkit.getStatus(),
      });
    } catch (error) {
      logger.error('Node start failed:', error);
      res.status(500).json({
        error: 'Failed to start node',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Stop node - LOCAL ONLY
  router.post('/node/stop', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Node stop');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      await devkit.stop();

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      // Return updated status after stopping
      const status = await devkit.getStatus();
      res.json({
        message: 'Node stopped successfully',
        status: status,
      });
    } catch (error) {
      logger.error('Node stop failed:', error);
      res.status(500).json({
        error: 'Failed to stop node',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Reset node (stop, optionally clear data, restart) - LOCAL ONLY
  router.post('/node/reset', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Node reset');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { clearData = false } = req.body;

      // Stop the node first
      try {
        const status = await devkit.getStatus();
        if (status.core.status === 'running') {
          await devkit.stop();
        }
      } catch (error) {
        // Node might already be stopped
        logger.info('Node was not running, proceeding with reset');
      }

      // Clear data if requested
      if (clearData) {
        logger.info('Clearing blockchain data directory...');
        await devkit.clearData();
      }

      // Start the node
      await devkit.start();

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      res.json({
        message: clearData ? 'Node reset with fresh data' : 'Node restarted',
        dataCleared: clearData,
        status: await devkit.getStatus(),
      });
    } catch (error) {
      logger.error('Node reset failed:', error);
      res.status(500).json({
        error: 'Failed to reset node',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Clear blockchain data without restarting - LOCAL ONLY
  router.post('/node/clear-data', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Clear data');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Check if node is running
      const status = await devkit.getStatus();
      if (status.core.status === 'running') {
        return res.status(400).json({
          error: 'Cannot clear data while node is running',
          message: 'Please stop the node first',
        });
      }

      logger.info('Clearing blockchain data directory...');
      await devkit.clearData();

      res.json({
        message: 'Blockchain data deleted successfully',
      });
    } catch (error) {
      logger.error('Clear data failed:', error);
      res.status(500).json({
        error: 'Failed to clear data',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ===== MINING CONTROL ENDPOINTS (LOCAL ONLY) =====
  // Mining is controlled via testClient following xcfx-node test patterns
  // No auto-mining configuration - everything is manual via these endpoints

  // Start mining - LOCAL ONLY
  router.post('/mining/start', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Mining');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Check if node is running first
      try {
        const status = await devkit.getStatus();
        if (
          status.core.status !== 'running' &&
          status.evm.status !== 'running'
        ) {
          return res.status(400).json({
            error:
              'Cannot start mining: Node is not running. Start the node first.',
          });
        }
      } catch {
        return res.status(400).json({
          error:
            'Cannot start mining: Node is not running. Start the node first.',
        });
      }

      await devkit.startMining();

      const miningStatus = devkit.getMiningStatus();

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      res.json({
        message: 'Mining started successfully',
        status: miningStatus,
      });
    } catch (error) {
      logger.error('Mining start failed:', error);
      res.status(500).json({
        error: 'Failed to start mining',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Stop mining - LOCAL ONLY
  router.post('/mining/stop', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Mining');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      try {
        await devkit.stopMining();
      } catch (error) {
        // Check if error is due to mining not running
        if (
          error instanceof Error &&
          error.message.includes('Mining is not running')
        ) {
          // Mining is already stopped, just return current status
          const miningStatus = devkit.getMiningStatus();
          return res.json({
            message: 'Mining was already stopped',
            status: miningStatus,
          });
        }
        throw error; // Re-throw other errors
      }

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      const miningStatus = devkit.getMiningStatus();
      res.json({
        message: 'Mining stopped successfully',
        status: miningStatus,
      });
    } catch (error) {
      logger.error('Mining stop failed:', error);
      res.status(500).json({
        error: 'Failed to stop mining',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Set mining interval - LOCAL ONLY
  router.post('/mining/interval', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Mining interval');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { interval } = req.body;
      if (!interval || interval < 100) {
        return res.status(400).json({
          error: 'Mining interval must be at least 100ms',
        });
      }

      await devkit.setMiningInterval(interval);

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      const miningStatus = devkit.getMiningStatus();
      res.json({
        message: 'Mining interval updated successfully',
        status: miningStatus,
      });
    } catch (error) {
      logger.error('Mining interval update failed:', error);
      res.status(500).json({
        error: 'Failed to update mining interval',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Mine specific blocks - LOCAL ONLY
  router.post('/mining/mine', async (req: AuthenticatedRequest, res) => {
    const devkit = getDevKit(); // Always get fresh instance
    // Check if on local network
    if (!isLocalNetwork()) {
      return localOnlyError(res, 'Mining');
    }

    try {
      if (!req.wallet?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { blocks = 1, numTxs } = req.body;
      if (blocks < 1 || blocks > 100) {
        return res.status(400).json({
          error: 'Block count must be between 1 and 100',
        });
      }

      // Use mineBlocks for better control over mining mode
      await devkit.mineBlocks(blocks, numTxs);

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      const miningStatus = devkit.getMiningStatus();
      res.json({
        message: numTxs !== undefined
          ? `Mined blocks with transaction packing (numTxs=${numTxs})`
          : `Mined ${blocks} empty blocks`,
        blocks,
        numTxs,
        status: miningStatus,
      });
    } catch (error) {
      logger.error('Manual mining failed:', error);
      res.status(500).json({
        error: 'Failed to mine blocks',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Network switching endpoint
  router.post('/network/switch', async (req: AuthenticatedRequest, res) => {
    try {
      const { network } = req.body;

      if (!network || !['local', 'testnet', 'mainnet'].includes(network)) {
        return res.status(400).json({
          error: 'Invalid network',
          message: 'Network must be one of: local, testnet, mainnet',
        });
      }

      // Update the current network state
      currentNetwork = network as NetworkType;
      const networkConfig = getNetworkConfig(currentNetwork);
      const capabilities = getNetworkCapabilities(currentNetwork);

      logger.info(`Network switched to: ${network}`, networkConfig);

      // Notify WebSocket clients about network change
      if (wsServer) {
        wsServer.broadcast({
          type: 'network-switched',
          data: {
            network,
            config: networkConfig,
            capabilities,
          },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        message: `Switched to ${network} network`,
        network,
        config: networkConfig,
        capabilities,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Network switch failed:', error);
      res.status(500).json({
        error: 'Failed to switch network',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get current network endpoint
  router.get('/network/current', async (_req: AuthenticatedRequest, res) => {
    try {
      const networkConfig = getNetworkConfig(currentNetwork);
      const capabilities = getNetworkCapabilities(currentNetwork);
      res.json({
        network: currentNetwork,
        config: networkConfig,
        capabilities,
      });
    } catch (error) {
      logger.error('Get current network failed:', error);
      res.status(500).json({
        error: 'Failed to get current network',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ============================================
  // WALLET / KEYSTORE MANAGEMENT ENDPOINTS
  // ============================================

  // Get all keystore entries (without mnemonics)
  router.get('/wallet/keystore', async (_req: AuthenticatedRequest, res) => {
    try {
      const keystore = getKeystoreService();
      const entries = keystore.getEntries();
      res.json({
        entries,
        activeIndex: keystore.getActiveIndex(),
        activeLabel: keystore.getActiveLabel(),
      });
    } catch (error) {
      logger.error('Failed to get keystore entries:', error);
      res.status(500).json({
        error: 'Failed to get keystore entries',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get data directory info for all wallets
  router.get('/wallet/data-dirs', async (_req: AuthenticatedRequest, res) => {
    try {
      const keystore = getKeystoreService();
      const dataDirs = await keystore.getDataDirInfo();
      const activeDataDir = await keystore.getDataDir();
      res.json({
        activeDataDir,
        wallets: dataDirs,
      });
    } catch (error) {
      logger.error('Failed to get data directory info:', error);
      res.status(500).json({
        error: 'Failed to get data directory info',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ============================================
  // ADMIN WALLET ENDPOINTS
  // ============================================

  // Get admin wallet info
  router.get('/wallet/admin', async (_req: AuthenticatedRequest, res) => {
    try {
      const keystore = getKeystoreService();
      const adminAddress = keystore.getAdminAddress();
      const hasAdminKey = keystore.getAdminPrivateKey() !== null;
      
      res.json({
        adminAddress,
        hasAdminKey,
        isSet: !!adminAddress,
      });
    } catch (error) {
      logger.error('Failed to get admin info:', error);
      res.status(500).json({
        error: 'Failed to get admin info',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Set admin private key
  router.post('/wallet/admin/set', async (req: AuthenticatedRequest, res) => {
    try {
      const { privateKey } = req.body;
      const keystore = getKeystoreService();

      if (!privateKey || typeof privateKey !== 'string') {
        return res.status(400).json({
          error: 'Invalid private key',
          message: 'Private key must be a hex string',
        });
      }

      await keystore.setAdminPrivateKey(privateKey);
      const adminAddress = keystore.getAdminAddress();

      res.json({
        success: true,
        adminAddress,
        message: 'Admin private key set successfully',
      });
    } catch (error) {
      logger.error('Failed to set admin key:', error);
      res.status(400).json({
        error: 'Failed to set admin key',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Reset admin to default (first account of active mnemonic)
  router.post('/wallet/admin/reset', async (_req: AuthenticatedRequest, res) => {
    try {
      const keystore = getKeystoreService();
      await keystore.resetAdminToDefault();
      const adminAddress = keystore.getAdminAddress();

      res.json({
        success: true,
        adminAddress,
        message: 'Admin reset to first account of active mnemonic',
      });
    } catch (error) {
      logger.error('Failed to reset admin:', error);
      res.status(400).json({
        error: 'Failed to reset admin',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ============================================
  // ENCRYPTION ENDPOINTS
  // ============================================

  // Get comprehensive wallet status
  router.get('/wallet/status', async (_req: AuthenticatedRequest, res) => {
    try {
      const keystore = getKeystoreService();
      const status = await keystore.getWalletStatus();
      res.json(status);
    } catch (error) {
      logger.error('Failed to get wallet status:', error);
      res.status(500).json({
        error: 'Failed to get wallet status',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get encryption status
  router.get('/wallet/encryption/status', async (_req: AuthenticatedRequest, res) => {
    try {
      const keystore = getKeystoreService();
      res.json({
        enabled: keystore.isEncrypted(),
        unlocked: keystore.isUnlocked(),
      });
    } catch (error) {
      logger.error('Failed to get encryption status:', error);
      res.status(500).json({
        error: 'Failed to get encryption status',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Enable encryption
  router.post('/wallet/encryption/enable', async (req: AuthenticatedRequest, res) => {
    try {
      const { password } = req.body;
      const keystore = getKeystoreService();

      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          error: 'Invalid password',
          message: 'Password is required',
        });
      }

      await keystore.enableEncryption(password);

      res.json({
        success: true,
        message: 'Encryption enabled successfully',
      });
    } catch (error) {
      logger.error('Failed to enable encryption:', error);
      res.status(400).json({
        error: 'Failed to enable encryption',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Disable encryption
  router.post('/wallet/encryption/disable', async (req: AuthenticatedRequest, res) => {
    try {
      const { password } = req.body;
      const keystore = getKeystoreService();

      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          error: 'Invalid password',
          message: 'Password is required',
        });
      }

      await keystore.disableEncryption(password);

      res.json({
        success: true,
        message: 'Encryption disabled successfully',
      });
    } catch (error) {
      logger.error('Failed to disable encryption:', error);
      res.status(400).json({
        error: 'Failed to disable encryption',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Unlock encrypted keystore
  router.post('/wallet/encryption/unlock', async (req: AuthenticatedRequest, res) => {
    try {
      const { password } = req.body;
      const keystore = getKeystoreService();

      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          error: 'Invalid password',
          message: 'Password is required',
        });
      }

      const unlocked = await keystore.unlock(password);

      if (!unlocked) {
        return res.status(401).json({
          error: 'Invalid password',
          message: 'The provided password is incorrect',
        });
      }

      res.json({
        success: true,
        message: 'Keystore unlocked successfully',
      });
    } catch (error) {
      logger.error('Failed to unlock keystore:', error);
      res.status(400).json({
        error: 'Failed to unlock keystore',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Add a new mnemonic to keystore (with node restart support)
  router.post('/wallet/keystore/add', async (req: AuthenticatedRequest, res) => {
    try {
      const { mnemonic, label, setActive, generate } = req.body;
      const keystore = getKeystoreService();

      // If generate is true, create a new mnemonic
      const mnemonicToAdd = generate ? undefined : mnemonic;

      // Validate mnemonic if provided
      if (mnemonicToAdd && !keystore.validateMnemonic(mnemonicToAdd)) {
        return res.status(400).json({
          error: 'Invalid mnemonic',
          message: 'The provided mnemonic phrase is not valid BIP-39',
        });
      }

      // Use DevKitManager if available and setActive is true
      if (devkitManager && typeof devkitManager.addMnemonic === 'function' && setActive) {
        logger.info('Adding new wallet via DevKitManager with auto-switch...');

        const result = await devkitManager.addMnemonic({
          mnemonic: mnemonicToAdd,
          label,
          setActive: true,
        });

        const response: any = {
          success: true,
          index: result.index,
          label: result.label,
          switchedTo: result.switchedTo,
          message: result.switchedTo
            ? `Wallet "${result.label}" added and activated (node restarted)`
            : `Wallet "${result.label}" added successfully`,
        };

        // If generated, retrieve and return the mnemonic
        if (generate) {
          const newMnemonic = await keystore.showActiveMnemonic(true);
          response.mnemonic = newMnemonic;
          response.warning = 'Save this mnemonic phrase securely. It will not be shown again.';
        }

        res.json(response);
      } else {
        // Fallback to keystore-only (legacy mode or setActive=false)
        const result = await keystore.addMnemonic({
          mnemonic: mnemonicToAdd,
          label,
          setActive: setActive ?? false,
        });

        const response: any = {
          success: true,
          index: result.index,
          label: result.label,
          message: `Wallet "${result.label}" added successfully`,
        };

        if (generate) {
          // Get the newly generated mnemonic to show the user once
          const entries = keystore.getEntries();
          const newEntry = entries[result.index];
          if (newEntry && setActive) {
            response.mnemonic = await keystore.showActiveMnemonic(true);
            response.warning = 'Save this mnemonic phrase securely. It will not be shown again.';
          }
        }

        res.json(response);
      }
    } catch (error) {
      logger.error('Failed to add mnemonic:', error);
      res.status(500).json({
        error: 'Failed to add mnemonic',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Delete a mnemonic from keystore
  router.delete('/wallet/keystore/:index', async (req: AuthenticatedRequest, res) => {
    try {
      const indexParam = req.params.index;
      const index = parseInt(Array.isArray(indexParam) ? indexParam[0] : indexParam, 10);
      const keystore = getKeystoreService();

      if (isNaN(index)) {
        return res.status(400).json({
          error: 'Invalid index',
          message: 'Index must be a number',
        });
      }

      await keystore.deleteMnemonic(index);

      res.json({
        success: true,
        message: `Wallet at index ${index} deleted`,
        activeIndex: keystore.getActiveIndex(),
      });
    } catch (error) {
      logger.error('Failed to delete mnemonic:', error);
      res.status(400).json({
        error: 'Failed to delete mnemonic',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Set active mnemonic (with node restart support)
  router.post('/wallet/keystore/select', async (req: AuthenticatedRequest, res) => {
    try {
      const { index } = req.body;

      if (typeof index !== 'number') {
        return res.status(400).json({
          error: 'Invalid index',
          message: 'Index must be a number',
        });
      }

      // Use DevKitManager if available for proper node restart
      if (devkitManager && typeof devkitManager.switchMnemonic === 'function') {
        logger.info(`Switching to wallet index ${index} via DevKitManager...`);

        const result = await devkitManager.switchMnemonic(index);

        res.json({
          success: true,
          activeIndex: index,
          activeLabel: result.activeLabel,
          dataDir: result.dataDir,
          nodeRestarted: result.nodeRestarted,
          message: result.nodeRestarted
            ? `Switched to "${result.activeLabel}" and restarted node`
            : `Switched to "${result.activeLabel}"`,
        });
      } else {
        // Fallback to keystore-only update (legacy mode)
        logger.warn('DevKitManager not available, using legacy mnemonic switch (node will NOT restart)');
        const keystore = getKeystoreService();
        await keystore.setActiveMnemonic(index);

        res.json({
          success: true,
          activeIndex: index,
          activeLabel: keystore.getActiveLabel(),
          nodeRestarted: false,
          message: `Active wallet set to "${keystore.getActiveLabel()}" (manual node restart required)`,
        });
      }
    } catch (error) {
      logger.error('Failed to select mnemonic:', error);
      res.status(400).json({
        error: 'Failed to select mnemonic',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Update mnemonic label
  router.patch('/wallet/keystore/:index/label', async (req: AuthenticatedRequest, res) => {
    try {
      const indexParam = req.params.index;
      const index = parseInt(Array.isArray(indexParam) ? indexParam[0] : indexParam, 10);
      const { label } = req.body;
      const keystore = getKeystoreService();

      if (isNaN(index) || !label) {
        return res.status(400).json({
          error: 'Invalid parameters',
          message: 'Index must be a number and label is required',
        });
      }

      await keystore.updateLabel(index, label);

      res.json({
        success: true,
        index,
        label,
        message: `Wallet label updated to "${label}"`,
      });
    } catch (error) {
      logger.error('Failed to update label:', error);
      res.status(400).json({
        error: 'Failed to update label',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Show active mnemonic (requires confirmation)
  router.post('/wallet/keystore/show-mnemonic', async (req: AuthenticatedRequest, res) => {
    try {
      const { confirmed } = req.body;
      const keystore = getKeystoreService();

      if (!confirmed) {
        return res.status(400).json({
          error: 'Confirmation required',
          message: 'You must confirm to view the mnemonic phrase',
          requiresConfirmation: true,
        });
      }

      const mnemonic = keystore.showActiveMnemonic(true);

      res.json({
        mnemonic,
        label: keystore.getActiveLabel(),
        warning: 'Keep this mnemonic phrase secure and never share it.',
      });
    } catch (error) {
      logger.error('Failed to show mnemonic:', error);
      res.status(500).json({
        error: 'Failed to show mnemonic',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Derive a single account
  router.get('/wallet/derive', async (req: AuthenticatedRequest, res) => {
    try {
      const { network, index, customPath } = req.query;
      const keystore = getKeystoreService();

      if (!network || !['core', 'espace'].includes(network as string)) {
        return res.status(400).json({
          error: 'Invalid network',
          message: 'Network must be "core" or "espace"',
        });
      }

      const networkConfig = getNetworkConfig(currentNetwork);
      const account = await keystore.deriveAccount({
        network: network as 'core' | 'espace',
        index: index ? parseInt(index as string, 10) : 0,
        customPath: customPath as string | undefined,
        networkId: network === 'core' ? networkConfig.coreNetworkId : undefined,
      });

      res.json({
        address: account.address,
        path: account.path,
        index: account.index,
        network: account.network,
        // Note: privateKey is intentionally omitted for security
        // Use /wallet/private-key endpoint to get it
      });
    } catch (error) {
      logger.error('Failed to derive account:', error);
      res.status(500).json({
        error: 'Failed to derive account',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Derive multiple accounts
  router.get('/wallet/derive/batch', async (req: AuthenticatedRequest, res) => {
    try {
      const { network, count, startIndex } = req.query;
      const keystore = getKeystoreService();

      if (!network || !['core', 'espace'].includes(network as string)) {
        return res.status(400).json({
          error: 'Invalid network',
          message: 'Network must be "core" or "espace"',
        });
      }

      const networkConfig = getNetworkConfig(currentNetwork);
      const accounts = await keystore.deriveAccounts({
        network: network as 'core' | 'espace',
        count: count ? Math.min(parseInt(count as string, 10), 100) : 10,
        startIndex: startIndex ? parseInt(startIndex as string, 10) : 0,
        networkId: network === 'core' ? networkConfig.coreNetworkId : undefined,
      });

      // Return addresses only, not private keys
      res.json({
        accounts: accounts.map(acc => ({
          address: acc.address,
          path: acc.path,
          index: acc.index,
          network: acc.network,
        })),
        activeWallet: keystore.getActiveLabel(),
      });
    } catch (error) {
      logger.error('Failed to derive accounts:', error);
      res.status(500).json({
        error: 'Failed to derive accounts',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get private key (requires explicit request)
  router.post('/wallet/private-key', async (req: AuthenticatedRequest, res) => {
    try {
      const { network, index, customPath, confirmed } = req.body;
      const keystore = getKeystoreService();

      if (!confirmed) {
        return res.status(400).json({
          error: 'Confirmation required',
          message: 'You must confirm to view the private key',
          requiresConfirmation: true,
        });
      }

      if (!network || !['core', 'espace'].includes(network)) {
        return res.status(400).json({
          error: 'Invalid network',
          message: 'Network must be "core" or "espace"',
        });
      }

      const networkConfig = getNetworkConfig(currentNetwork);
      const account = await keystore.deriveAccount({
        network: network as 'core' | 'espace',
        index: index ?? 0,
        customPath,
        networkId: network === 'core' ? networkConfig.coreNetworkId : undefined,
      });

      res.json({
        privateKey: account.privateKey,
        address: account.address,
        path: account.path,
        network: account.network,
        warning: 'Keep this private key secure and never share it.',
      });
    } catch (error) {
      logger.error('Failed to get private key:', error);
      res.status(500).json({
        error: 'Failed to get private key',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Generate a new mnemonic (preview, not saved)
  router.get('/wallet/generate-mnemonic', async (_req: AuthenticatedRequest, res) => {
    try {
      const keystore = getKeystoreService();
      const mnemonic = keystore.generateMnemonic();

      res.json({
        mnemonic,
        message: 'This mnemonic is not saved. Use POST /wallet/keystore/add to save it.',
        wordCount: mnemonic.split(' ').length,
      });
    } catch (error) {
      logger.error('Failed to generate mnemonic:', error);
      res.status(500).json({
        error: 'Failed to generate mnemonic',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Validate a mnemonic phrase
  router.post('/wallet/validate-mnemonic', async (req: AuthenticatedRequest, res) => {
    try {
      const { mnemonic } = req.body;
      const keystore = getKeystoreService();

      if (!mnemonic) {
        return res.status(400).json({
          error: 'Mnemonic required',
          message: 'Please provide a mnemonic phrase to validate',
        });
      }

      const isValid = keystore.validateMnemonic(mnemonic);

      res.json({
        valid: isValid,
        wordCount: mnemonic.split(' ').length,
        message: isValid ? 'Valid BIP-39 mnemonic' : 'Invalid mnemonic phrase',
      });
    } catch (error) {
      logger.error('Failed to validate mnemonic:', error);
      res.status(500).json({
        error: 'Failed to validate mnemonic',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
