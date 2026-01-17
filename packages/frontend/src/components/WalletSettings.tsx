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
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Code,
    CopyButton,
    Group,
    Modal,
    SegmentedControl,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Textarea,
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
    IconPlus,
    IconRefresh,
    IconTrash,
    IconWallet,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

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
}

export function WalletSettings() {
  // Keystore state
  const [entries, setEntries] = useState<KeystoreEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeLabel, setActiveLabel] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Data directory state
  const [activeDataDir, setActiveDataDir] = useState<string>('');
  // walletDataDirs available for future use (e.g., showing all wallet paths)

  // Derived accounts state
  const [derivedAccounts, setDerivedAccounts] = useState<DerivedAccount[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<'core' | 'espace'>('espace');
  const [accountCount, setAccountCount] = useState(5);

  // Modal states
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [mnemonicModalOpened, { open: openMnemonicModal, close: closeMnemonicModal }] = useDisclosure(false);
  const [privateKeyModalOpened, { open: openPrivateKeyModal, close: closePrivateKeyModal }] = useDisclosure(false);

  // Add mnemonic form state
  const [newMnemonic, setNewMnemonic] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [setAsActive, setSetAsActive] = useState(false);
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Show mnemonic state
  const [showMnemonicConfirmed, setShowMnemonicConfirmed] = useState(false);
  const [visibleMnemonic, setVisibleMnemonic] = useState<string | null>(null);

  // Private key state
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number | null>(null);
  const [privateKeyConfirmed, setPrivateKeyConfirmed] = useState(false);
  const [visiblePrivateKey, setVisiblePrivateKey] = useState<string | null>(null);

  // Fetch keystore entries
  const fetchKeystore = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getKeystoreEntries();
      setEntries(data.entries);
      setActiveIndex(data.activeIndex);
      setActiveLabel(data.activeLabel);
      
      // Also fetch data directories
      try {
        const dataDirs = await apiClient.getWalletDataDirs();
        setActiveDataDir(dataDirs.activeDataDir);
        // dataDirs.wallets available if we want to show all paths
      } catch {
        console.warn('Failed to fetch data directories');
      }
    } catch (error) {
      console.error('Failed to fetch keystore:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load wallet entries',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch derived accounts
  const fetchDerivedAccounts = useCallback(async () => {
    try {
      const data = await apiClient.deriveAccounts(selectedNetwork, accountCount);
      setDerivedAccounts(data.accounts);
    } catch (error) {
      console.error('Failed to derive accounts:', error);
    }
  }, [selectedNetwork, accountCount]);

  useEffect(() => {
    fetchKeystore();
  }, [fetchKeystore]);

  useEffect(() => {
    fetchDerivedAccounts();
  }, [fetchDerivedAccounts, activeIndex]);

  // Generate new mnemonic
  const handleGenerateMnemonic = async () => {
    try {
      setIsGenerating(true);
      const data = await apiClient.generateMnemonic();
      setGeneratedMnemonic(data.mnemonic);
      setNewMnemonic(data.mnemonic);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to generate mnemonic',
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add new mnemonic
  const handleAddMnemonic = async () => {
    try {
      const data = await apiClient.addMnemonic({
        mnemonic: newMnemonic || undefined,
        label: newLabel || undefined,
        setActive: setAsActive,
        generate: !newMnemonic,
      });

      notifications.show({
        title: 'Success',
        message: data.message,
        color: 'green',
      });

      // Reset form and close modal
      setNewMnemonic('');
      setNewLabel('');
      setSetAsActive(false);
      setGeneratedMnemonic('');
      closeAddModal();

      // If a new mnemonic was generated, show it to the user
      if (data.mnemonic) {
        setVisibleMnemonic(data.mnemonic);
        openMnemonicModal();
      }

      // Refresh keystore
      await fetchKeystore();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add mnemonic',
        color: 'red',
      });
    }
  };

  // Delete mnemonic
  const handleDeleteMnemonic = async (index: number) => {
    if (index === 0) {
      notifications.show({
        title: 'Cannot Delete',
        message: 'The default wallet cannot be deleted',
        color: 'yellow',
      });
      return;
    }

    try {
      await apiClient.deleteMnemonic(index);
      notifications.show({
        title: 'Deleted',
        message: 'Wallet removed successfully',
        color: 'green',
      });
      await fetchKeystore();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete wallet',
        color: 'red',
      });
    }
  };

  // Select active mnemonic
  const handleSelectMnemonic = async (index: number) => {
    try {
      await apiClient.selectMnemonic(index);
      setActiveIndex(index);
      notifications.show({
        title: 'Wallet Selected',
        message: `Switched to wallet ${index}`,
        color: 'green',
      });
      await fetchKeystore();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to select wallet',
        color: 'red',
      });
    }
  };

  // Show active mnemonic
  const handleShowMnemonic = async () => {
    if (!showMnemonicConfirmed) {
      return;
    }

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

  // Show private key
  const handleShowPrivateKey = async () => {
    if (!privateKeyConfirmed || selectedAccountIndex === null) {
      return;
    }

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

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <Stack gap="lg">
      {/* Wallet Management Section */}
      <Card withBorder padding="lg" radius="md">
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="blue">
                <IconWallet size={18} />
              </ThemeIcon>
              <Title order={4}>Wallet Management</Title>
              <Badge color="blue" variant="light">
                {entries.length} wallet{entries.length !== 1 ? 's' : ''}
              </Badge>
            </Group>
            <Group gap="xs">
              <Button
                size="xs"
                leftSection={<IconRefresh size={14} />}
                variant="light"
                onClick={fetchKeystore}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={openAddModal}
              >
                Add Wallet
              </Button>
            </Group>
          </Group>
        </Card.Section>

        <Table striped highlightOnHover mt="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Index</Table.Th>
              <Table.Th>Label</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map((entry) => (
              <Table.Tr key={entry.index}>
                <Table.Td>
                  <Text fw={500}>#{entry.index}</Text>
                </Table.Td>
                <Table.Td>{entry.label}</Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="light">
                    {entry.type}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {entry.isActive ? (
                    <Badge color="green" variant="filled" size="sm">
                      Active
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="light" size="sm">
                      Inactive
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {!entry.isActive && (
                      <Tooltip label="Set as active">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="sm"
                          onClick={() => handleSelectMnemonic(entry.index)}
                        >
                          <IconCheck size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {entry.isActive && (
                      <Tooltip label="Show mnemonic">
                        <ActionIcon
                          variant="light"
                          color="orange"
                          size="sm"
                          onClick={() => {
                            setShowMnemonicConfirmed(false);
                            setVisibleMnemonic(null);
                            openMnemonicModal();
                          }}
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {entry.index !== 0 && (
                      <Tooltip label="Delete wallet">
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="sm"
                          onClick={() => handleDeleteMnemonic(entry.index)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {/* Data Directory Info */}
        {activeDataDir && (
          <Box mt="md" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text size="sm" c="dimmed">Active Wallet Data Directory</Text>
                <Code>{activeDataDir}</Code>
              </Stack>
              <CopyButton value={activeDataDir}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy path'}>
                    <ActionIcon variant="light" color={copied ? 'teal' : 'gray'} onClick={copy}>
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              Each wallet uses an isolated data directory. Switching wallets will use a different blockchain state.
            </Text>
          </Box>
        )}
      </Card>

      {/* Derived Accounts Section */}
      <Card withBorder padding="lg" radius="md">
        <Card.Section withBorder inheritPadding py="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="green">
                <IconKey size={18} />
              </ThemeIcon>
              <Title order={4}>Derived Accounts</Title>
              <Badge color="green" variant="light">
                {activeLabel}
              </Badge>
            </Group>
            <Group gap="xs">
              <SegmentedControl
                size="xs"
                value={selectedNetwork}
                onChange={(value) => setSelectedNetwork(value as 'core' | 'espace')}
                data={[
                  { label: 'eSpace', value: 'espace' },
                  { label: 'Core', value: 'core' },
                ]}
              />
              <Select
                size="xs"
                w={80}
                value={String(accountCount)}
                onChange={(value) => setAccountCount(Number(value))}
                data={['5', '10', '20']}
              />
            </Group>
          </Group>
        </Card.Section>

        <Table striped highlightOnHover mt="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Index</Table.Th>
              <Table.Th>Address</Table.Th>
              <Table.Th>Derivation Path</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {derivedAccounts.map((account) => (
              <Table.Tr key={account.index}>
                <Table.Td>
                  <Text fw={500}>#{account.index}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Code>{formatAddress(account.address)}</Code>
                    <CopyButton value={account.address}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={copied ? 'green' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="xs"><Code>{account.path}</Code></Text>
                </Table.Td>
                <Table.Td>
                  <Tooltip label="Show private key">
                    <ActionIcon
                      variant="light"
                      color="orange"
                      size="sm"
                      onClick={() => {
                        setSelectedAccountIndex(account.index);
                        setPrivateKeyConfirmed(false);
                        setVisiblePrivateKey(null);
                        openPrivateKeyModal();
                      }}
                    >
                      <IconKey size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Add Wallet Modal */}
      <Modal opened={addModalOpened} onClose={closeAddModal} title="Add Wallet" size="lg">
        <Stack gap="md">
          <TextInput
            label="Wallet Label"
            placeholder="My Wallet"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />

          <Textarea
            label="Mnemonic Phrase"
            placeholder="Enter your 12 or 24 word mnemonic, or generate a new one"
            value={newMnemonic}
            onChange={(e) => setNewMnemonic(e.target.value)}
            minRows={3}
          />

          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleGenerateMnemonic}
            loading={isGenerating}
          >
            Generate New Mnemonic
          </Button>

          {generatedMnemonic && (
            <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Generated Mnemonic (save this securely):
                </Text>
                <Code block>{generatedMnemonic}</Code>
              </Stack>
            </Alert>
          )}

          <Checkbox
            label="Set as active wallet"
            checked={setAsActive}
            onChange={(e) => setSetAsActive(e.currentTarget.checked)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button onClick={handleAddMnemonic} disabled={!newMnemonic && !generatedMnemonic}>
              Add Wallet
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Show Mnemonic Modal */}
      <Modal opened={mnemonicModalOpened} onClose={closeMnemonicModal} title="Mnemonic Phrase" size="lg">
        <Stack gap="md">
          {!visibleMnemonic ? (
            <>
              <Alert color="red" icon={<IconAlertCircle size={16} />}>
                <Text size="sm">
                  Your mnemonic phrase is the master key to your wallet. Never share it with anyone.
                  Anyone with access to this phrase can control your funds.
                </Text>
              </Alert>

              <Checkbox
                label="I understand the risks and want to reveal my mnemonic"
                checked={showMnemonicConfirmed}
                onChange={(e) => setShowMnemonicConfirmed(e.currentTarget.checked)}
              />

              <Button
                color="red"
                disabled={!showMnemonicConfirmed}
                onClick={handleShowMnemonic}
                leftSection={<IconEye size={16} />}
              >
                Reveal Mnemonic
              </Button>
            </>
          ) : (
            <>
              <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                <Text size="sm" fw={500}>
                  Write down these words and store them securely.
                </Text>
              </Alert>

              <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-4)', borderRadius: '8px' }}>
                <Code block style={{ wordBreak: 'break-word' }}>
                  {visibleMnemonic}
                </Code>
              </Box>

              <CopyButton value={visibleMnemonic}>
                {({ copied, copy }) => (
                  <Button
                    variant="light"
                    color={copied ? 'green' : 'blue'}
                    onClick={copy}
                    leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  >
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                )}
              </CopyButton>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => {
              setVisibleMnemonic(null);
              setShowMnemonicConfirmed(false);
              closeMnemonicModal();
            }}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Show Private Key Modal */}
      <Modal opened={privateKeyModalOpened} onClose={closePrivateKeyModal} title="Private Key" size="lg">
        <Stack gap="md">
          {!visiblePrivateKey ? (
            <>
              <Alert color="red" icon={<IconAlertCircle size={16} />}>
                <Text size="sm">
                  Your private key grants full control over this account. Never share it with anyone
                  or enter it on suspicious websites.
                </Text>
              </Alert>

              <Text size="sm">
                Account Index: <strong>#{selectedAccountIndex}</strong>
              </Text>
              <Text size="sm">
                Network: <strong>{selectedNetwork}</strong>
              </Text>

              <Checkbox
                label="I understand the risks and want to reveal my private key"
                checked={privateKeyConfirmed}
                onChange={(e) => setPrivateKeyConfirmed(e.currentTarget.checked)}
              />

              <Button
                color="red"
                disabled={!privateKeyConfirmed}
                onClick={handleShowPrivateKey}
                leftSection={<IconKey size={16} />}
              >
                Reveal Private Key
              </Button>
            </>
          ) : (
            <>
              <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                <Text size="sm" fw={500}>
                  Store this private key securely. It will not be shown again.
                </Text>
              </Alert>

              <Box p="md" style={{ border: '1px solid var(--mantine-color-gray-4)', borderRadius: '8px' }}>
                <Code block style={{ wordBreak: 'break-all' }}>
                  {visiblePrivateKey}
                </Code>
              </Box>

              <CopyButton value={visiblePrivateKey}>
                {({ copied, copy }) => (
                  <Button
                    variant="light"
                    color={copied ? 'green' : 'blue'}
                    onClick={copy}
                    leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  >
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                )}
              </CopyButton>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => {
              setVisiblePrivateKey(null);
              setPrivateKeyConfirmed(false);
              closePrivateKeyModal();
            }}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
