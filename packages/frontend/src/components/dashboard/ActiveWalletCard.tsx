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

import { Badge, Card, Code, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconFolder, IconKey, IconUsers, IconWallet } from '@tabler/icons-react';
import { useDevNodeStore } from '@/stores/devnodeStore';
import { useWalletStore } from '@/stores/walletStore';

export function ActiveWalletCard() {
  const { activeWallet, isLocked } = useWalletStore();
  const { status } = useDevNodeStore();

  // Get data directory from devnode status if available
  const dataDir = status?.wallet?.dataDir;
  const mnemonicHash = status?.wallet?.mnemonicHash;

  if (!activeWallet) {
    return (
      <Card withBorder padding="md" radius="md">
        <Stack align="center" gap="sm" py="md">
          <IconWallet size={32} stroke={1.5} color="gray" />
          <Text c="dimmed">No wallet configured</Text>
        </Stack>
      </Card>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'test':
        return 'Test Mnemonic';
      case 'generated':
        return 'Generated';
      case 'imported':
        return 'Imported';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'test':
        return 'orange';
      case 'generated':
        return 'blue';
      case 'imported':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <IconWallet size={20} />
            <Text fw={600}>Active Wallet</Text>
          </Group>
          <Group gap="xs">
            <Badge color={getTypeColor(activeWallet.type)} variant="light" size="sm">
              {getTypeLabel(activeWallet.type)}
            </Badge>
            {isLocked && (
              <Badge color="orange" variant="filled" size="sm">
                Locked
              </Badge>
            )}
          </Group>
        </Group>

        {/* Wallet Name */}
        <Group gap="xs">
          <IconKey size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text size="sm" c="dimmed">
            Name:
          </Text>
          <Text size="sm" fw={500}>
            {activeWallet.label}
          </Text>
        </Group>

        {/* Node Config */}
        {activeWallet.nodeConfig && (
          <>
            <Group gap="xs">
              <IconUsers size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
              <Text size="sm" c="dimmed">
                Accounts:
              </Text>
              <Text size="sm" fw={500}>
                {activeWallet.nodeConfig.accountsCount}
              </Text>
              <Text size="sm" c="dimmed" mx={4}>
                |
              </Text>
              <Text size="sm" c="dimmed">
                Chain IDs:
              </Text>
              <Code style={{ fontSize: '0.75rem' }}>
                {activeWallet.nodeConfig.chainId}/{activeWallet.nodeConfig.evmChainId}
              </Code>
            </Group>

            {activeWallet.nodeConfig.miningAuthor && (
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  Mining Author:
                </Text>
                <Tooltip label={activeWallet.nodeConfig.miningAuthor}>
                  <Code style={{ fontSize: '0.75rem' }}>
                    {activeWallet.nodeConfig.miningAuthor.slice(0, 16)}...
                  </Code>
                </Tooltip>
              </Group>
            )}
          </>
        )}

        {/* Data Directory */}
        {dataDir && (
          <Group gap="xs">
            <IconFolder size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
            <Text size="sm" c="dimmed">
              Data Dir:
            </Text>
            <Tooltip label={dataDir}>
              <Code style={{ fontSize: '0.75rem' }}>.../{dataDir.split('/').pop()}</Code>
            </Tooltip>
          </Group>
        )}

        {/* Mnemonic Hash */}
        {mnemonicHash && (
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Wallet Hash:
            </Text>
            <Code style={{ fontSize: '0.75rem' }}>{mnemonicHash}</Code>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
