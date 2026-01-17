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
    confluxCore,
    confluxCoreTestnet,
    confluxESpace,
    confluxESpaceTestnet,
    confluxLocalCore,
    confluxLocalESpace,
} from '@/config/wagmi';
import { Badge, Button, Card, Grid, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconNetwork } from '@tabler/icons-react';
import { useChainId, useSwitchChain } from 'wagmi';

/**
 * Network switcher widget showing available networks
 * Allows users to add networks to their wallet
 */
export function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // All available networks
  const networks = [
    {
      chain: confluxESpace,
      category: 'Mainnet',
      description: 'EVM-compatible',
    },
    {
      chain: confluxCore,
      category: 'Mainnet',
      description: 'Core Space',
    },
    {
      chain: confluxESpaceTestnet,
      category: 'Testnet',
      description: 'eSpace Testnet',
    },
    {
      chain: confluxCoreTestnet,
      category: 'Testnet',
      description: 'Core Testnet',
    },
    {
      chain: confluxLocalESpace,
      category: 'Local',
      description: 'Dev eSpace',
    },
    {
      chain: confluxLocalCore,
      category: 'Local',
      description: 'Dev Core',
    },
  ];

  const handleSwitchNetwork = async (chain: any) => {
    try {
      if (switchChain) {
        await switchChain({ chainId: chain.id });
        notifications.show({
          title: 'Network Switched',
          message: `Connected to ${chain.name}`,
          color: 'green',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Switch Failed',
        message: error.message || 'Failed to switch network',
        color: 'red',
      });
    }
  };

  // Group networks by category
  const grouped = networks.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof networks>
  );

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="xs">
          <IconNetwork size={20} />
          <div>
            <Text size="sm" fw={600}>
              Available Networks
            </Text>
            <Text size="xs" c="dimmed">
              Switch between different blockchain networks
            </Text>
          </div>
        </Group>

        <Stack gap="sm">
          {Object.entries(grouped).map(([category, categoryNetworks]) => (
            <div key={category}>
              <Text size="xs" fw={500} c="dimmed" mb={6}>
                {category}
              </Text>
              <Grid gutter="xs">
                {categoryNetworks.map(({ chain, description }) => (
                  <Grid.Col key={chain.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Button
                      variant={chainId === chain.id ? 'filled' : 'light'}
                      onClick={() => handleSwitchNetwork(chain)}
                      fullWidth
                      size="sm"
                      rightSection={
                        chainId === chain.id && <Badge size="xs" color="green">Active</Badge>
                      }
                    >
                      <Stack gap={2} style={{ alignItems: 'flex-start', width: '100%' }}>
                        <Text size="sm" fw={500} style={{ lineHeight: 1 }}>
                          {chain.name}
                        </Text>
                        <Text size="xs" c={chainId === chain.id ? 'white' : 'dimmed'}>
                          {description}
                        </Text>
                      </Stack>
                    </Button>
                  </Grid.Col>
                ))}
              </Grid>
            </div>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
