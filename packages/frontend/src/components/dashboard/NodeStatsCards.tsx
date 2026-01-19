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

import { Badge, Card, Code, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconCoin, IconNetwork } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { wsClient } from '@/services/websocket';
import { useDevNodeStore } from '@/stores/devnodeStore';

const formatGasPriceGDrip = (value?: string | number) => {
  if (value === undefined || value === null) return '—';
  try {
    const big = BigInt(value);
    const gdrip = Number(big) / 1e9;
    if (Number.isNaN(gdrip)) return `${big.toString()} drip`;

    const formatted =
      gdrip % 1 === 0 ? gdrip.toFixed(0) : gdrip.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

    return `${formatted} GDrip`;
  } catch {
    return String(value);
  }
};

export function NodeStatsCards() {
  const { status, nodeInfo } = useDevNodeStore();
  const [liveBlockNumbers, setLiveBlockNumbers] = useState<{
    coreBlock: number;
    evmBlock: number;
  }>({
    coreBlock: status?.coreSpace?.blockNumber || 0,
    evmBlock: status?.eSpace?.blockNumber || 0,
  });

  const isRunning = status?.isRunning ?? false;

  // Subscribe to real-time block number updates from WebSocket
  useEffect(() => {
    if (!isRunning) return;

    const unsubscribe = wsClient.on('newBlocks', (data: any) => {
      const { currentCoreEpoch, currentEvmBlock } = data;
      setLiveBlockNumbers({
        coreBlock: currentCoreEpoch || 0,
        evmBlock: currentEvmBlock || 0,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isRunning]);

  if (!isRunning) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Stack align="center" gap="sm" py="md">
          <IconNetwork size={32} stroke={1.5} color="gray" />
          <Text c="dimmed">Node is not running</Text>
          <Text size="xs" c="dimmed">
            Start the node to see chain statistics
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {/* Core Space Card */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <IconNetwork size={18} />
              <Text fw={600}>Core Space</Text>
            </Group>
            <Badge color="blue" variant="light" size="sm">
              Chain {status?.coreSpace.chainId}
            </Badge>
          </Group>

          {nodeInfo?.core?.clientVersion && (
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Client
              </Text>
              <Text size="xs">{nodeInfo.core.clientVersion}</Text>
            </Group>
          )}

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Block
            </Text>
            <Text size="sm" fw={600}>
              {liveBlockNumbers.coreBlock > 0 ? liveBlockNumbers.coreBlock.toLocaleString() : '—'}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Gas Price
            </Text>
            <Text size="sm">{formatGasPriceGDrip(status?.coreSpace.gasPrice)}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              RPC
            </Text>
            <Code style={{ fontSize: '0.75rem' }}>{status?.coreSpace.rpcUrl || 'http://localhost:12537'}</Code>
          </Group>
        </Stack>
      </Card>

      {/* eSpace Card */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <IconCoin size={18} />
              <Text fw={600}>eSpace</Text>
            </Group>
            <Badge color="purple" variant="light" size="sm">
              Chain {status?.eSpace.chainId}
            </Badge>
          </Group>

          {nodeInfo?.eSpace?.clientVersion && (
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Client
              </Text>
              <Text size="xs">{nodeInfo.eSpace.clientVersion}</Text>
            </Group>
          )}

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Block
            </Text>
            <Text size="sm" fw={600}>
              {liveBlockNumbers.evmBlock > 0 ? liveBlockNumbers.evmBlock.toLocaleString() : '—'}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Gas Price
            </Text>
            <Text size="sm">{formatGasPriceGDrip(status?.eSpace.gasPrice)}</Text>
          </Group>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              RPC
            </Text>
            <Code style={{ fontSize: '0.75rem' }}>{status?.eSpace.rpcUrl || 'http://localhost:8545'}</Code>
          </Group>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}
