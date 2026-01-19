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

import { AppShell, Badge, Button, Container, Group, Loader, Stack, Tabs, Text, Title } from '@mantine/core';
import {
  IconBrandGithub,
  IconDatabase,
  IconLogout,
  IconSettings,
  IconWallet,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { AuthSection } from '@/components/AuthSection';
import { BlockchainMonitor } from '@/components/BlockchainMonitor';
import { DevNodeControlPanel } from '@/components/DevNodeControlPanel';
import { DevNodeStatus } from '@/components/DevNodeStatus';
import { FaucetButton } from '@/components/FaucetButton';
import { FirstLoginModal } from '@/components/FirstLoginModal';
import { NavbarNetworkDropdown } from '@/components/NavbarNetworkDropdown';
import { SetupWizard } from '@/components/SetupWizard';
import { TestMnemonicWarning } from '@/components/TestMnemonicWarning';
import { WalletSettingsEnhanced } from '@/components/WalletSettingsEnhanced';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { apiClient } from '@/services/api';
import { wsClient } from '@/services/websocket';
import { useAuthStore } from '@/stores/authStore';
import { useDevNodeStore } from '@/stores/devnodeStore';
import { useSetupStore } from '@/stores/setupStore';

function App() {
  const { isAuthenticated, logout } = useWalletAuth();
  const { user } = useAuthStore();
  const { status, updateStatus, fetchStatus, fetchAccounts } = useDevNodeStore();
  const { status: setupStatus, isLoading: setupLoading, fetchStatus: fetchSetupStatus } = useSetupStore();
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [isTestMnemonic, setIsTestMnemonic] = useState(false);
  const [activeTab, setActiveTab] = useState('devnode');

  // Check setup status on mount (before authentication)
  useEffect(() => {
    fetchSetupStatus();
  }, [fetchSetupStatus]);

  // Check wallet status on authentication (only if setup is completed)
  useEffect(() => {
    if (!isAuthenticated || !setupStatus?.setupCompleted) return;

    const checkWalletStatus = async () => {
      try {
        const walletStatus = await apiClient.getWalletStatus();

        // Track test mnemonic status for footer warning
        setIsTestMnemonic(walletStatus.isTestMnemonic === true);

        // Show warning if using test mnemonic and not encrypted
        if (walletStatus.isTestMnemonic === true && !walletStatus.encryptionEnabled) {
          // Only show once per session
          const hasSeenWarning = sessionStorage.getItem('firstLoginWarningShown');
          if (!hasSeenWarning) {
            setShowFirstLoginModal(true);
            sessionStorage.setItem('firstLoginWarningShown', 'true');
          }
        }
      } catch (error) {
        console.error('Failed to check wallet status:', error);
      }
    };

    checkWalletStatus();
  }, [isAuthenticated, setupStatus?.setupCompleted]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Prime data on auth
    fetchStatus();
    fetchAccounts();

    // Connect to WebSocket for real-time updates
    console.log('[App] Connecting to WebSocket...');
    wsClient
      .connect()
      .then(() => {
        console.log('[App] WebSocket connected successfully');
      })
      .catch((err) => {
        console.error('[App] WebSocket connection failed:', err);
      });

    // Subscribe to nodeStats broadcasts from backend
    const unsubStats = wsClient.on('nodeStats', (data) => {
      console.log('[App] Received nodeStats:', data);
      // Backend sends block numbers and status - use store merge to preserve existing fields (RPC URLs)
      if (data.nodeRunning) {
        const coreGas = data.gasPrice?.core;
        const evmGas = data.gasPrice?.evm;

        updateStatus({
          isRunning: true,
          coreSpace: {
            chainId: status?.coreSpace.chainId ?? 2029,
            rpcUrl: status?.coreSpace.rpcUrl ?? '',
            blockNumber: parseInt(data.coreBlockNumber || '0', 10),
            gasPrice: coreGas ? String(coreGas) : (status?.coreSpace.gasPrice ?? '0'),
          },
          eSpace: {
            chainId: status?.eSpace.chainId ?? 2030,
            rpcUrl: status?.eSpace.rpcUrl ?? '',
            blockNumber: parseInt(data.evmBlockNumber || '0', 10),
            gasPrice: evmGas ? String(evmGas) : (status?.eSpace.gasPrice ?? '0'),
          },
          miningMode: data.miningStatus ? 'auto' : 'manual',
        });
      } else {
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
              {isAuthenticated && user ? (
                <Group gap="md">
                  <NavbarNetworkDropdown />
                  <FaucetButton />
                  <Stack gap={4}>
                    <Text size="sm" fw={500}>
                      {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    </Text>
                    <Group gap={6}>
                      {user.isAdmin && (
                        <Badge size="xs" variant="filled" color="green">
                          Admin
                        </Badge>
                      )}
                      <Badge size="xs" variant="light" color="green">
                        Connected
                      </Badge>
                    </Group>
                  </Stack>
                  <Button
                    leftSection={<IconLogout size={16} />}
                    variant="light"
                    color="red"
                    size="xs"
                    onClick={logout}
                  >
                    Disconnect
                  </Button>
                </Group>
              ) : null}
              <a
                href="https://github.com/cfxdevkit/conflux-devkit"
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
          {/* Loading state while checking setup status */}
          {setupLoading && setupStatus === null && (
            <Stack align="center" gap="md" py="xl">
              <Loader size="lg" />
              <Text c="dimmed">Checking setup status...</Text>
            </Stack>
          )}

          {/* Setup Wizard - shown when setup is not completed */}
          {!setupLoading && setupStatus && !setupStatus.setupCompleted && (
            <SetupWizard />
          )}

          {/* Main app content - shown when setup is completed */}
          {setupStatus?.setupCompleted && (
            <Stack gap="lg" py="md">
              <AuthSection />

              {isAuthenticated && (
                <>
                  <Tabs
                    value={activeTab}
                    onChange={(value) => setActiveTab(value || 'devnode')}
                    orientation="horizontal"
                  >
                    <Tabs.List>
                      <Tabs.Tab value="devnode" leftSection={<IconSettings size={14} />}>
                        DevNode
                      </Tabs.Tab>
                      <Tabs.Tab value="wallet" leftSection={<IconWallet size={14} />}>
                        Wallet
                      </Tabs.Tab>
                      <Tabs.Tab value="monitor" leftSection={<IconDatabase size={14} />}>
                        Monitor
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="devnode" pt="md">
                      <Stack gap="lg">
                        <DevNodeStatus />
                        <DevNodeControlPanel />
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="wallet" pt="md">
                      <WalletSettingsEnhanced />
                    </Tabs.Panel>

                    <Tabs.Panel value="monitor" pt="md">
                      <BlockchainMonitor />
                    </Tabs.Panel>
                  </Tabs>
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
          )}
        </Container>
      </AppShell.Main>

      {/* Persistent footer warning for test mnemonic */}
      {isAuthenticated && isTestMnemonic && (
        <TestMnemonicWarning onConfigureClick={() => setActiveTab('wallet')} />
      )}

      {/* First-login modal for test mnemonic warning */}
      <FirstLoginModal
        opened={showFirstLoginModal}
        onClose={() => setShowFirstLoginModal(false)}
        onContinue={() => {
          console.log('User accepted test mnemonic');
        }}
        onSetMnemonic={async (mnemonic) => {
          await apiClient.addMnemonic({ mnemonic, label: 'Custom Wallet', setActive: true });
          console.log('Custom mnemonic set');
          // Refresh wallet status
          const newStatus = await apiClient.getWalletStatus();
          setIsTestMnemonic(newStatus.isTestMnemonic === true);
        }}
        onGenerateMnemonic={async () => {
          const result = await apiClient.generateMnemonic();
          return result.mnemonic;
        }}
        onEnableEncryption={async (password) => {
          await apiClient.enableEncryption(password);
          console.log('Encryption enabled');
        }}
      />
    </AppShell>
  );
}

export default App;
