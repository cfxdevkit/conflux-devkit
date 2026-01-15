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

import type { DevKitCompat } from '../devkit-compat.js';
import { Router } from 'express';
import type { AuthenticatedRequest } from '../auth/AuthService.js';
import type { DevKitWebSocketServer } from '../server/WebSocketServer.js';
import { logger } from '../utils/logger.js';

// Network state management
type NetworkType = 'local' | 'testnet' | 'mainnet';
let currentNetwork: NetworkType = 'local'; // Default to local network

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

export function createDevKitRoutes(
  devkit: DevKitCompat,
  wsServer?: DevKitWebSocketServer
): Router {
  const router = Router();

  // Status endpoint
  router.get('/status', async (_req, res) => {
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
        return res.json({
          status: 'stopped',
          running: false,
          mining: { isRunning: false, interval: 0, blocksMined: 0 },
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

      res.json({
        status: nodeStatus,
        running: isRunning,
        mining: miningStatus,
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

  // Get all accounts
  router.get('/accounts', async (req: AuthenticatedRequest, res) => {
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

      // Get faucet account info (admin only)
      let faucetAccount = null;
      if (req.wallet?.isAdmin) {
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
      const address = Array.isArray(req.params.address)
        ? req.params.address[0]
        : req.params.address;
      
      try {
        const network = currentNetwork;
        const networkConfig = getNetworkConfig(network);

        // Determine if it's a Core or eSpace address
        const isEvmAddress = address?.startsWith('0x') && address.length === 42;
        const isCoreAddress = address?.startsWith('cfx') || address?.startsWith('cfxtest') || address?.startsWith('net');

        if (!isEvmAddress && !isCoreAddress) {
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
        if (isCoreAddress) {
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
        } else if (isEvmAddress) {
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

  // Faucet: fund any address on Core or eSpace
  router.post('/faucet', async (req: AuthenticatedRequest, res) => {
    try {
      logger.info('Faucet request received:', req.body);
      const { address, amount, chain = 'auto' } = req.body as { address?: string | string[]; amount?: string | string[]; chain?: string | string[] };
      const addressValue = Array.isArray(address) ? address[0] : address;
      const amountValue = Array.isArray(amount) ? amount[0] : amount;

      if (!addressValue || !amountValue) {
        logger.error('Faucet request missing address or amount');
        return res.status(400).json({ error: 'Address and amount are required' });
      }

      // Auto-detect chain if not explicitly provided
      const detectChainFromAddress = (addr: string): 'core' | 'evm' | null => {
        if (addr.toLowerCase().startsWith('0x')) return 'evm';
        if (addr.toLowerCase().startsWith('cfx')) return 'core';
        return null;
      };

      const chainValue = Array.isArray(chain) ? chain[0] : chain;
      const normalizedChainRaw = chainValue === 'eSpace' ? 'evm' : chainValue;
      const normalizedChain =
        normalizedChainRaw === 'auto'
          ? detectChainFromAddress(addressValue) || 'core'
          : normalizedChainRaw;

      if (normalizedChain !== 'core' && normalizedChain !== 'evm') {
        logger.error('Invalid chain value:', normalizedChain);
        return res.status(400).json({ error: 'Invalid chain. Use core or eSpace.' });
      }

      logger.info(`Funding account ${addressValue} with ${amountValue} on ${normalizedChain} chain`);
      const txHash = await devkit.fundAccount(addressValue, amountValue, normalizedChain);
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
        chain: normalizedChain === 'evm' ? 'eSpace' : 'core',
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

  // Read contract function
  router.post('/contracts/read', async (req: AuthenticatedRequest, res) => {
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

  // ===== NODE CONTROL ENDPOINTS =====

  // Start node (if stopped)
  router.post('/node/start', async (req: AuthenticatedRequest, res) => {
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

  // Stop node
  router.post('/node/stop', async (req: AuthenticatedRequest, res) => {
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

  // Reset node (stop, optionally clear data, restart)
  router.post('/node/reset', async (req: AuthenticatedRequest, res) => {
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

  // ===== MINING CONTROL ENDPOINTS =====
  // Mining is controlled via testClient following xcfx-node test patterns
  // No auto-mining configuration - everything is manual via these endpoints

  // Start mining
  router.post('/mining/start', async (req: AuthenticatedRequest, res) => {
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

  // Stop mining
  router.post('/mining/stop', async (req: AuthenticatedRequest, res) => {
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

  // Set mining interval
  router.post('/mining/interval', async (req: AuthenticatedRequest, res) => {
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

  // Mine specific blocks
  router.post('/mining/mine', async (req: AuthenticatedRequest, res) => {
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

      logger.info(`Network switched to: ${network}`, networkConfig);

      // Notify WebSocket clients about network change
      if (wsServer) {
        wsServer.broadcast({
          type: 'network-switched',
          data: {
            network,
            config: networkConfig,
          },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        message: `Switched to ${network} network`,
        network,
        config: networkConfig,
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
      res.json({
        network: currentNetwork,
        config: networkConfig,
      });
    } catch (error) {
      logger.error('Get current network failed:', error);
      res.status(500).json({
        error: 'Failed to get current network',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
