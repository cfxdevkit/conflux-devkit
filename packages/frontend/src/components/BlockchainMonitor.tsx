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

import { wsClient } from '@/services/websocket';
import { useDevNodeStore } from '@/stores/devnodeStore';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    CopyButton,
    Group,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Tooltip,
} from '@mantine/core';
import {
    IconActivity,
    IconAlertCircle,
    IconBooks,
    IconCheck,
    IconCoin,
    IconCopy,
    IconFileText,
    IconFilter,
    IconPlayerPause,
    IconPlayerPlay,
    IconTrash,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

interface BlockInfo {
  blockNumber: string;
  timestamp: number;
  chainType: 'core' | 'evm';
  transactionCount: number;
  transactions: TransactionInfo[]; // Nested transactions
}

interface TransactionInfo {
  hash: string;
  from: string;
  to?: string;
  value: string;
  blockNumber: string;
  timestamp: number;
  chainType: 'core' | 'evm';
}

interface MonitorStats {
  coreBlockNumber: string;
  evmBlockNumber: string;
  coreBlocksPerSecond: number;
  evmBlocksPerSecond: number;
  totalBlocks: number;
  totalTransactions: number;
  miningInterval?: number; // Current mining interval from node
}

export function BlockchainMonitor() {
  const { status } = useDevNodeStore();
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  
  // Address filter state (for non-local networks)
  const [addressFilter, setAddressFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [stats, setStats] = useState<MonitorStats>({
    coreBlockNumber: '0',
    evmBlockNumber: '0',
    coreBlocksPerSecond: 0,
    evmBlocksPerSecond: 0,
    totalBlocks: 0,
    totalTransactions: 0,
    miningInterval: 500, // Default, will be updated from nodeStats
  });

  // Track previous block numbers for blocks-per-second calculation
  const prevCoreBlockRef = useRef<number>(0);
  const prevEvmBlockRef = useRef<number>(0);
  const prevTimestampRef = useRef<number>(Date.now());

  // Network awareness
  const isLocalNetwork = status?.network === 'local';
  // canMonitor capability indicates if monitoring is available at all

  const isNodeRunning = status?.isRunning ?? false;

  useEffect(() => {
    if (!isNodeRunning) return;

    // Subscribe to new blocks from WebSocket
    const unsubBlocks = wsClient.on('newBlocks', (data: any) => {
      if (isPaused) return;
      
      const { blocks, currentCoreEpoch, currentEvmBlock } = data;
      
      if (!blocks || blocks.length === 0) return;

      console.log(`[Monitor] Received ${blocks.length} new blocks from WebSocket`);

      // Update stats with current block numbers
      setStats((prev) => {
        // Count total transactions in new blocks
        const totalTxs = blocks.reduce((sum: number, b: any) => sum + (b.transactionCount || 0), 0);
        
        return {
          ...prev,
          coreBlockNumber: String(currentCoreEpoch || prev.coreBlockNumber),
          evmBlockNumber: String(currentEvmBlock || prev.evmBlockNumber),
          totalBlocks: prev.totalBlocks + blocks.length,
          totalTransactions: prev.totalTransactions + totalTxs,
        };
      });

      // Add new blocks to the list
      setBlocks((prev) => {
        const newBlocks = [...blocks, ...prev];
        return newBlocks.slice(0, 1000); // Keep last 1000 blocks
      });
    });

    // Subscribe to node stats for other metrics (gas price, mining status, etc)
    const unsubStats = wsClient.on('nodeStats', (data: any) => {
      const now = Date.now();
      const timeDiff = (now - prevTimestampRef.current) / 1000;

      const coreBlockNum = parseInt(data.coreBlockNumber || '0');
      const evmBlockNum = parseInt(data.evmBlockNumber || '0');

      // Calculate blocks per second
      let coreBlocksPerSec = 0;
      let evmBlocksPerSec = 0;

      if (timeDiff > 0 && prevCoreBlockRef.current > 0) {
        const coreBlockDiff = coreBlockNum - prevCoreBlockRef.current;
        const evmBlockDiff = evmBlockNum - prevEvmBlockRef.current;

        coreBlocksPerSec = Math.max(0, coreBlockDiff / timeDiff);
        evmBlocksPerSec = Math.max(0, evmBlockDiff / timeDiff);
      }

      // Update stats including mining interval
      const miningInterval = data.mining?.interval || data.miningInterval || 500;
      setStats((prev) => ({
        ...prev,
        coreBlocksPerSecond: Math.round(coreBlocksPerSec * 100) / 100,
        evmBlocksPerSecond: Math.round(evmBlocksPerSec * 100) / 100,
        miningInterval,
      }));

      // Update previous values
      prevCoreBlockRef.current = coreBlockNum;
      prevEvmBlockRef.current = evmBlockNum;
      prevTimestampRef.current = now;
    });

    return () => {
      unsubBlocks();
      unsubStats();
    };
  }, [isNodeRunning, isPaused]);

  const clearHistory = () => {
    setBlocks([]);
    setStats((prev) => ({
      ...prev,
      totalBlocks: 0,
      totalTransactions: 0,
    }));
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'Unknown';
    return hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address;
  };

  const toggleBlockExpanded = (blockKey: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockKey)) {
        newSet.delete(blockKey);
      } else {
        newSet.add(blockKey);
      }
      return newSet;
    });
  };

  // Apply address/contract filter to transactions
  const applyFilters = () => {
    if (addressFilter || contractFilter) {
      setIsFilterActive(true);
    }
  };

  const clearFilters = () => {
    setAddressFilter('');
    setContractFilter('');
    setIsFilterActive(false);
  };

  // For non-local networks, require filters
  const requiresFilter = !isLocalNetwork;

  return (
    <Stack gap="md">
      {/* Network Warning for non-local networks */}
      {!isLocalNetwork && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Remote Network Mode"
          color="yellow"
          variant="light"
        >
          <Text size="sm">
            You are connected to <strong>{status?.network || 'remote'}</strong> network.
            For performance reasons, please specify an address or contract to filter
            transactions.
          </Text>
        </Alert>
      )}

      {/* Filter Controls */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group gap="xs">
            <IconFilter size={20} />
            <Text fw={500}>Transaction Filters</Text>
            {isFilterActive && (
              <Badge color="green" variant="light" size="sm">
                Active
              </Badge>
            )}
          </Group>
          <Group grow>
            <TextInput
              placeholder="Filter by address (from/to)"
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              leftSection={<IconActivity size={16} />}
              size="sm"
            />
            <TextInput
              placeholder="Filter by contract address"
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              leftSection={<IconFileText size={16} />}
              size="sm"
            />
          </Group>
          <Group>
            <Button
              size="xs"
              onClick={applyFilters}
              disabled={!addressFilter && !contractFilter}
              color="blue"
            >
              Apply Filters
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={clearFilters}
              disabled={!isFilterActive}
            >
              Clear Filters
            </Button>
            {requiresFilter && !isFilterActive && (
              <Text size="xs" c="orange">
                Filters required for remote networks
              </Text>
            )}
          </Group>
        </Stack>
      </Card>

      {!isNodeRunning && isLocalNetwork && (
        <Card withBorder padding="md" bg="yellow.0" radius="md">
          <Group>
            <IconActivity size={20} />
            <Text size="sm" c="orange">
              Node is not running. Start the node to see real-time blockchain monitoring.
            </Text>
          </Group>
        </Card>
      )}

      {/* Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Card withBorder padding="md" radius="md">
          <Stack gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconBooks size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500}>
              Core Epoch
            </Text>
            <Text size="xl" fw={700}>
              {stats.coreBlockNumber}
            </Text>
            <Badge size="sm" color="blue" variant="light">
              {stats.coreBlocksPerSecond.toFixed(2)} blocks/s
            </Badge>
          </Stack>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Stack gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="green">
              <IconCoin size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500}>
              eSpace Block
            </Text>
            <Text size="xl" fw={700}>
              {stats.evmBlockNumber}
            </Text>
            <Badge size="sm" color="green" variant="light">
              {stats.evmBlocksPerSecond.toFixed(2)} blocks/s
            </Badge>
          </Stack>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Stack gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="purple">
              <IconFileText size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500}>
              Blocks Captured
            </Text>
            <Text size="xl" fw={700}>
              {stats.totalBlocks}
            </Text>
            <Text size="xs" c="dimmed">
              {blocks.length} in view
            </Text>
          </Stack>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Stack gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
              <IconActivity size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500}>
              Transactions
            </Text>
            <Text size="xl" fw={700}>
              {stats.totalTransactions}
            </Text>
            <Text size="xs" c="dimmed">
              {blocks.reduce((sum, b) => sum + b.transactionCount, 0)} in view
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Blocks with Nested Transactions - Fixed Height Scrollable */}
      <Card withBorder padding="lg" radius="md">
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconBooks size={20} />
              <Text fw={600}>Blocks with Transactions</Text>
              <Badge size="sm" color={isPaused ? 'orange' : 'green'} variant="light">
                {isPaused ? 'Paused' : 'Live'}
              </Badge>
              {stats.miningInterval && (
                <Badge size="sm" color="violet" variant="light">
                  {stats.miningInterval}ms interval
                </Badge>
              )}
            </Group>
            <Group gap="xs">
              <Tooltip label={isPaused ? 'Resume monitoring' : 'Pause monitoring'}>
                <ActionIcon
                  variant="light"
                  size="sm"
                  color={isPaused ? 'green' : 'orange'}
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Clear history">
                <ActionIcon
                  variant="light"
                  size="sm"
                  onClick={clearHistory}
                  disabled={blocks.length === 0}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Card.Section>

        {blocks.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text size="sm" c="dimmed">
              {isNodeRunning
                ? 'Waiting for blocks with transactions... Use the faucet or send transactions to see activity.'
                : 'Start the node and send transactions to see blocks here.'}
            </Text>
            <Text size="xs" c="dimmed">
              Note: Only blocks containing transactions are displayed
            </Text>
          </Stack>
        ) : (
          <div style={{ 
            maxHeight: '600px', 
            overflowY: 'auto', 
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '0 8px 0 0'
          }}>
            {blocks.map((block, idx) => (
              <Card 
                key={`${block.chainType}-${block.blockNumber}-${idx}`} 
                withBorder 
                padding="md" 
                radius="sm"
                style={{ flexShrink: 0 }}
              >
                <Stack gap="sm">
                  {/* Block Header */}
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Badge
                        size="lg"
                        color={block.chainType === 'core' ? 'blue' : 'green'}
                        variant="filled"
                      >
                        {block.chainType === 'core' ? 'Core' : 'eSpace'} #{block.blockNumber}
                      </Badge>
                      <Badge size="sm" color="cyan" variant="light">
                        {block.transactionCount} {block.transactionCount === 1 ? 'tx' : 'txs'}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </Text>
                  </Group>

                  {/* Transactions List - Show last 3 by default */}
                  {block.transactions.length > 0 && (
                    <Stack gap="xs" style={{ paddingLeft: '12px', borderLeft: '2px solid var(--mantine-color-gray-3)' }}>
                      {(() => {
                        const blockKey = `${block.chainType}-${block.blockNumber}`;
                        const isExpanded = expandedBlocks.has(blockKey);
                        const txsToShow = isExpanded 
                          ? block.transactions 
                          : block.transactions.slice(-3); // Show last 3 transactions
                        const hasMore = block.transactions.length > 3;

                        return (
                          <>
                            {!isExpanded && hasMore && (
                              <Button
                                variant="subtle"
                                size="xs"
                                color="gray"
                                onClick={() => toggleBlockExpanded(blockKey)}
                                leftSection={<Text size="xs">+{block.transactions.length - 3} more</Text>}
                              >
                                Show all {block.transactions.length} transactions
                              </Button>
                            )}
                            
                            <Stack gap="xs" style={{ maxHeight: isExpanded ? '300px' : 'none', overflowY: isExpanded ? 'auto' : 'visible', overflowX: 'hidden' }}>
                              {txsToShow.map((tx, txIdx) => (
                                <Card 
                                  key={`${tx.hash}-${txIdx}`} 
                                  withBorder 
                                  padding="xs" 
                                  radius="xs" 
                                  bg="gray.0" 
                                  style={{ 
                                    borderLeftWidth: '3px', 
                                    borderLeftColor: block.chainType === 'core' ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-green-5)',
                                    flexShrink: 0
                                  }}
                                >
                                  <Group justify="space-between" wrap="nowrap">
                                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                                      <Text ff="monospace" size="xs" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {formatHash(tx.hash)}
                                      </Text>
                                      <CopyButton value={tx.hash} timeout={2000}>
                                        {({ copied }) => (
                                          <Tooltip label={copied ? 'Copied' : 'Copy hash'}>
                                            <ActionIcon
                                              color={copied ? 'teal' : 'gray'}
                                              variant="subtle"
                                              size="xs"
                                            >
                                              {copied ? <IconCheck style={{ width: 10 }} /> : <IconCopy style={{ width: 10 }} />}
                                            </ActionIcon>
                                          </Tooltip>
                                        )}
                                      </CopyButton>
                                    </Group>
                                    <Text size="xs" fw={600} c="blue" style={{ flexShrink: 0 }}>
                                      {tx.value}
                                    </Text>
                                  </Group>
                                  <Group gap="xs" mt={4} wrap="nowrap" style={{ overflow: 'hidden' }}>
                                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                      From:
                                    </Text>
                                    <Tooltip label={tx.from}>
                                      <Text ff="monospace" size="xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {formatAddress(tx.from)}
                                      </Text>
                                    </Tooltip>
                                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                      →
                                    </Text>
                                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                      To:
                                    </Text>
                                    <Tooltip label={tx.to || 'Contract Creation'}>
                                      <Text ff="monospace" size="xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {tx.to ? formatAddress(tx.to) : 'Contract'}
                                      </Text>
                                    </Tooltip>
                                  </Group>
                                </Card>
                              ))}
                            </Stack>

                            {isExpanded && hasMore && (
                              <Button
                                variant="subtle"
                                size="xs"
                                color="gray"
                                onClick={() => toggleBlockExpanded(blockKey)}
                              >
                                Show less
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </Stack>
                  )}
                </Stack>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </Stack>
  );
}
