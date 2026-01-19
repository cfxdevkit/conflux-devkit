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

import { Badge, Group, Menu, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconChevronDown, IconLock, IconWallet } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useDevNodeStore } from '@/stores/devnodeStore';
import { useWalletStore, type WalletEntry } from '@/stores/walletStore';

interface WalletSelectorProps {
  disabled?: boolean;
}

export function WalletSelector({ disabled }: WalletSelectorProps) {
  const { wallets, activeWallet, isLoading, isSwitching, isLocked, fetchWallets, switchWallet } =
    useWalletStore();
  const { status } = useDevNodeStore();

  const isNodeRunning = status?.isRunning ?? false;
  const canSwitch = !isNodeRunning && !disabled && !isSwitching && !isLocked;

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleSwitch = async (wallet: WalletEntry) => {
    if (!canSwitch || wallet.isActive) return;

    try {
      await switchWallet(wallet.id);
      notifications.show({
        title: 'Wallet Switched',
        message: `Now using "${wallet.label}"`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Switch Failed',
        message: error.message || 'Failed to switch wallet',
        color: 'red',
      });
    }
  };

  const getTypeColor = (type: WalletEntry['type']) => {
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

  if (isLoading) {
    return (
      <Group gap="xs">
        <IconWallet size={18} />
        <Text size="sm" c="dimmed">
          Loading wallets...
        </Text>
      </Group>
    );
  }

  return (
    <Menu shadow="md" width={280} position="bottom-end">
      <Tooltip
        label={
          isNodeRunning
            ? 'Stop the node to switch wallets'
            : isLocked
              ? 'Unlock the keystore to switch wallets'
              : 'Select wallet'
        }
        disabled={canSwitch}
      >
        <Menu.Target>
          <UnstyledButton
            disabled={!canSwitch && wallets.length > 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-gray-3)',
              backgroundColor: 'var(--mantine-color-white)',
              cursor: canSwitch || wallets.length <= 1 ? 'pointer' : 'not-allowed',
              opacity: canSwitch || wallets.length <= 1 ? 1 : 0.7,
            }}
          >
            <IconWallet size={18} />
            <Text size="sm" fw={500}>
              {activeWallet?.label || 'No Wallet'}
            </Text>
            {isLocked && <IconLock size={14} style={{ color: 'var(--mantine-color-orange-6)' }} />}
            {wallets.length > 1 && <IconChevronDown size={14} />}
          </UnstyledButton>
        </Menu.Target>
      </Tooltip>

      {wallets.length > 1 && (
        <Menu.Dropdown>
          <Menu.Label>Switch Wallet</Menu.Label>
          {isNodeRunning && (
            <Text size="xs" c="orange" px="sm" pb="xs">
              Stop the node to switch wallets
            </Text>
          )}
          {wallets.map((wallet) => (
            <Menu.Item
              key={wallet.id}
              leftSection={
                wallet.isActive ? (
                  <IconCheck size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
                ) : (
                  <IconWallet size={16} />
                )
              }
              rightSection={
                <Badge size="xs" color={getTypeColor(wallet.type)} variant="light">
                  {wallet.type}
                </Badge>
              }
              onClick={() => handleSwitch(wallet)}
              disabled={!canSwitch || wallet.isActive}
              style={{
                backgroundColor: wallet.isActive ? 'var(--mantine-color-green-0)' : undefined,
              }}
            >
              <Text size="sm" fw={wallet.isActive ? 600 : 400}>
                {wallet.label}
              </Text>
              {wallet.nodeConfig && (
                <Text size="xs" c="dimmed">
                  {wallet.nodeConfig.accountsCount} accounts • Chain {wallet.nodeConfig.chainId}/
                  {wallet.nodeConfig.evmChainId}
                </Text>
              )}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      )}
    </Menu>
  );
}
