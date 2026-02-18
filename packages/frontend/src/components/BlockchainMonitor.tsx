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

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Pagination,
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
  IconCode,
  IconCopy,
  IconFileText,
  IconFilter,
  IconPlayerPause,
  IconPlayerPlay,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/services/api';
import { wsClient } from '@/services/websocket';
import { useDevNodeStore } from '@/stores/devnodeStore';
import {
  addContractToCache,
  clearAbiCache,
  decodeTransactionInput,
  type DecodedTransaction,
} from '@/utils/tx-decoder';

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
  // Enhanced transaction details
  gas?: string;
  gasPrice?: string;
  input?: string;
  isContractCreation?: boolean;
  contractAddress?: string;
  // Decoded transaction data (if ABI available)
  decodedData?: DecodedTransaction | null;
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

// Pagination settings
const BLOCKS_PER_PAGE = 20;

export function BlockchainMonitor() {
  const { status } = useDevNodeStore();
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Search state (scaffold-eth pattern: search by hash or address)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    type: 'transaction' | 'address' | 'none';
    transactions: TransactionInfo[];
    blocks: BlockInfo[];
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

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

  // ABI cache state
  const [contractsLoaded, setContractsLoaded] = useState(0);

  // Network awareness
  const isLocalNetwork = status?.network === 'local';
  // canMonitor capability indicates if monitoring is available at all

  const isNodeRunning = status?.isRunning ?? false;

  // Load deployed contracts into ABI cache for transaction decoding
  const loadContractsForDecoding = useCallback(async () => {
    try {
      const { contracts } = await apiClient.getDeployedContracts();
      clearAbiCache();

      let loaded = 0;
      for (const contract of contracts) {
        if (contract.abi && Array.isArray(contract.abi)) {
          addContractToCache({
            address: contract.address,
            name: contract.name,
            abi: contract.abi as any,
          });
          loaded++;
        }
      }

      setContractsLoaded(loaded);
      console.log(`[Monitor] Loaded ${loaded} contract ABIs for decoding`);
    } catch (error) {
      console.warn('[Monitor] Failed to load contracts for decoding:', error);
    }
  }, []);

  // Load contracts on mount and when new contracts are deployed
  useEffect(() => {
    loadContractsForDecoding();

    // Subscribe to contract deployments to refresh ABI cache
    const unsubDeploy = wsClient.on('contractDeployed', () => {
      loadContractsForDecoding();
    });

    return () => {
      unsubDeploy();
    };
  }, [loadContractsForDecoding]);

  useEffect(() => {
    if (!isNodeRunning) return;

    // Subscribe to new blocks from WebSocket
    const unsubBlocks = wsClient.on('newBlocks', (data: any) => {
      if (isPaused) return;

      const { blocks, currentCoreEpoch, currentEvmBlock } = data;

      // Always update block numbers (even if no blocks with transactions)
      setStats((prev) => {
        const updates: any = {
          ...prev,
          coreBlockNumber: String(currentCoreEpoch || prev.coreBlockNumber),
          evmBlockNumber: String(currentEvmBlock || prev.evmBlockNumber),
        };

        // Add transaction counts if we have blocks
        if (blocks && blocks.length > 0) {
          const totalTxs = blocks.reduce(
            (sum: number, b: any) => sum + (b.transactionCount || 0),
            0
          );
          updates.totalBlocks = prev.totalBlocks + blocks.length;
          updates.totalTransactions = prev.totalTransactions + totalTxs;
        }

        return updates;
      });

      // Add new blocks to the list (only if we have blocks with transactions)
      if (blocks && blocks.length > 0) {
        console.log(`[Monitor] Received ${blocks.length} new blocks from WebSocket`);

        // Decode transactions using cached ABIs
        const decodedBlocks = blocks.map((block: BlockInfo) => ({
          ...block,
          transactions: block.transactions.map((tx: TransactionInfo) => ({
            ...tx,
            decodedData: tx.input ? decodeTransactionInput(tx.input, tx.to) : null,
          })),
        }));

        setBlocks((prev) => {
          const newBlocks = [...decodedBlocks, ...prev];
          return newBlocks.slice(0, 1000); // Keep last 1000 blocks
        });
      }
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
    setExpandedBlocks((prev) => {
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

  // Search function (scaffold-eth pattern)
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    const query = searchQuery.trim().toLowerCase();

    // Check if it's a transaction hash (0x + 64 hex chars)
    const isTxHash = /^0x[a-f0-9]{64}$/i.test(query);

    // Check if it's an address (0x + 40 hex chars)
    const isAddress = /^0x[a-f0-9]{40}$/i.test(query);

    if (isTxHash) {
      // Search for transaction by hash
      const matchingTxs: TransactionInfo[] = [];
      const matchingBlocks: BlockInfo[] = [];

      for (const block of blocks) {
        for (const tx of block.transactions) {
          if (tx.hash.toLowerCase() === query) {
            matchingTxs.push(tx);
            if (!matchingBlocks.find((b) => b.blockNumber === block.blockNumber)) {
              matchingBlocks.push(block);
            }
          }
        }
      }

      setSearchResult({
        type: 'transaction',
        transactions: matchingTxs,
        blocks: matchingBlocks,
      });
    } else if (isAddress) {
      // Search for transactions involving this address
      const matchingTxs: TransactionInfo[] = [];
      const matchingBlocks: BlockInfo[] = [];

      for (const block of blocks) {
        for (const tx of block.transactions) {
          if (
            tx.from?.toLowerCase() === query ||
            tx.to?.toLowerCase() === query ||
            tx.contractAddress?.toLowerCase() === query
          ) {
            matchingTxs.push(tx);
            if (!matchingBlocks.find((b) => b.blockNumber === block.blockNumber)) {
              matchingBlocks.push(block);
            }
          }
        }
      }

      setSearchResult({
        type: 'address',
        transactions: matchingTxs,
        blocks: matchingBlocks,
      });
    } else {
      setSearchResult({ type: 'none', transactions: [], blocks: [] });
    }
  }, [searchQuery, blocks]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
  };

  // Paginated blocks (scaffold-eth pattern)
  const paginatedBlocks = useMemo(() => {
    const displayBlocks = searchResult ? searchResult.blocks : blocks;
    const startIndex = (currentPage - 1) * BLOCKS_PER_PAGE;
    return displayBlocks.slice(startIndex, startIndex + BLOCKS_PER_PAGE);
  }, [blocks, searchResult, currentPage]);

  const totalPages = useMemo(() => {
    const displayBlocks = searchResult ? searchResult.blocks : blocks;
    return Math.max(1, Math.ceil(displayBlocks.length / BLOCKS_PER_PAGE));
  }, [blocks, searchResult]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchResult]);

  // Format time mined (scaffold-eth pattern)
  const formatTimeMined = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

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
            You are connected to <strong>{status?.network || 'remote'}</strong> network. For
            performance reasons, please specify an address or contract to filter transactions.
          </Text>
        </Alert>
      )}

      {/* Search Bar (scaffold-eth pattern) */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group gap="xs">
            <IconSearch size={20} />
            <Text fw={500}>Search Transactions</Text>
            {searchResult && (
              <Badge
                color={searchResult.transactions.length > 0 ? 'green' : 'orange'}
                variant="light"
                size="sm"
              >
                {searchResult.transactions.length} found
              </Badge>
            )}
          </Group>
          <Group>
            <TextInput
              placeholder="Search by transaction hash or address (0x...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              leftSection={<IconSearch size={16} />}
              size="sm"
              style={{ flex: 1 }}
            />
            <Button size="sm" onClick={handleSearch} disabled={!searchQuery.trim()}>
              Search
            </Button>
            {searchResult && (
              <Button size="sm" variant="light" onClick={clearSearch} leftSection={<IconX size={14} />}>
                Clear
              </Button>
            )}
          </Group>
          {searchResult?.type === 'none' && (
            <Text size="xs" c="orange">
              No results found. Enter a valid transaction hash (0x + 64 chars) or address (0x + 40
              chars).
            </Text>
          )}
        </Stack>
      </Card>

      {/* Advanced Filter Controls */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group gap="xs">
            <IconFilter size={20} />
            <Text fw={500}>Advanced Filters</Text>
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
            <Button size="xs" variant="light" onClick={clearFilters} disabled={!isFilterActive}>
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
              {contractsLoaded > 0 && (
                <Tooltip label={`${contractsLoaded} contract ABI(s) loaded for decoding`}>
                  <Badge size="sm" color="cyan" variant="light" leftSection={<IconCode size={10} />}>
                    {contractsLoaded} ABIs
                  </Badge>
                </Tooltip>
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

        {/* Pagination Controls (scaffold-eth pattern) */}
        {blocks.length > BLOCKS_PER_PAGE && (
          <Card.Section inheritPadding py="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Showing {(currentPage - 1) * BLOCKS_PER_PAGE + 1}-
                {Math.min(
                  currentPage * BLOCKS_PER_PAGE,
                  searchResult ? searchResult.blocks.length : blocks.length
                )}{' '}
                of {searchResult ? searchResult.blocks.length : blocks.length} blocks
              </Text>
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                size="sm"
                siblings={1}
              />
            </Group>
          </Card.Section>
        )}

        {paginatedBlocks.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text size="sm" c="dimmed">
              {searchResult
                ? 'No matching blocks found for your search.'
                : isNodeRunning
                  ? 'Waiting for blocks with transactions... Use the faucet or send transactions to see activity.'
                  : 'Start the node and send transactions to see blocks here.'}
            </Text>
            {!searchResult && (
              <Text size="xs" c="dimmed">
                Note: Only blocks containing transactions are displayed
              </Text>
            )}
          </Stack>
        ) : (
          <div
            style={{
              maxHeight: '600px',
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '0 8px 0 0',
            }}
          >
            {paginatedBlocks.map((block, idx) => (
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
                    <Tooltip label={formatTimeMined(block.timestamp)}>
                      <Text size="xs" c="dimmed">
                        {formatRelativeTime(block.timestamp)}
                      </Text>
                    </Tooltip>
                  </Group>

                  {/* Transactions List - Show last 3 by default */}
                  {block.transactions.length > 0 && (
                    <Stack
                      gap="xs"
                      style={{
                        paddingLeft: '12px',
                        borderLeft: '2px solid var(--mantine-color-gray-3)',
                      }}
                    >
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
                                leftSection={
                                  <Text size="xs">+{block.transactions.length - 3} more</Text>
                                }
                              >
                                Show all {block.transactions.length} transactions
                              </Button>
                            )}

                            <Stack
                              gap="xs"
                              style={{
                                maxHeight: isExpanded ? '300px' : 'none',
                                overflowY: isExpanded ? 'auto' : 'visible',
                                overflowX: 'hidden',
                              }}
                            >
                              {txsToShow.map((tx, txIdx) => (
                                <Card
                                  key={`${tx.hash}-${txIdx}`}
                                  withBorder
                                  padding="xs"
                                  radius="xs"
                                  bg="gray.0"
                                  style={{
                                    borderLeftWidth: '3px',
                                    borderLeftColor:
                                      block.chainType === 'core'
                                        ? 'var(--mantine-color-blue-5)'
                                        : 'var(--mantine-color-green-5)',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Group justify="space-between" wrap="nowrap">
                                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                                      <Text
                                        ff="monospace"
                                        size="xs"
                                        fw={500}
                                        style={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
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
                                              {copied ? (
                                                <IconCheck style={{ width: 10 }} />
                                              ) : (
                                                <IconCopy style={{ width: 10 }} />
                                              )}
                                            </ActionIcon>
                                          </Tooltip>
                                        )}
                                      </CopyButton>
                                    </Group>
                                    <Text size="xs" fw={600} c="blue" style={{ flexShrink: 0 }}>
                                      {tx.value}
                                    </Text>
                                  </Group>
                                  <Group
                                    gap="xs"
                                    mt={4}
                                    wrap="nowrap"
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                      From:
                                    </Text>
                                    <Tooltip label={tx.from}>
                                      <Text
                                        ff="monospace"
                                        size="xs"
                                        style={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {formatAddress(tx.from)}
                                      </Text>
                                    </Tooltip>
                                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                      →
                                    </Text>
                                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                      {tx.isContractCreation || !tx.to ? 'Creates:' : 'To:'}
                                    </Text>
                                    {tx.contractAddress ? (
                                      <Group gap={4} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                                        <Badge size="xs" color="purple" variant="light">
                                          Contract
                                        </Badge>
                                        <Tooltip label={tx.contractAddress}>
                                          <Text
                                            ff="monospace"
                                            size="xs"
                                            style={{
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {formatAddress(tx.contractAddress)}
                                          </Text>
                                        </Tooltip>
                                        <CopyButton value={tx.contractAddress} timeout={2000}>
                                          {({ copied }) => (
                                            <Tooltip
                                              label={copied ? 'Copied!' : 'Copy contract address'}
                                            >
                                              <ActionIcon
                                                color={copied ? 'teal' : 'gray'}
                                                variant="subtle"
                                                size="xs"
                                              >
                                                {copied ? (
                                                  <IconCheck style={{ width: 10 }} />
                                                ) : (
                                                  <IconCopy style={{ width: 10 }} />
                                                )}
                                              </ActionIcon>
                                            </Tooltip>
                                          )}
                                        </CopyButton>
                                      </Group>
                                    ) : tx.to ? (
                                      <Tooltip label={tx.to}>
                                        <Text
                                          ff="monospace"
                                          size="xs"
                                          style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {formatAddress(tx.to)}
                                        </Text>
                                      </Tooltip>
                                    ) : (
                                      <Badge size="xs" color="orange" variant="light">
                                        Pending...
                                      </Badge>
                                    )}
                                  </Group>
                                  {/* Show decoded function call if available */}
                                  {tx.decodedData && tx.decodedData.functionName && (
                                    <Card
                                      p="xs"
                                      mt={4}
                                      withBorder
                                      bg="var(--mantine-color-dark-7)"
                                      radius="sm"
                                    >
                                      <Group gap="xs" wrap="nowrap">
                                        <ThemeIcon
                                          size="xs"
                                          color="cyan"
                                          variant="light"
                                          radius="sm"
                                        >
                                          <IconCode size={10} />
                                        </ThemeIcon>
                                        <Badge size="xs" color="cyan" variant="light">
                                          {tx.decodedData.functionName}
                                        </Badge>
                                      </Group>
                                      {tx.decodedData.parameters &&
                                        tx.decodedData.parameters.length > 0 && (
                                          <Stack gap={2} mt={4}>
                                            {tx.decodedData.parameters.map((param, i) => (
                                              <Group
                                                key={i}
                                                gap="xs"
                                                wrap="nowrap"
                                                style={{ overflow: 'hidden' }}
                                              >
                                                <Text
                                                  size="xs"
                                                  c="dimmed"
                                                  style={{ flexShrink: 0 }}
                                                >
                                                  {param.name}:
                                                </Text>
                                                <Tooltip label={String(param.value)}>
                                                  <Text
                                                    size="xs"
                                                    ff="monospace"
                                                    c="cyan"
                                                    style={{
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap',
                                                    }}
                                                  >
                                                    {param.displayValue}
                                                  </Text>
                                                </Tooltip>
                                              </Group>
                                            ))}
                                          </Stack>
                                        )}
                                    </Card>
                                  )}
                                  {/* Show gas info if available */}
                                  {tx.gas && (
                                    <Group gap="xs" mt={2}>
                                      <Text size="xs" c="dimmed">
                                        Gas: {tx.gas}
                                      </Text>
                                      {tx.gasPrice && (
                                        <Text size="xs" c="dimmed">
                                          @ {tx.gasPrice}
                                        </Text>
                                      )}
                                    </Group>
                                  )}
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
