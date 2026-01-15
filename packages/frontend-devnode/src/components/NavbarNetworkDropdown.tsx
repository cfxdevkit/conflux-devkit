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
    confluxESpace,
    confluxESpaceTestnet,
    confluxLocalESpace,
} from '@/config/wagmi';
import { useDevNodeStore } from '@/stores/devnodeStore';
import type { NetworkType } from '@/types/devnode';
import { Badge, Button, Group, Menu, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCheck,
    IconChevronDown,
    IconCloud,
    IconLock,
    IconServer,
    IconTestPipe,
} from '@tabler/icons-react';
import { useSwitchChain } from 'wagmi';

interface NetworkConfig {
  id: NetworkType;
  name: string;
  description: string;
  icon: typeof IconServer;
  color: string;
  walletChainId: number;
}

const networks: NetworkConfig[] = [
  {
    id: 'local',
    name: 'Local',
    description: 'DevKit node',
    icon: IconServer,
    color: 'green',
    walletChainId: confluxLocalESpace.id,
  },
  {
    id: 'testnet',
    name: 'Testnet',
    description: 'Conflux test network',
    icon: IconTestPipe,
    color: 'yellow',
    walletChainId: confluxESpaceTestnet.id,
  },
  {
    id: 'mainnet',
    name: 'Mainnet',
    description: 'Conflux mainnet',
    icon: IconCloud,
    color: 'blue',
    walletChainId: confluxESpace.id,
  },
];

/**
 * Network dropdown for the navbar
 * When node is running, network is locked to local
 * When testnet/mainnet selected, node control is disabled
 * Also switches wallet network via wagmi
 */
export function NavbarNetworkDropdown() {
  const { status, isSwitchingNetwork, switchNetwork } = useDevNodeStore();
  const { switchChain } = useSwitchChain();

  const currentNetwork = status?.network || 'local';
  const isNodeRunning = status?.isRunning ?? false;

  const currentNetworkConfig = networks.find((n) => n.id === currentNetwork);
  const CurrentIcon = currentNetworkConfig?.icon || IconServer;

  const isNetworkAvailable = (networkId: NetworkType): boolean => {
    if (networkId === 'local') return true;
    // Testnet and mainnet are only available when node is NOT running
    return !isNodeRunning;
  };

  const handleNetworkChange = async (networkId: NetworkType) => {
    if (!isNetworkAvailable(networkId)) {
      notifications.show({
        title: 'Network Locked',
        message: 'Cannot switch networks while local node is running. Stop the node first.',
        color: 'orange',
      });
      return;
    }

    if (networkId === currentNetwork) return;

    const networkConfig = networks.find((n) => n.id === networkId);

    try {
      // Switch backend network
      await switchNetwork(networkId);

      // Also switch wallet network
      if (switchChain && networkConfig) {
        try {
          await switchChain({ chainId: networkConfig.walletChainId });
        } catch (walletError) {
          // Wallet switch may fail if user rejects, but backend switch succeeded
          console.warn('Wallet network switch failed:', walletError);
        }
      }

      notifications.show({
        title: 'Network Switched',
        message: `Connected to ${networkConfig?.name}`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Switch Failed',
        message: error.message || 'Failed to switch network',
        color: 'red',
      });
    }
  };

  return (
    <Menu shadow="md" width={240} position="bottom-end">
      <Menu.Target>
        <Button
          variant="light"
          color={currentNetworkConfig?.color}
          size="sm"
          loading={isSwitchingNetwork}
          rightSection={<IconChevronDown size={14} />}
          leftSection={
            <ThemeIcon size="xs" color={currentNetworkConfig?.color} variant="filled" radius="xl">
              <CurrentIcon size={12} />
            </ThemeIcon>
          }
        >
          {currentNetworkConfig?.name}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Group justify="space-between">
            <Text size="xs">Current Network</Text>
            <Badge size="xs" color={currentNetworkConfig?.color} variant="light">
              {currentNetworkConfig?.name}
            </Badge>
          </Group>
        </Menu.Label>

        {isNodeRunning && (
          <Menu.Item
            disabled
            leftSection={<IconLock size={14} />}
            c="blue"
            bg="blue.0"
          >
            <Text size="xs">Locked while node running</Text>
          </Menu.Item>
        )}

        <Menu.Divider />

        {networks.map((network) => {
          const NetworkIcon = network.icon;
          const isAvailable = isNetworkAvailable(network.id);
          const isSelected = currentNetwork === network.id;

          return (
            <Tooltip
              key={network.id}
              label={!isAvailable ? 'Stop the node to switch networks' : ''}
              disabled={isAvailable}
              position="left"
            >
              <Menu.Item
                onClick={() => handleNetworkChange(network.id)}
                disabled={!isAvailable || isSwitchingNetwork}
                leftSection={
                  <ThemeIcon size="sm" color={network.color} variant="light" radius="md">
                    <NetworkIcon size={14} />
                  </ThemeIcon>
                }
                rightSection={
                  isSelected ? (
                    <IconCheck size={14} color="var(--mantine-color-blue-6)" />
                  ) : !isAvailable ? (
                    <IconLock size={14} color="var(--mantine-color-gray-5)" />
                  ) : null
                }
                bg={isSelected ? 'blue.0' : undefined}
              >
                <Stack gap={0}>
                  <Text size="sm" fw={isSelected ? 600 : 400}>
                    {network.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {network.description}
                  </Text>
                </Stack>
              </Menu.Item>
            </Tooltip>
          );
        })}

        <Menu.Divider />

        <Menu.Label>
          <Text size="xs" c="dimmed">
            💡 Wallet connects to both Core and eSpace
          </Text>
        </Menu.Label>
      </Menu.Dropdown>
    </Menu>
  );
}
