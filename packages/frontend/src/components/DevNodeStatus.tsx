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

import { useDevNodeStore } from '@/stores/devnodeStore';
import { Badge, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconCoin, IconNetwork } from '@tabler/icons-react';
import { useEffect } from 'react';

const formatGasPriceGDrip = (value?: string | number) => {
  if (value === undefined || value === null) return '—';
  try {
    const big = BigInt(value);
    const gdrip = Number(big) / 1e9;
    if (Number.isNaN(gdrip)) return `${big.toString()} drip`;

    const formatted = gdrip % 1 === 0
      ? gdrip.toFixed(0)
      : gdrip.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

    return `${formatted} GDrip`;
  } catch (err) {
    return String(value);
  }
};

export function DevNodeStatus() {
  const { status, nodeInfo, fetchStatus } = useDevNodeStore();

  useEffect(() => {
    fetchStatus();
    // Poll less frequently since WebSocket provides real-time block updates
    const interval = setInterval(fetchStatus, 60000); // Every minute as fallback
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!status?.isRunning) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" gap="sm" py="xl">
          <IconNetwork size={48} stroke={1.5} color="gray" />
          <Text c="dimmed">Development node is not running</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconNetwork size={20} />
              <Text size="lg" fw={600}>
                Core Space
              </Text>
            </Group>
            <Badge color="blue" variant="light">
              Chain {status.coreSpace.chainId}
            </Badge>
          </Group>

          {nodeInfo?.core?.clientVersion && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Client Version
              </Text>
              <Text size="sm" fw={500}>{nodeInfo.core.clientVersion}</Text>
            </Group>
          )}

          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Block Number
              </Text>
              <Text size="sm" fw={500}>
                {status.coreSpace.blockNumber > 0 ? status.coreSpace.blockNumber.toLocaleString() : '—'}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Gas Price
              </Text>
              <Text size="sm" fw={500}>
                {formatGasPriceGDrip(status.coreSpace.gasPrice)}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                RPC URL
              </Text>
              <Text size="xs" c="blue" style={{ fontFamily: 'monospace' }}>
                {status.coreSpace.rpcUrl || 'http://localhost:12537'}
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconCoin size={20} />
              <Text size="lg" fw={600}>
                eSpace
              </Text>
            </Group>
            <Badge color="purple" variant="light">
              Chain {status.eSpace.chainId}
            </Badge>
          </Group>

          {nodeInfo?.eSpace?.clientVersion && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Client Version
              </Text>
              <Text size="sm" fw={500}>{nodeInfo.eSpace.clientVersion}</Text>
            </Group>
          )}

          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Block Number
              </Text>
              <Text size="sm" fw={500}>
                {status.eSpace.blockNumber > 0 ? status.eSpace.blockNumber.toLocaleString() : '—'}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Gas Price
              </Text>
              <Text size="sm" fw={500}>
                {formatGasPriceGDrip(status.eSpace.gasPrice)}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                RPC URL
              </Text>
              <Text size="xs" c="purple" style={{ fontFamily: 'monospace' }}>
                {status.eSpace.rpcUrl || 'http://localhost:8545'}
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}
