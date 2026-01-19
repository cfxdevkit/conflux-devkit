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

import { Alert, Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCloud, IconServer, IconTestPipe } from '@tabler/icons-react';
import { useDevNodeStore } from '@/stores/devnodeStore';
import type { NetworkType } from '@/types/devnode';

/**
 * DevKit backend network switcher
 * Controls which network the backend connects to
 */
export function DevKitNetworkSwitcher() {
  const { status, isSwitchingNetwork, switchNetwork } = useDevNodeStore();

  const currentNetwork = status?.network || 'local';

  const networks: Array<{
    id: NetworkType;
    name: string;
    description: string;
    icon: typeof IconServer;
    color: string;
    capabilities: string[];
  }> = [
    {
      id: 'local',
      name: 'Local DevNode',
      description: 'Local development node',
      icon: IconServer,
      color: 'green',
      capabilities: ['Mining', 'Faucet', 'Node Control', 'Deploy', 'Monitor'],
    },
    {
      id: 'testnet',
      name: 'Conflux Testnet',
      description: 'Public test network',
      icon: IconTestPipe,
      color: 'blue',
      capabilities: ['Deploy', 'Monitor', 'Transactions'],
    },
    {
      id: 'mainnet',
      name: 'Conflux Mainnet',
      description: 'Production network',
      icon: IconCloud,
      color: 'orange',
      capabilities: ['Deploy', 'Monitor', 'Transactions'],
    },
  ];

  const handleSwitchNetwork = async (networkId: NetworkType) => {
    if (networkId === currentNetwork) return;

    try {
      await switchNetwork(networkId);
      notifications.show({
        title: 'Network Switched',
        message: `Connected to ${networks.find((n) => n.id === networkId)?.name}`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Switch Failed',
        message: error.response?.data?.message || error.message || 'Failed to switch network',
        color: 'red',
      });
    }
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={600}>
              DevKit Network
            </Text>
            <Text size="xs" c="dimmed">
              Select the network for backend operations
            </Text>
          </div>
          <Badge
            color={networks.find((n) => n.id === currentNetwork)?.color || 'gray'}
            variant="filled"
          >
            {networks.find((n) => n.id === currentNetwork)?.name || currentNetwork}
          </Badge>
        </Group>

        {currentNetwork !== 'local' && (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
            <Text size="xs">
              Mining, faucet, and node control are disabled on {currentNetwork}. Switch to local
              network for full development features.
            </Text>
          </Alert>
        )}

        <Stack gap="xs">
          {networks.map((network) => {
            const Icon = network.icon;
            const isActive = currentNetwork === network.id;

            return (
              <Button
                key={network.id}
                variant={isActive ? 'filled' : 'light'}
                color={network.color}
                onClick={() => handleSwitchNetwork(network.id)}
                loading={isSwitchingNetwork}
                disabled={isActive}
                fullWidth
                h="auto"
                py="sm"
              >
                <Group justify="space-between" w="100%">
                  <Group gap="sm">
                    <Icon size={20} />
                    <div style={{ textAlign: 'left' }}>
                      <Text size="sm" fw={500}>
                        {network.name}
                      </Text>
                      <Text size="xs" c={isActive ? 'white' : 'dimmed'}>
                        {network.description}
                      </Text>
                    </div>
                  </Group>
                  <Group gap={4}>
                    {network.capabilities.slice(0, 3).map((cap) => (
                      <Badge
                        key={cap}
                        size="xs"
                        variant={isActive ? 'white' : 'light'}
                        color={isActive ? 'white' : network.color}
                      >
                        {cap}
                      </Badge>
                    ))}
                    {network.capabilities.length > 3 && (
                      <Badge
                        size="xs"
                        variant={isActive ? 'white' : 'light'}
                        color={isActive ? 'white' : network.color}
                      >
                        +{network.capabilities.length - 3}
                      </Badge>
                    )}
                  </Group>
                </Group>
              </Button>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}
