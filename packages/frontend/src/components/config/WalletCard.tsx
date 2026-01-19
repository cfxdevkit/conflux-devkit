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
  ActionIcon,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconSettings,
  IconTrash,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { useDevNodeStore } from '@/stores/devnodeStore';
import type { WalletEntry } from '@/stores/walletStore';

interface WalletCardProps {
  wallet: WalletEntry;
  onDelete: () => void;
  onSwitch: () => void;
  onUpdate: () => void;
}

export function WalletCard({ wallet, onDelete, onSwitch, onUpdate }: WalletCardProps) {
  const { status } = useDevNodeStore();
  const isNodeRunning = status?.isRunning ?? false;

  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Config form state
  const [canModify, setCanModify] = useState(true);
  const [modificationReason, setModificationReason] = useState<string | null>(null);
  const [accountsCount, setAccountsCount] = useState(wallet.nodeConfig?.accountsCount || 10);
  const [chainId, setChainId] = useState(wallet.nodeConfig?.chainId || 2029);
  const [evmChainId, setEvmChainId] = useState(wallet.nodeConfig?.evmChainId || 2030);
  const [miningAuthor, setMiningAuthor] = useState(wallet.nodeConfig?.miningAuthor || '');

  // Load modification status when config modal opens
  useEffect(() => {
    if (configModalOpened) {
      apiClient
        .getWalletNodeConfig(wallet.id)
        .then((data) => {
          setCanModify(data.canModify);
          setModificationReason(data.modificationInfo?.reason || null);
          if (data.config) {
            setAccountsCount(data.config.accountsCount);
            setChainId(data.config.chainId);
            setEvmChainId(data.config.evmChainId);
            setMiningAuthor(data.config.miningAuthor || '');
          }
        })
        .catch((err) => {
          console.error('Failed to load wallet config:', err);
        });
    }
  }, [configModalOpened, wallet.id]);

  const handleDelete = async (deleteData: boolean) => {
    setIsDeleting(true);
    try {
      await apiClient.deleteWalletV2(wallet.id, deleteData);
      notifications.show({
        title: 'Wallet Deleted',
        message: deleteData ? 'Wallet and data deleted' : 'Wallet deleted (data preserved)',
        color: 'green',
      });
      closeDeleteModal();
      onDelete();
    } catch (error: any) {
      notifications.show({
        title: 'Delete Failed',
        message: error.response?.data?.message || error.message || 'Failed to delete wallet',
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await apiClient.updateWalletNodeConfig(wallet.id, {
        accountsCount,
        chainId,
        evmChainId,
        miningAuthor: miningAuthor || undefined,
      });
      notifications.show({
        title: 'Configuration Saved',
        message: 'Node configuration updated successfully',
        color: 'green',
      });
      closeConfigModal();
      onUpdate();
    } catch (error: any) {
      notifications.show({
        title: 'Save Failed',
        message: error.response?.data?.message || error.message || 'Failed to save configuration',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
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

  return (
    <>
      {/* Config Modal */}
      <Modal opened={configModalOpened} onClose={closeConfigModal} title="Node Configuration" size="md">
        <Stack gap="md">
          {!canModify && (
            <Text size="sm" c="orange" fw={500}>
              {modificationReason || 'Configuration is locked because blockchain data exists.'}
            </Text>
          )}

          <NumberInput
            label="Genesis Accounts"
            description="Number of pre-funded accounts (1-20)"
            value={accountsCount}
            onChange={(val) => setAccountsCount(Number(val) || 10)}
            min={1}
            max={20}
            disabled={!canModify}
          />

          <Group grow>
            <NumberInput
              label="Core Chain ID"
              value={chainId}
              onChange={(val) => setChainId(Number(val) || 2029)}
              min={1}
              disabled={!canModify}
            />
            <NumberInput
              label="eSpace Chain ID"
              value={evmChainId}
              onChange={(val) => setEvmChainId(Number(val) || 2030)}
              min={1}
              disabled={!canModify}
            />
          </Group>

          <TextInput
            label="Mining Author (Optional)"
            description="Core address to receive mining rewards"
            placeholder="net2029:aa..."
            value={miningAuthor}
            onChange={(e) => setMiningAuthor(e.target.value)}
            disabled={!canModify}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeConfigModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} loading={isSaving} disabled={!canModify}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Delete Wallet" centered>
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete &quot;{wallet.label}&quot;?
          </Text>

          <Group grow>
            <Button
              variant="light"
              color="orange"
              onClick={() => handleDelete(false)}
              loading={isDeleting}
              leftSection={<IconTrash size={16} />}
            >
              Keep Data
            </Button>
            <Button
              variant="light"
              color="red"
              onClick={() => handleDelete(true)}
              loading={isDeleting}
              leftSection={<IconTrash size={16} />}
            >
              Delete All
            </Button>
          </Group>

          <Text size="xs" c="dimmed">
            <strong>Keep Data:</strong> Remove wallet but preserve blockchain data directory.
          </Text>
          <Text size="xs" c="dimmed">
            <strong>Delete All:</strong> Remove wallet and all associated blockchain data.
          </Text>
        </Stack>
      </Modal>

      {/* Card */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              {wallet.isActive ? (
                <IconCheck size={18} style={{ color: 'var(--mantine-color-green-6)' }} />
              ) : (
                <IconWallet size={18} />
              )}
              <Text fw={600}>{wallet.label}</Text>
              <Badge color={getTypeColor(wallet.type)} variant="light" size="sm">
                {wallet.type}
              </Badge>
              {wallet.isActive && (
                <Badge color="green" variant="filled" size="sm">
                  Active
                </Badge>
              )}
            </Group>
            <Group gap="xs">
              <Tooltip label="Edit Configuration">
                <ActionIcon variant="light" onClick={openConfigModal}>
                  <IconSettings size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={wallet.isActive ? 'Cannot delete active wallet' : 'Delete Wallet'}>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={openDeleteModal}
                  disabled={wallet.isActive || isNodeRunning}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Node Config Summary */}
          {wallet.nodeConfig && (
            <Group gap="md">
              <Group gap="xs">
                <IconUsers size={14} />
                <Text size="xs" c="dimmed">
                  {wallet.nodeConfig.accountsCount} accounts
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                |
              </Text>
              <Text size="xs" c="dimmed">
                Chains: <Code style={{ fontSize: '0.7rem' }}>{wallet.nodeConfig.chainId}/{wallet.nodeConfig.evmChainId}</Code>
              </Text>
            </Group>
          )}

          {/* Actions */}
          {!wallet.isActive && (
            <Button
              variant="light"
              size="xs"
              onClick={onSwitch}
              disabled={isNodeRunning}
              leftSection={<IconCheck size={14} />}
            >
              {isNodeRunning ? 'Stop node to switch' : 'Switch to this wallet'}
            </Button>
          )}
        </Stack>
      </Card>
    </>
  );
}
