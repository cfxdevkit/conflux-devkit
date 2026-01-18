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

import { apiClient } from '@/services/api';
import { useDevNodeStore } from '@/stores/devnodeStore';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Checkbox,
    Code,
    CopyButton,
    Group,
    Modal,
    PasswordInput,
    SegmentedControl,
    Stack,
    Table,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle,
    IconCheck,
    IconCopy,
    IconEye,
    IconKey,
    IconLock,
    IconLockOpen,
    IconPlus,
    IconRefresh,
    IconWallet,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface KeystoreEntry {
  index: number;
  label: string;
  type: string;
  isActive: boolean;
}

interface DerivedAccount {
  address: string;
  path: string;
  index: number;
  network: string;
  balance?: string;
}

interface WalletStatus {
  isTestMnemonic: boolean | null;
  hasCustomMnemonic: boolean | null;
  encryptionEnabled: boolean;
  isLocked: boolean;
  adminAddress: string | null;
  walletCount: number;
  activeWallet: string;
}

export function WalletSettingsEnhanced() {
  // Get devnode status to check if node is running
  const { status } = useDevNodeStore();
  
  // Wallet state
  const [entries, setEntries] = useState<KeystoreEntry[]>([]);
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived accounts
  const [accounts, setAccounts] = useState<DerivedAccount[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<'core' | 'espace'>('espace');

  // Modals
  const [addWalletOpened, { open: openAddWallet, close: closeAddWallet }] = useDisclosure(false);
  const [encryptionOpened, { open: openEncryption, close: closeEncryption }] = useDisclosure(false);
  const [changePasswordOpened, { open: openChangePassword, close: closeChangePassword }] = useDisclosure(false);
  const [showMnemonicOpened, { open: openShowMnemonic, close: closeShowMnemonic }] = useDisclosure(false);
  const [showPrivateKeyOpened, { open: openShowPrivateKey, close: closeShowPrivateKey }] = useDisclosure(false);

  // Form states
  const [newMnemonic, setNewMnemonic] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [generateMode, setGenerateMode] = useState(false);
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');

  // Encryption states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');

  // Show secrets states
  const [showMnemonicConfirmed, setShowMnemonicConfirmed] = useState(false);
  const [visibleMnemonic, setVisibleMnemonic] = useState('');
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [privateKeyConfirmed, setPrivateKeyConfirmed] = useState(false);
  const [visiblePrivateKey, setVisiblePrivateKey] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (selectedNetwork && !walletStatus?.isLocked) {
      fetchAccounts();
      
      // Auto-refresh balances every 10 seconds
      const interval = setInterval(() => {
        fetchAccounts();
      }, 10000);
      
      // Listen for manual balance update events (e.g., after faucet)
      const handleBalanceUpdate = () => {
        fetchAccounts();
      };
      window.addEventListener('wallet:balance-update', handleBalanceUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('wallet:balance-update', handleBalanceUpdate);
      };
    }
  }, [selectedNetwork, walletStatus?.isLocked]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [keystoreData, statusData] = await Promise.all([
        apiClient.listWallets(),
        apiClient.getWalletStatus(),
      ]);
      
      setEntries(keystoreData.wallets || []);
      setWalletStatus(statusData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch wallet data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      // Check if we're on local network and if node is running
      const isLocalNetwork = !status?.network || status.network === 'local';
      const isNodeRunning = status?.isRunning ?? false;

      // Skip balance fetching if on local network and node is not running
      if (isLocalNetwork && !isNodeRunning) {
        // Just fetch accounts without balances
        const data = await apiClient.deriveAccounts(selectedNetwork, 5, 0);
        setAccounts(data.accounts.map(account => ({ ...account, balance: '0' })));
        return;
      }

      const data = await apiClient.deriveAccounts(selectedNetwork, 5, 0);
      
      // Fetch balances from blockchain
      const accountsWithBalances = await Promise.all(
        data.accounts.map(async (account) => {
          try {
            const balanceData = await apiClient.getBalanceByAddress(account.address);
            
            // Check for errors in the response
            if (balanceData.error) {
              console.warn(`Balance fetch warning for ${account.address}:`, balanceData.error);
            }
            
            // Use the appropriate balance based on network
            const balance = selectedNetwork === 'core' ? balanceData.balances.core : balanceData.balances.evm;
            return { ...account, balance };
          } catch (error) {
            console.error('Failed to fetch balance for', account.address, error);
            return { ...account, balance: '0' };
          }
        })
      );
      
      setAccounts(accountsWithBalances);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch accounts',
        color: 'red',
      });
    }
  };

  const handleGenerateMnemonic = async () => {
    try {
      const data = await apiClient.generateMnemonic();
      setGeneratedMnemonic(data.mnemonic);
      setNewMnemonic(data.mnemonic);
      setGenerateMode(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to generate mnemonic',
        color: 'red',
      });
    }
  };

  const handleAddWallet = async () => {
    if (!newMnemonic.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter or generate a mnemonic',
        color: 'yellow',
      });
      return;
    }

    try {
      await apiClient.addMnemonic({
        mnemonic: newMnemonic,
        label: newLabel || 'Custom Wallet',
        setActive: setAsActive,
      });

      notifications.show({
        title: 'Success',
        message: 'Wallet added successfully',
        color: 'green',
      });

      setNewMnemonic('');
      setNewLabel('');
      setGeneratedMnemonic('');
      setGenerateMode(false);
      closeAddWallet();
      await fetchWalletData();
      await fetchAccounts();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to add wallet',
        color: 'red',
      });
    }
  };

  const handleEnableEncryption = async () => {
    if (password.length < 8) {
      notifications.show({
        title: 'Validation Error',
        message: 'Password must be at least 8 characters',
        color: 'yellow',
      });
      return;
    }

    if (password !== confirmPassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'Passwords do not match',
        color: 'yellow',
      });
      return;
    }

    try {
      await apiClient.enableEncryption(password);
      notifications.show({
        title: 'Success',
        message: 'Encryption enabled successfully',
        color: 'green',
      });
      setPassword('');
      setConfirmPassword('');
      closeEncryption();
      await fetchWalletData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to enable encryption',
        color: 'red',
      });
    }
  };

  const handleDisableEncryption = async () => {
    if (!oldPassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter your current password',
        color: 'yellow',
      });
      return;
    }

    try {
      // First unlock, then disable
      await apiClient.unlockWallet(oldPassword);
      // TODO: Add disable encryption endpoint
      notifications.show({
        title: 'Info',
        message: 'Unlocked successfully. Disable encryption endpoint not yet implemented.',
        color: 'blue',
      });
      setOldPassword('');
      closeChangePassword();
      await fetchWalletData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to disable encryption',
        color: 'red',
      });
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter your password',
        color: 'yellow',
      });
      return;
    }

    try {
      await apiClient.unlockWallet(password);
      notifications.show({
        title: 'Success',
        message: 'Wallet unlocked successfully',
        color: 'green',
      });
      setPassword('');
      closeEncryption();
      await fetchWalletData();
      await fetchAccounts();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Invalid password',
        color: 'red',
      });
    }
  };

  const handleSelectWallet = async (index: number) => {
    try {
      await apiClient.selectMnemonic(index);
      notifications.show({
        title: 'Success',
        message: 'Wallet switched successfully',
        color: 'green',
      });
      await fetchWalletData();
      await fetchAccounts();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to switch wallet',
        color: 'red',
      });
    }
  };

  const handleShowMnemonic = async () => {
    if (!showMnemonicConfirmed) return;

    try {
      const data = await apiClient.showMnemonic(true);
      if (data.mnemonic) {
        setVisibleMnemonic(data.mnemonic);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to retrieve mnemonic',
        color: 'red',
      });
    }
  };

  const handleShowPrivateKey = async () => {
    if (!privateKeyConfirmed) return;

    try {
      const data = await apiClient.getPrivateKey(selectedNetwork, selectedAccountIndex, true);
      if (data.privateKey) {
        setVisiblePrivateKey(data.privateKey);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to retrieve private key',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="lg">
      {/* Test Mnemonic Warning */}
      {walletStatus?.isTestMnemonic && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="Test Mnemonic Active">
          You are using the default test mnemonic. This is insecure for production use.
        </Alert>
      )}

      {/* Locked Warning */}
      {walletStatus?.isLocked && (
        <Alert icon={<IconLock size={16} />} color="orange" title="Wallet Locked">
          Your wallet is encrypted and locked. <Button size="xs" variant="light" onClick={openEncryption}>Unlock Now</Button>
        </Alert>
      )}

      {/* Wallet Management */}
      <Card withBorder>
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon variant="light"><IconWallet size={18} /></ThemeIcon>
              <Title order={4}>Wallet Management</Title>
              <Badge variant="light">{entries.length} wallet(s)</Badge>
            </Group>
            <Group gap="xs">
              <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />} onClick={fetchWalletData} loading={loading}>
                Refresh
              </Button>
              <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openAddWallet}>
                Add Wallet
              </Button>
              {walletStatus?.isLocked ? (
                <Button size="xs" leftSection={<IconLockOpen size={14} />} color="orange" onClick={openEncryption}>
                  Unlock
                </Button>
              ) : walletStatus?.encryptionEnabled ? (
                <Button size="xs" leftSection={<IconKey size={14} />} onClick={openChangePassword}>
                  Change Password
                </Button>
              ) : (
                <Button size="xs" leftSection={<IconLock size={14} />} onClick={openEncryption}>
                  Enable Encryption
                </Button>
              )}
            </Group>
          </Group>
        </Card.Section>

        <Table striped mt="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Label</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map((entry) => (
              <Table.Tr key={entry.index}>
                <Table.Td><Text fw={500}>#{entry.index}</Text></Table.Td>
                <Table.Td>{entry.label}</Table.Td>
                <Table.Td><Badge size="sm" variant="light">{entry.type}</Badge></Table.Td>
                <Table.Td>
                  {entry.isActive ? (
                    <Badge color="green" size="sm">Active</Badge>
                  ) : (
                    <Badge color="gray" variant="light" size="sm">Inactive</Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {!entry.isActive && (
                      <Tooltip label="Set as active">
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleSelectWallet(entry.index)}>
                          <IconCheck size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {entry.isActive && !walletStatus?.isLocked && (
                      <Tooltip label="Show mnemonic">
                        <ActionIcon variant="light" color="orange" size="sm" onClick={openShowMnemonic}>
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Derived Accounts */}
      <Card withBorder>
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon variant="light"><IconKey size={18} /></ThemeIcon>
              <Title order={4}>Derived Accounts</Title>
            </Group>
            <Group gap="xs">
              <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />} onClick={fetchAccounts}>
                Refresh
              </Button>
              <SegmentedControl
                value={selectedNetwork}
                onChange={(value) => setSelectedNetwork(value as 'core' | 'espace')}
                data={[
                  { label: 'eSpace', value: 'espace' },
                  { label: 'Core', value: 'core' },
                ]}
              />
            </Group>
          </Group>
        </Card.Section>

        {walletStatus?.isLocked ? (
          <Alert icon={<IconLock size={16} />} color="orange" mt="md">
            Unlock your wallet to view derived accounts
          </Alert>
        ) : (
          <Table striped mt="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Index</Table.Th>
                <Table.Th>Address</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {accounts.map((account) => (
                <Table.Tr key={account.index}>
                  <Table.Td><Text fw={500}>#{account.index}</Text></Table.Td>
                  <Table.Td>
                    <Code>{account.address.slice(0, 10)}...{account.address.slice(-8)}</Code>
                  </Table.Td>
                  <Table.Td>{account.balance || '0'} CFX</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <CopyButton value={account.address}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copied' : 'Copy address'}>
                            <ActionIcon variant="light" color={copied ? 'green' : 'blue'} size="sm" onClick={copy}>
                              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                      <Tooltip label="Show private key">
                        <ActionIcon variant="light" color="orange" size="sm" onClick={() => {
                          setSelectedAccountIndex(account.index);
                          openShowPrivateKey();
                        }}>
                          <IconKey size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Add Wallet Modal */}
      <Modal opened={addWalletOpened} onClose={closeAddWallet} title="Add New Wallet" size="lg">
        <Stack gap="md">
          {!generateMode ? (
            <>
              <Textarea
                label="Mnemonic Phrase"
                placeholder="Enter your 12 or 24 word mnemonic..."
                value={newMnemonic}
                onChange={(e) => setNewMnemonic(e.target.value)}
                minRows={3}
              />
              <Button variant="light" onClick={handleGenerateMnemonic}>
                Generate New Mnemonic
              </Button>
            </>
          ) : (
            <>
              <Alert icon={<IconKey size={16} />} color="blue" title="Generated Mnemonic">
                <Code block style={{ wordBreak: 'break-word' }}>{generatedMnemonic}</Code>
              </Alert>
              <Alert color="orange">
                <Text size="sm">Write down this mnemonic and store it securely. It will not be shown again.</Text>
              </Alert>
            </>
          )}

          <TextInput
            label="Wallet Label"
            placeholder="e.g., My Custom Wallet"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />

          <Checkbox
            label="Set as active wallet"
            checked={setAsActive}
            onChange={(e) => setSetAsActive(e.currentTarget.checked)}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeAddWallet}>Cancel</Button>
            <Button onClick={handleAddWallet}>Add Wallet</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Encryption/Unlock Modal */}
      <Modal opened={encryptionOpened} onClose={closeEncryption} title={walletStatus?.isLocked ? 'Unlock Wallet' : 'Enable Encryption'}>
        <Stack gap="md">
          {walletStatus?.isLocked ? (
            <>
              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Group justify="flex-end">
                <Button variant="light" onClick={closeEncryption}>Cancel</Button>
                <Button onClick={handleUnlock}>Unlock</Button>
              </Group>
            </>
          ) : (
            <>
              <PasswordInput
                label="Password"
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Group justify="flex-end">
                <Button variant="light" onClick={closeEncryption}>Cancel</Button>
                <Button onClick={handleEnableEncryption}>Enable Encryption</Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

      {/* Change Password Modal */}
      <Modal opened={changePasswordOpened} onClose={closeChangePassword} title="Change Encryption Password">
        <Stack gap="md">
          <PasswordInput
            label="Current Password"
            placeholder="Enter current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <PasswordInput
            label="New Password"
            placeholder="Enter new password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeChangePassword}>Cancel</Button>
            <Button onClick={handleDisableEncryption}>Change Password</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Show Mnemonic Modal */}
      <Modal opened={showMnemonicOpened} onClose={() => {
        closeShowMnemonic();
        setVisibleMnemonic('');
        setShowMnemonicConfirmed(false);
      }} title="Show Mnemonic">
        <Stack gap="md">
          {!visibleMnemonic ? (
            <>
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                Never share your mnemonic with anyone. Anyone with access to this can control your wallet.
              </Alert>
              <Checkbox
                label="I understand the risks"
                checked={showMnemonicConfirmed}
                onChange={(e) => setShowMnemonicConfirmed(e.currentTarget.checked)}
              />
              <Group justify="flex-end">
                <Button variant="light" onClick={closeShowMnemonic}>Cancel</Button>
                <Button color="red" disabled={!showMnemonicConfirmed} onClick={handleShowMnemonic}>
                  Reveal Mnemonic
                </Button>
              </Group>
            </>
          ) : (
            <>
              <Code block style={{ wordBreak: 'break-word' }}>{visibleMnemonic}</Code>
              <CopyButton value={visibleMnemonic}>
                {({ copied, copy }) => (
                  <Button fullWidth variant="light" color={copied ? 'green' : 'blue'} onClick={copy}>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                )}
              </CopyButton>
            </>
          )}
        </Stack>
      </Modal>

      {/* Show Private Key Modal */}
      <Modal opened={showPrivateKeyOpened} onClose={() => {
        closeShowPrivateKey();
        setVisiblePrivateKey('');
        setPrivateKeyConfirmed(false);
      }} title="Show Private Key">
        <Stack gap="md">
          {!visiblePrivateKey ? (
            <>
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                Never share your private key. It grants full control over this account.
              </Alert>
              <Text size="sm">Account #{selectedAccountIndex} on {selectedNetwork}</Text>
              <Checkbox
                label="I understand the risks"
                checked={privateKeyConfirmed}
                onChange={(e) => setPrivateKeyConfirmed(e.currentTarget.checked)}
              />
              <Group justify="flex-end">
                <Button variant="light" onClick={closeShowPrivateKey}>Cancel</Button>
                <Button color="red" disabled={!privateKeyConfirmed} onClick={handleShowPrivateKey}>
                  Reveal Private Key
                </Button>
              </Group>
            </>
          ) : (
            <>
              <Code block style={{ wordBreak: 'break-all' }}>{visiblePrivateKey}</Code>
              <CopyButton value={visiblePrivateKey}>
                {({ copied, copy }) => (
                  <Button fullWidth variant="light" color={copied ? 'green' : 'blue'} onClick={copy}>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                )}
              </CopyButton>
            </>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}
