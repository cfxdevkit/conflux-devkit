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

import { Avatar, Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconLogout, IconWallet } from '@tabler/icons-react';
import { ConnectKitButton } from 'connectkit';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useAuthStore } from '@/stores/authStore';

export function AuthSection() {
  const { user, isConnected } = useAuthStore();
  const { logout } = useWalletAuth();

  if (!isConnected || !user) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Stack align="center" gap="md">
          <IconWallet size={48} stroke={1.5} />
          <Text size="xl" fw={600}>
            Welcome to Conflux DevKit
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Connect your wallet to access the development node management dashboard
          </Text>
          <ConnectKitButton />
        </Stack>
      </Card>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Group>
          <Avatar color="blue" radius="xl">
            {user.address.slice(2, 4).toUpperCase()}
          </Avatar>
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              {formatAddress(user.address)}
            </Text>
            <Badge size="xs" variant="light" color="green">
              Connected
            </Badge>
          </Stack>
        </Group>
        <Button leftSection={<IconLogout size={16} />} variant="light" color="red" onClick={logout}>
          Disconnect
        </Button>
      </Group>
    </Card>
  );
}
