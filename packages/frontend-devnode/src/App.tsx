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

import { AccountsTable } from '@/components/AccountsTable';
import { AuthSection } from '@/components/AuthSection';
import { DevNodeControlPanel } from '@/components/DevNodeControlPanel';
import { DevNodeStatus } from '@/components/DevNodeStatus';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { wsClient } from '@/services/websocket';
import { useDevNodeStore } from '@/stores/devnodeStore';
import { AppShell, Badge, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { useEffect } from 'react';

function App() {
  const { isAuthenticated } = useWalletAuth();
  const { status, updateStatus, fetchStatus, fetchAccounts } = useDevNodeStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Prime data on auth
    fetchStatus();
    fetchAccounts();

    // Connect to WebSocket for real-time updates
    console.log('[App] Connecting to WebSocket...');
    wsClient.connect().then(() => {
      console.log('[App] WebSocket connected successfully');
    }).catch((err) => {
      console.error('[App] WebSocket connection failed:', err);
    });

    // Subscribe to nodeStats broadcasts from backend
    const unsubStats = wsClient.on('nodeStats', (data) => {
      console.log('[App] Received nodeStats:', data);
      // Backend sends block numbers and status - merge with existing data to preserve RPC URLs
      if (data.nodeRunning && status) {
        updateStatus({
          isRunning: data.nodeRunning,
          coreSpace: {
            ...status.coreSpace,
            blockNumber: parseInt(data.coreBlockNumber || '0', 10),
            gasPrice: data.gasPrice?.core || '0',
          },
          eSpace: {
            ...status.eSpace,
            blockNumber: parseInt(data.evmBlockNumber || '0', 10),
            gasPrice: data.gasPrice?.evm || '0',
          },
          miningMode: data.miningStatus ? 'auto' : 'manual',
        });
      } else if (!data.nodeRunning) {
        // Node stopped, only update running state
        updateStatus({
          isRunning: false,
        });
      }
    });

    const unsubBlock = wsClient.on('devnode:block', (data) => {
      console.log('New block:', data);
    });

    const unsubError = wsClient.on('devnode:error', (data) => {
      console.error('DevNode error:', data);
    });

    return () => {
      unsubStats();
      unsubBlock();
      unsubError();
      wsClient.disconnect();
    };
  }, [isAuthenticated, updateStatus, fetchStatus, fetchAccounts]);

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Group>
              <Title order={3}>Conflux DevKit</Title>
              <Badge variant="light" color="blue">
                DevNode Manager
              </Badge>
            </Group>
            <Group>
              <a
                href="https://github.com/conflux-devkit/conflux-devkit"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
              >
                <IconBrandGithub size={24} />
              </a>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Stack gap="lg" py="md">
            <AuthSection />

            {isAuthenticated && (
              <>
                <DevNodeControlPanel />
                <DevNodeStatus />
                <AccountsTable />
              </>
            )}

            {!isAuthenticated && (
              <Stack align="center" gap="md" py="xl">
                <Text size="lg" c="dimmed">
                  Connect your wallet to manage the development node
                </Text>
              </Stack>
            )}
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
