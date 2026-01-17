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
    Table,
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
import { useCallback, useEffect, useRef, useState } from 'react';

interface BlockInfo {
  blockNumber: string;
  timestamp: number;
  chainType: 'core' | 'evm';
  transactionCount: number;
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
}

// Use backend RPC proxy to avoid CORS issues
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper to get auth headers for fetch calls
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    headers.Authorization = `Bearer ${sessionId}`;
  }
  return headers;
}

// Fetch block by number from eSpace (EVM) via backend proxy
async function fetchEvmBlock(blockNumber: number): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/devkit/rpc/evm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [`0x${blockNumber.toString(16)}`, true], // true = include transactions
        id: 1,
      }),
    });
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.warn('Failed to fetch EVM block:', error);
    return null;
  }
}

// Fetch block by epoch from Core space via backend proxy
async function fetchCoreBlock(epochNumber: number): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/devkit/rpc/core`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'cfx_getBlockByEpochNumber',
        params: [`0x${epochNumber.toString(16)}`, true], // true = include transactions
        id: 1,
      }),
    });
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.warn('Failed to fetch Core block:', error);
    return null;
  }
}

export function BlockchainMonitor() {
  const { status } = useDevNodeStore();
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  
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
  });

  // Track previous block numbers to detect new blocks
  const prevCoreBlockRef = useRef<number>(0);
  const prevEvmBlockRef = useRef<number>(0);
  const prevTimestampRef = useRef<number>(Date.now());
  const isProcessingRef = useRef<boolean>(false);

  // Network awareness
  const isLocalNetwork = status?.network === 'local';
  // canMonitor capability indicates if monitoring is available at all

  const isNodeRunning = status?.isRunning ?? false;

  // Process new blocks detected from nodeStats
  const processNewBlocks = useCallback(async (
    newCoreBlock: number,
    newEvmBlock: number
  ) => {
    if (isPaused || isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const newBlocks: BlockInfo[] = [];
      const newTxs: TransactionInfo[] = [];

      // Check for new eSpace blocks
      if (newEvmBlock > prevEvmBlockRef.current && prevEvmBlockRef.current > 0) {
        // Fetch new blocks (limit to last 5 to avoid flooding)
        const startBlock = Math.max(prevEvmBlockRef.current + 1, newEvmBlock - 4);
        for (let i = startBlock; i <= newEvmBlock; i++) {
          const block = await fetchEvmBlock(i);
          if (block) {
            const txCount = block.transactions?.length || 0;
            newBlocks.push({
              blockNumber: String(i),
              timestamp: Date.now(),
              chainType: 'evm',
              transactionCount: txCount,
            });

            // Extract transactions from the block
            if (block.transactions && Array.isArray(block.transactions)) {
              for (const tx of block.transactions) {
                if (typeof tx === 'object') {
                  newTxs.push({
                    hash: tx.hash || '',
                    from: tx.from || '',
                    to: tx.to || undefined,
                    value: tx.value ? (parseInt(tx.value, 16) / 1e18).toFixed(4) + ' CFX' : '0 CFX',
                    blockNumber: String(i),
                    timestamp: Date.now(),
                    chainType: 'evm',
                  });
                }
              }
            }
          }
        }
      }

      // Check for new Core blocks
      if (newCoreBlock > prevCoreBlockRef.current && prevCoreBlockRef.current > 0) {
        // Fetch new blocks (limit to last 5 to avoid flooding)
        const startBlock = Math.max(prevCoreBlockRef.current + 1, newCoreBlock - 4);
        for (let i = startBlock; i <= newCoreBlock; i++) {
          const block = await fetchCoreBlock(i);
          if (block) {
            const txCount = block.transactions?.length || 0;
            newBlocks.push({
              blockNumber: String(i),
              timestamp: Date.now(),
              chainType: 'core',
              transactionCount: txCount,
            });

            // Extract transactions from the block
            if (block.transactions && Array.isArray(block.transactions)) {
              for (const tx of block.transactions) {
                if (typeof tx === 'object') {
                  newTxs.push({
                    hash: tx.hash || '',
                    from: tx.from || '',
                    to: tx.to || undefined,
                    value: tx.value ? (parseInt(tx.value, 16) / 1e18).toFixed(4) + ' CFX' : '0 CFX',
                    blockNumber: String(i),
                    timestamp: Date.now(),
                    chainType: 'core',
                  });
                }
              }
            }
          }
        }
      }

      // Update state with new blocks and transactions
      if (newBlocks.length > 0) {
        setBlocks((prev) => [...newBlocks.reverse(), ...prev].slice(0, 100));
        setStats((prev) => ({
          ...prev,
          totalBlocks: prev.totalBlocks + newBlocks.length,
        }));
      }

      if (newTxs.length > 0) {
        setTransactions((prev) => [...newTxs.reverse(), ...prev].slice(0, 100));
        setStats((prev) => ({
          ...prev,
          totalTransactions: prev.totalTransactions + newTxs.length,
        }));
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [isPaused]);

  useEffect(() => {
    if (!isNodeRunning) return;

    // Subscribe to node stats for block numbers
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

      // Update stats
      setStats((prev) => ({
        ...prev,
        coreBlockNumber: String(coreBlockNum),
        evmBlockNumber: String(evmBlockNum),
        coreBlocksPerSecond: Math.round(coreBlocksPerSec * 100) / 100,
        evmBlocksPerSecond: Math.round(evmBlocksPerSec * 100) / 100,
      }));

      // Process new blocks if there are any
      if (coreBlockNum > prevCoreBlockRef.current || evmBlockNum > prevEvmBlockRef.current) {
        processNewBlocks(coreBlockNum, evmBlockNum);
      }

      // Update previous values
      prevCoreBlockRef.current = coreBlockNum;
      prevEvmBlockRef.current = evmBlockNum;
      prevTimestampRef.current = now;
    });

    return () => {
      unsubStats();
    };
  }, [isNodeRunning, processNewBlocks]);

  const clearHistory = () => {
    setBlocks([]);
    setTransactions([]);
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

  // Filter transactions based on address or contract
  const filteredTransactions = isFilterActive
    ? transactions.filter((tx) => {
        const normalizedFilter = addressFilter.toLowerCase();
        const normalizedContract = contractFilter.toLowerCase();
        const matchesAddress =
          !normalizedFilter ||
          tx.from.toLowerCase().includes(normalizedFilter) ||
          (tx.to && tx.to.toLowerCase().includes(normalizedFilter));
        const matchesContract =
          !normalizedContract ||
          (tx.to && tx.to.toLowerCase() === normalizedContract);
        return matchesAddress && matchesContract;
      })
    : transactions;

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
              {isFilterActive ? `${filteredTransactions.length} filtered` : `${transactions.length} in view`}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Blocks Section */}
      <Card withBorder padding="lg" radius="md">
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconBooks size={20} />
              <Text fw={600}>Recent Blocks</Text>
              <Badge size="sm" color={isPaused ? 'orange' : 'green'} variant="light">
                {isPaused ? 'Paused' : 'Live'}
              </Badge>
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
                ? 'Waiting for new blocks... Mine blocks or use the faucet to see activity.'
                : 'Start the node and mine blocks to see them here.'}
            </Text>
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Block #</Table.Th>
                <Table.Th>Chain</Table.Th>
                <Table.Th>Txs</Table.Th>
                <Table.Th>Time</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {blocks.slice(0, 20).map((block, idx) => (
                <Table.Tr key={`${block.chainType}-${block.blockNumber}-${idx}`}>
                  <Table.Td>
                    <Text fw={500} ff="monospace" size="sm">
                      {block.blockNumber}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={block.chainType === 'core' ? 'blue' : 'green'}
                      variant="light"
                    >
                      {block.chainType === 'core' ? 'Core' : 'eSpace'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={block.transactionCount > 0 ? 'cyan' : 'gray'} variant="light">
                      {block.transactionCount}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Transactions Section */}
      <Card withBorder padding="lg" radius="md">
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconFileText size={20} />
              <Text fw={600}>Recent Transactions</Text>
              {isFilterActive && (
                <Badge size="sm" color="blue" variant="light">
                  Filtered: {filteredTransactions.length} / {transactions.length}
                </Badge>
              )}
            </Group>
          </Group>
        </Card.Section>

        {filteredTransactions.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text size="sm" c="dimmed">
              {isFilterActive
                ? 'No transactions match the current filters.'
                : isLocalNetwork
                  ? isNodeRunning
                    ? 'No transactions yet. Use the faucet to send test tokens.'
                    : 'Start the node and send transactions to see them here.'
                  : 'Apply filters to view transactions on remote network.'}
            </Text>
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Hash</Table.Th>
                <Table.Th>Chain</Table.Th>
                <Table.Th>From</Table.Th>
                <Table.Th>To</Table.Th>
                <Table.Th>Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTransactions.slice(0, 20).map((tx, idx) => (
                <Table.Tr key={`${tx.hash}-${idx}`}>
                  <Table.Td>
                    <Group gap="xs">
                      <Text fw={500} ff="monospace" size="sm">
                        {formatHash(tx.hash)}
                      </Text>
                      <CopyButton value={tx.hash} timeout={2000}>
                        {({ copied }) => (
                          <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                            <ActionIcon
                              color={copied ? 'teal' : 'gray'}
                              variant="subtle"
                              size="xs"
                            >
                              {copied ? (
                                <IconCheck style={{ width: 12 }} />
                              ) : (
                                <IconCopy style={{ width: 12 }} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={tx.chainType === 'core' ? 'blue' : 'green'}
                      variant="light"
                    >
                      {tx.chainType === 'core' ? 'Core' : 'eSpace'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={tx.from} multiline maw={200}>
                      <Text ff="monospace" size="sm">
                        {formatAddress(tx.from)}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={tx.to || 'Contract Creation'} multiline maw={200}>
                      <Text ff="monospace" size="sm">
                        {tx.to ? formatAddress(tx.to) : 'Contract'}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {tx.value}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
