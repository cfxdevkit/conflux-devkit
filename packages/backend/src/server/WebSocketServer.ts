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
 * WebSocket Server for real-time DevKit updates
 */

import { WebSocket, WebSocketServer } from 'ws';
import type { DevKitCompat } from '../devkit-compat.js';
import { logger } from '../utils/logger.js';
import type { BackendServerConfig } from './BackendServer.js';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export class DevKitWebSocketServer {
  private wss: WebSocketServer;
  private devkit: DevKitCompat;
  private clients: Set<WebSocket> = new Set();
  private statsInterval: NodeJS.Timeout | null = null;
  private lastKnownNodeStatus: boolean = false;
  private lastMiningStatus: boolean = false;
  private blockMonitorInterval: NodeJS.Timeout | null = null;
  private lastCoreEpoch: number = 0;
  private lastEvmBlock: number = 0;

  constructor(port: number, devkit: DevKitCompat) {
    this.devkit = devkit;
    this.wss = new WebSocketServer({
      port,
      verifyClient: (_info: any) => {
        // Basic validation - could add more sophisticated auth here
        return true;
      },
    });

    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws, req) => {
      logger.info('New WebSocket connection from:', req.socket.remoteAddress);
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        data: { message: 'Connected to DevKit WebSocket server' },
        timestamp: new Date().toISOString(),
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Invalid WebSocket message:', error);
          this.sendToClient(ws, {
            type: 'error',
            data: { error: 'Invalid message format' },
            timestamp: new Date().toISOString(),
          });
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    try {
      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString(),
          });
          break;

        case 'subscribe_balance': {
          // Subscribe to balance updates for a specific account
          const { accountIndex } = message.data || {};
          if (
            typeof accountIndex === 'number' &&
            accountIndex >= 0 &&
            accountIndex < 10
          ) {
            // Store subscription info (in a real app, you'd track this properly)
            this.sendToClient(ws, {
              type: 'subscribed',
              data: { accountIndex, subscription: 'balance' },
              timestamp: new Date().toISOString(),
            });
          } else {
            this.sendToClient(ws, {
              type: 'error',
              data: { error: 'Invalid account index' },
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }

        case 'get_status': {
          const status = {
            devkit: {
              status: 'running',
              uptime: process.uptime(),
            },
            server: {
              uptime: process.uptime(),
              connections: this.clients.size,
            },
          };

          this.sendToClient(ws, {
            type: 'status',
            data: status,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        default:
          this.sendToClient(ws, {
            type: 'error',
            data: { error: `Unknown message type: ${message.type}` },
            timestamp: new Date().toISOString(),
          });
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
      this.sendToClient(ws, {
        type: 'error',
        data: { error: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: WebSocketMessage) {
    this.clients.forEach((client) => {
      this.sendToClient(client, message);
    });
  }

  /**
   * Notify clients about balance changes
   */
  notifyBalanceChange(
    accountIndex: number,
    coreBalance: string,
    evmBalance: string
  ) {
    this.broadcast({
      type: 'balance_update',
      data: {
        accountIndex,
        balances: {
          core: coreBalance,
          evm: evmBalance,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify clients about new transactions
   */
  notifyTransaction(
    txHash: string,
    from: string,
    to: string,
    value: string,
    chain: string
  ) {
    this.broadcast({
      type: 'transaction',
      data: {
        hash: txHash,
        from,
        to,
        value,
        chain,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start smart node statistics updates
   * Polls frequently when node is running, less frequently when stopped
   */
  startNodeStatsUpdates() {
    // Send initial stats
    this.broadcastNodeStats();

    // Start adaptive polling
    this.scheduleNextUpdate();
    
    // Start block monitoring
    this.startBlockMonitoring();
  }

  /**
   * Schedule the next update based on current node status
   */
  private scheduleNextUpdate() {
    if (this.statsInterval) {
      clearTimeout(this.statsInterval);
    }

    // Determine polling interval based on node status
    const interval = this.lastKnownNodeStatus ? 5000 : 30000; // 5s when running, 30s when stopped

    this.statsInterval = setTimeout(async () => {
      await this.broadcastNodeStats();
      this.scheduleNextUpdate(); // Schedule next update
    }, interval);
  }

  /**
   * Stop node statistics updates
   */
  stopNodeStatsUpdates() {
    if (this.statsInterval) {
      clearTimeout(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Force immediate status update (useful when node status changes)
   */
  async forceStatusUpdate() {
    await this.broadcastNodeStats();
    // Reschedule next update with potentially new interval
    this.scheduleNextUpdate();
  }

  /**
   * Broadcast current node statistics
   */
  private async broadcastNodeStats() {
    try {
      let status;
      let config: BackendServerConfig['devkitConfig'];
      let rpcUrls;
      let miningStatus;

      // Check if DevKit is accessible first
      try {
        status = await this.devkit.getStatus();
        config = this.devkit.getConfig();
        rpcUrls = this.devkit.getRpcUrls();
        miningStatus = this.devkit.getMiningStatus();
      } catch (devkitError) {
        // DevK_devkitErrored or unreachable - don't attempt block number fetching
        const nodeRunning = false;

        // Update polling frequency if status changed
        if (this.lastKnownNodeStatus !== nodeRunning) {
          this.lastKnownNodeStatus = nodeRunning;
          logger.info(
            'Node status changed to stopped - reducing polling frequency and stopping block fetching'
          );
        }

        // Broadcast stopped status without attempting any block number fetches
        this.broadcast({
          type: 'nodeStats',
          data: {
            coreBlockNumber: '0',
            evmBlockNumber: '0',
            miningStatus: false,
            nodeRunning: false,
            gasPrice: {
              core: '0',
              evm: '0',
            },
            networkInfo: {
              chainId: 1029,
              evmChainId: 1030,
            },
            status: {
              core: { connected: false, status: 'stopped' },
              evm: { connected: false, status: 'stopped' },
            },
            error: 'Node is stopped',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if node is actually running
      const isNodeRunning =
        status.core.status === 'running' || status.evm.status === 'running';

      // Update polling frequency if status changed
      if (this.lastKnownNodeStatus !== isNodeRunning) {
        this.lastKnownNodeStatus = isNodeRunning;
        logger.info(
          `Node status changed to ${isNodeRunning ? 'running' : 'stopped'} - adjusting polling frequency`
        );
      }

      let coreBlockNumber = '0';
      let evmBlockNumber = '0';

      if (isNodeRunning) {
        // Only try to fetch block numbers if node is running
        try {
          // Get Core chain epoch number
          const coreResponse = await fetch(
            `http://localhost:${config.jsonrpcHttpPort}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'cfx_epochNumber',
                params: [],
                id: 1,
              }),
              signal: AbortSignal.timeout(2000), // 2 second timeout
            }
          );
          const coreData = (await coreResponse.json()) as { result?: string };
          if (coreData.result) {
            coreBlockNumber = parseInt(coreData.result, 16).toString();
          }
        } catch (error) {
          logger.warn('Failed to fetch Core block number:', error);
        }

        try {
          // Get EVM chain block number
          const evmResponse = await fetch(
            `http://localhost:${config.jsonrpcHttpEthPort}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1,
              }),
              signal: AbortSignal.timeout(2000), // 2 second timeout
            }
          );
          const evmData = (await evmResponse.json()) as { result?: string };
          if (evmData.result) {
            evmBlockNumber = parseInt(evmData.result, 16).toString();
          }
        } catch (error) {
          logger.warn('Failed to fetch EVM block number:', error);
        }
      }

      // Track mining status changes
      if (miningStatus && this.lastMiningStatus !== miningStatus.isRunning) {
        this.lastMiningStatus = miningStatus.isRunning;
      }

      this.broadcast({
        type: 'nodeStats',
        data: {
          coreBlockNumber,
          evmBlockNumber,
          miningStatus: isNodeRunning
            ? miningStatus?.isRunning || false
            : false,
          nodeRunning: isNodeRunning,
          gasPrice: {
            core: isNodeRunning ? '1000000000' : '0',
            evm: isNodeRunning ? '20000000000' : '0',
          },
          networkInfo: {
            chainId: config.chainId,
            evmChainId: config.evmChainId,
          },
          rpcEndpoints: isNodeRunning ? rpcUrls : {},
          status: status,
          mining: miningStatus,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to broadcast node stats:', error);
      // Broadcast error status
      this.broadcast({
        type: 'nodeStats',
        data: {
          coreBlockNumber: '0',
          evmBlockNumber: '0',
          miningStatus: false,
          nodeRunning: false,
          gasPrice: { core: '0', evm: '0' },
          networkInfo: { chainId: 1029, evmChainId: 1030 },
          status: {
            core: { connected: false, status: 'error' },
            evm: { connected: false, status: 'error' },
          },
          error: 'Failed to get node status',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Start real-time block monitoring
   * Polls every 500ms to catch blocks immediately after mining
   */
  startBlockMonitoring() {
    this.stopBlockMonitoring(); // Clear any existing interval
    
    this.blockMonitorInterval = setInterval(async () => {
      await this.checkForNewBlocks();
    }, 500); // Check every 500ms (same as mining interval)
  }

  /**
   * Stop block monitoring
   */
  stopBlockMonitoring() {
    if (this.blockMonitorInterval) {
      clearInterval(this.blockMonitorInterval);
      this.blockMonitorInterval = null;
    }
  }

  /**
   * Check for new blocks and broadcast them with transactions
   */
  private async checkForNewBlocks() {
    try {
      const config = this.devkit.getConfig();
      const coreRpcUrl = `http://localhost:${config.jsonrpcHttpPort || 12537}`;
      const evmRpcUrl = `http://localhost:${config.jsonrpcHttpEthPort || 8545}`;

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

      const currentCoreData = await currentCoreResponse.json();
      const currentEvmData = await currentEvmResponse.json();

      const currentCoreEpoch = parseInt(currentCoreData.result, 16);
      const currentEvmBlock = parseInt(currentEvmData.result, 16);

      const blocksWithTxs: any[] = [];

      // Check for new Core epochs
      if (currentCoreEpoch > this.lastCoreEpoch) {
        for (let epoch = this.lastCoreEpoch + 1; epoch <= currentCoreEpoch; epoch++) {
          const response = await fetch(coreRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'cfx_getBlockByEpochNumber',
              params: [`0x${epoch.toString(16)}`, true],
              id: 1,
            }),
          });
          const data = await response.json();
          const block = data.result;

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
        this.lastCoreEpoch = currentCoreEpoch;
      }

      // Check for new eSpace blocks
      if (currentEvmBlock > this.lastEvmBlock) {
        for (let blockNum = this.lastEvmBlock + 1; blockNum <= currentEvmBlock; blockNum++) {
          const response = await fetch(evmRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBlockByNumber',
              params: [`0x${blockNum.toString(16)}`, true],
              id: 1,
            }),
          });
          const data = await response.json();
          const block = data.result;

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
        this.lastEvmBlock = currentEvmBlock;
      }

      // Broadcast new blocks if any
      if (blocksWithTxs.length > 0) {
        this.broadcast({
          type: 'newBlocks',
          data: {
            blocks: blocksWithTxs,
            currentCoreEpoch,
            currentEvmBlock,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Silently fail - node might not be running yet
    }
  }

  close() {
    this.stopNodeStatsUpdates();
    this.stopBlockMonitoring();
    this.wss.close();
  }
}
