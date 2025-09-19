/**
 * DevKit API Routes
 *
 * REST endpoints that expose DevKit functionality
 */

import type { DevKit } from '@conflux-devkit/node';
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
        chainId: 71,
        rpcUrl: 'https://evmtestnet.confluxrpc.com',
        coreRpcUrl: 'https://test.confluxrpc.com',
      };
    case 'mainnet':
      return {
        chainId: 1030,
        rpcUrl: 'https://evm.confluxrpc.com',
        coreRpcUrl: 'https://main.confluxrpc.com',
      };
    default: // local
      return {
        chainId: 71, // Same as testnet for compatibility
        rpcUrl: 'http://localhost:12537', // Local EVM RPC
        coreRpcUrl: 'http://localhost:12539', // Local Core RPC
      };
  }
}

export function createDevKitRoutes(
  devkit: DevKit,
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
            core: { connected: false, status: 'stopped' },
            evm: { connected: false, status: 'stopped' },
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

      res.json({
        status: nodeStatus,
        running: isRunning,
        mining: miningStatus,
        chains: chainStatus,
        accounts: accounts.length,
        rpcUrls: rpcUrls,
        timestamp: new Date().toISOString(),
        config: {
          chainId: config.chainId,
          evmChainId: config.evmChainId,
          ports: {
            jsonrpcHttp: config.jsonrpcHttpPort,
            jsonrpcHttpEth: config.jsonrpcHttpEthPort,
            jsonrpcWs: config.jsonrpcWsPort,
          },
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
      const accounts = devkit.getAccounts();
      const accountsData = accounts.map((account) => ({
        index: account.index,
        addresses: {
          core: account.address.core,
          evm: account.address.evm,
        },
        isAdmin:
          req.wallet?.address?.toLowerCase() ===
          account.address.evm.toLowerCase(),
      }));

      // Get faucet account info (admin only)
      let faucetAccount = null;
      if (req.wallet?.isAdmin) {
        try {
          const faucet = await devkit.getFaucetAccount();
          faucetAccount = {
            addresses: {
              core: faucet.address.core,
              evm: faucet.address.evm,
            },
          };
        } catch (error) {
          // Faucet account might not be available if node is stopped
          console.warn('Faucet account not available:', error);
        }
      }

      res.json({
        accounts: accountsData,
        total: accountsData.length,
        faucetAccount,
        // Note: Mnemonic is not exposed via DevKit API for security reasons
      });
    } catch (error) {
      logger.error('Failed to get accounts:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  });

  // Get account information
  router.get('/accounts/:index', (req: AuthenticatedRequest, res) => {
    try {
      const index = parseInt(req.params.index, 10);
      if (Number.isNaN(index) || index < 0 || index >= 10) {
        return res.status(400).json({ error: 'Invalid account index (0-9)' });
      }

      const account = devkit.account(index);
      res.json({
        index,
        addresses: {
          core: account.address.core,
          evm: account.address.evm,
        },
        isAdmin:
          req.wallet?.address?.toLowerCase() ===
          account.address.evm.toLowerCase(),
      });
    } catch (error) {
      logger.error('Account info failed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get balance
  router.get(
    '/accounts/:index/balance',
    async (req: AuthenticatedRequest, res) => {
      try {
        const index = parseInt(req.params.index, 10);
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
        const coreBalance = await account.getBalance('core');
        const evmBalance = await account.getBalance('evm');

        res.json({
          index,
          balances: {
            core: coreBalance.toString(),
            evm: evmBalance.toString(),
          },
          network,
          config: networkConfig,
        });
      } catch (error) {
        logger.error('Balance check failed:', error);
        
        // Return graceful error instead of 500
        res.json({
          index: parseInt(req.params.index, 10) || 0,
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

  // Get contract info
  router.get('/contracts/:address', async (req, res) => {
    try {
      const { address } = req.params;
      const { chain = 'core' } = req.query;

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
  router.post('/accounts/:index/sign', async (req: AuthenticatedRequest, res) => {
    try {
      const accountIndex = parseInt(req.params.index, 10);
      const { message, chain = 'core' } = req.body;

      if (!message) {
        return res
          .status(400)
          .json({ error: 'Message is required' });
      }

      if (Number.isNaN(accountIndex) || accountIndex < 0) {
        return res
          .status(400)
          .json({ error: 'Invalid account index' });
      }

      const chainType = chain as 'core' | 'evm';
      const account = devkit.account(accountIndex);
      
      let signature: string;
      if (chainType === 'core') {
        signature = await account.core.signMessage(message);
      } else {
        signature = await account.evm.signMessage(message);
      }

      res.json({
        signature,
        message,
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
  });

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

      await devkit.start();

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

  // ===== MINING CONTROL ENDPOINTS =====

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

      const { blocks = 1 } = req.body;
      if (blocks < 1 || blocks > 100) {
        return res.status(400).json({
          error: 'Block count must be between 1 and 100',
        });
      }

      await devkit.mine(blocks);

      // Force immediate WebSocket status update
      if (wsServer) {
        await wsServer.forceStatusUpdate();
      }

      const miningStatus = devkit.getMiningStatus();
      res.json({
        message: `Mined ${blocks} blocks successfully`,
        blocks,
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
