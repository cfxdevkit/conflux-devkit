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

import { Divider, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconSettings, IconShield, IconUsers, IconWallet } from '@tabler/icons-react';
import { useState } from 'react';
import { AdminsPanel } from '@/components/config/AdminsPanel';
import { SecurityPanel } from '@/components/config/SecurityPanel';
import { WalletsPanel } from '@/components/config/WalletsPanel';
import { useAuthStore } from '@/stores/authStore';

export function Configuration() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string | null>('wallets');

  const isAdmin = user?.isAdmin ?? false;

  if (!isAdmin) {
    return (
      <Stack align="center" gap="md" py="xl">
        <IconSettings size={48} stroke={1.5} color="gray" />
        <Title order={4} c="dimmed">
          Configuration
        </Title>
        <Text c="dimmed">Only admin users can access configuration settings.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group gap="xs">
        <IconSettings size={24} />
        <Title order={3}>Configuration</Title>
      </Group>

      <Divider />

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="wallets" leftSection={<IconWallet size={16} />}>
            Wallets
          </Tabs.Tab>
          <Tabs.Tab value="admins" leftSection={<IconUsers size={16} />}>
            Admins
          </Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconShield size={16} />}>
            Security
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="wallets" pt="md">
          <WalletsPanel />
        </Tabs.Panel>

        <Tabs.Panel value="admins" pt="md">
          <AdminsPanel />
        </Tabs.Panel>

        <Tabs.Panel value="security" pt="md">
          <SecurityPanel />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
