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

import { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Table,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  ThemeIcon,
  CopyButton,
} from '@mantine/core';
import {
  IconTrash,
  IconCopy,
  IconCheck,
  IconFileText,
  IconCoin,
  IconActivity,
  IconBooks,
} from '@tabler/icons-react';
import { wsClient } from '@/services/websocket';
import { useDevNodeStore } from '@/stores/devnodeStore';

interface BlockInfo {
  blockNumber: string;
  timestamp: number;
  chainType: 'core' | 'evm';
}

interface TransactionInfo {
  hash: string;
  from: string;
  to?: string;
  value: string;
  blockNumber: string;
  timestamp: number;
  chainType?: string;
}

interface MonitorStats {
  coreBlockNumber: string;
  evmBlockNumber: string;
  coreBlocksPerSecond: number;
  evmBlocksPerSecond: number;
}

export function BlockchainMonitor() {
  const { status } = useDevNodeStore();
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [stats, setStats] = useState<MonitorStats>({
    coreBlockNumber: '0',
    evmBlockNumber: '0',
    coreBlocksPerSecond: 0,
    evmBlocksPerSecond: 0,
  });

  const [prevCoreBlock, setPrevCoreBlock] = useState<string>('0');
  const [prevEvmBlock, setPrevEvmBlock] = useState<string>('0');
  const [prevTimestamp, setPrevTimestamp] = useState<number>(Date.now());

  const isNodeRunning = status?.isRunning ?? false;

  useEffect(() => {
    // Subscribe to block events
    const unsubBlock = wsClient.on('devnode:block', (data: any) => {
      const blockInfo: BlockInfo = {
        blockNumber: data.blockNumber || data.evmBlockNumber || '0',
        timestamp: Date.now(),
        chainType: data.chainType || 'evm',
      };

      setBlocks((prev) => {
        const updated = [blockInfo, ...prev].slice(0, 50); // Keep last 50 blocks
        return updated;
      });

      // Update stats based on block data
      if (data.chainType === 'core') {
        setStats((prev) => ({ ...prev, coreBlockNumber: data.blockNumber || prev.coreBlockNumber }));
      } else {
        setStats((prev) => ({ ...prev, evmBlockNumber: data.blockNumber || prev.evmBlockNumber }));
      }
    });

    // Subscribe to transaction events
    const unsubTx = wsClient.on('devnode:transaction', (data: any) => {
      const txInfo: TransactionInfo = {
        hash: data.hash || '',
        from: data.from || '',
        to: data.to,
        value: data.value || '0',
        blockNumber: data.blockNumber || '0',
        timestamp: Date.now(),
        chainType: data.chainType,
      };

      setTransactions((prev) => {
        const updated = [txInfo, ...prev].slice(0, 50); // Keep last 50 transactions
        return updated;
      });
    });

    // Subscribe to node stats for block numbers
    const unsubStats = wsClient.on('nodeStats', (data: any) => {
      const now = Date.now();
      const timeDiff = (now - prevTimestamp) / 1000; // in seconds

      // Calculate blocks per second
      const coreBlockNum = data.coreBlockNumber || '0';
      const evmBlockNum = data.evmBlockNumber || '0';

      let coreBlocksPerSec = 0;
      let evmBlocksPerSec = 0;

      if (timeDiff > 0) {
        const coreBlockDiff = parseInt(coreBlockNum) - parseInt(prevCoreBlock);
        const evmBlockDiff = parseInt(evmBlockNum) - parseInt(prevEvmBlock);

        coreBlocksPerSec = Math.max(0, coreBlockDiff / timeDiff);
        evmBlocksPerSec = Math.max(0, evmBlockDiff / timeDiff);
      }

      setStats({
        coreBlockNumber: coreBlockNum,
        evmBlockNumber: evmBlockNum,
        coreBlocksPerSecond: Math.round(coreBlocksPerSec * 100) / 100,
        evmBlocksPerSecond: Math.round(evmBlocksPerSec * 100) / 100,
      });

      setPrevCoreBlock(coreBlockNum);
      setPrevEvmBlock(evmBlockNum);
      setPrevTimestamp(now);
    });

    return () => {
      unsubBlock();
      unsubTx();
      unsubStats();
    };
  }, [prevCoreBlock, prevEvmBlock, prevTimestamp]);

  const clearHistory = () => {
    setBlocks([]);
    setTransactions([]);
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'Unknown';
    return hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-8)}` : address;
  };

  return (
    <Stack gap="md">
      {!isNodeRunning && (
        <Card withBorder padding="md" bg="yellow.0" radius="md">
          <Group>
            <IconActivity size={20} />
            <Text size="sm" c="orange">
              Node is not running. Start the node to see real-time blockchain monitoring.
            </Text>
          </Group>
        </Card>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Card withBorder padding="md" radius="md">
          <Stack gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconBooks size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500}>
              Core Block Height
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
              eSpace Block Height
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
              Total Blocks
            </Text>
            <Text size="xl" fw={700}>
              {blocks.length}
            </Text>
            <Text size="xs" c="dimmed">
              In monitor
            </Text>
          </Stack>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Stack gap="xs" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
              <IconActivity size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500}>
              Total Transactions
            </Text>
            <Text size="xl" fw={700}>
              {transactions.length}
            </Text>
            <Text size="xs" c="dimmed">
              In monitor
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
            </Group>
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
        </Card.Section>

        {blocks.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text size="sm" c="dimmed">
              No blocks mined yet. Start mining to see blocks appear here.
            </Text>
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Block #</Table.Th>
                <Table.Th>Chain</Table.Th>
                <Table.Th>Time</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {blocks.map((block, idx) => (
                <Table.Tr key={`${block.blockNumber}-${idx}`}>
                  <Table.Td>
                    <Text fw={500} ff="monospace">
                      {block.blockNumber}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={block.chainType === 'core' ? 'blue' : 'green'}
                      variant="light"
                    >
                      {block.chainType.toUpperCase()}
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
            </Group>
            <Tooltip label="Clear history">
              <ActionIcon
                variant="light"
                size="sm"
                onClick={clearHistory}
                disabled={transactions.length === 0}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Card.Section>

        {transactions.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text size="sm" c="dimmed">
              No transactions captured yet. Use the faucet or send transactions to see them here.
            </Text>
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Hash</Table.Th>
                <Table.Th>From</Table.Th>
                <Table.Th>To</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Block</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transactions.map((tx, idx) => (
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
                  <Table.Td>
                    <Text ff="monospace" size="sm">
                      {tx.blockNumber}
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
