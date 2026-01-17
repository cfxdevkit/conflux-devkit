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

import { useAuthStore } from '@/stores/authStore';
import { Card, Stack, Text } from '@mantine/core';
import { IconWallet } from '@tabler/icons-react';
import { ConnectKitButton } from 'connectkit';

export function AuthSection() {
  const { isConnected } = useAuthStore();

  // If connected, show nothing (navbar handles display)
  if (isConnected) {
    return null;
  }

  // Show connection prompt when not connected
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
