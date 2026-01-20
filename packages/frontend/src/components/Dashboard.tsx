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
import { IconActivity, IconCode, IconDatabase, IconServer } from '@tabler/icons-react';
import { useState } from 'react';
import { AccountsTable } from '@/components/AccountsTable';
import { BlockchainMonitor } from '@/components/BlockchainMonitor';
import { ContractsPanel } from '@/components/contracts';
import { ActiveWalletCard } from '@/components/dashboard/ActiveWalletCard';
import { NodeControlPanel } from '@/components/dashboard/NodeControlPanel';
import { NodeStatsCards } from '@/components/dashboard/NodeStatsCards';
import { WalletSelector } from '@/components/dashboard/WalletSelector';
import { useAuthStore } from '@/stores/authStore';
import { useDevNodeStore } from '@/stores/devnodeStore';

export function Dashboard() {
  const { user } = useAuthStore();
  const { status } = useDevNodeStore();
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  const isAdmin = user?.isAdmin ?? false;
  const isNodeRunning = status?.isRunning ?? false;

  return (
    <Stack gap="lg">
      {/* Dashboard Header with Wallet Selector */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconServer size={24} />
          <Title order={3}>Dashboard</Title>
        </Group>
        <WalletSelector disabled={!isAdmin} />
      </Group>

      <Divider />

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconServer size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="monitor" leftSection={<IconActivity size={16} />}>
            Monitor
          </Tabs.Tab>
          <Tabs.Tab value="accounts" leftSection={<IconDatabase size={16} />}>
            Accounts
          </Tabs.Tab>
          <Tabs.Tab value="contracts" leftSection={<IconCode size={16} />}>
            Contracts
          </Tabs.Tab>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            {/* Active Wallet Info */}
            <ActiveWalletCard />

            {/* Node Control */}
            <NodeControlPanel />

            {/* Chain Stats */}
            <NodeStatsCards />
          </Stack>
        </Tabs.Panel>

        {/* Monitor Tab */}
        <Tabs.Panel value="monitor" pt="md">
          <BlockchainMonitor />
        </Tabs.Panel>

        {/* Accounts Tab */}
        <Tabs.Panel value="accounts" pt="md">
          {isNodeRunning ? (
            <AccountsTable />
          ) : (
            <Stack align="center" gap="md" py="xl">
              <IconDatabase size={48} stroke={1.5} color="gray" />
              <Text c="dimmed">Start the node to view accounts</Text>
            </Stack>
          )}
        </Tabs.Panel>

        {/* Contracts Tab */}
        <Tabs.Panel value="contracts" pt="md">
          <ContractsPanel />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
