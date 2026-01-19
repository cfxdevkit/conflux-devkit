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
  Alert,
  Badge,
  Button,
  Card,
  Code,
  CopyButton,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconCopy,
  IconPlus,
  IconShieldCheck,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';

interface AdminInfo {
  address: string;
  isCurrent: boolean;
}

export function AdminsPanel() {
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [newAddress, setNewAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdminList();
      setAdmins(
        data.admins.map((address) => ({
          address,
          isCurrent: address.toLowerCase() === data.currentAdmin?.toLowerCase(),
        }))
      );
    } catch (error: any) {
      console.error('Failed to fetch admins:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load admin list',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAdd = async () => {
    if (!newAddress.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter an address',
        color: 'red',
      });
      return;
    }

    // Basic validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
      notifications.show({
        title: 'Validation Error',
        message: 'Invalid address format. Must be a 0x... hex address.',
        color: 'red',
      });
      return;
    }

    setIsAdding(true);
    try {
      await apiClient.addAdmin(newAddress.trim());
      notifications.show({
        title: 'Admin Added',
        message: `Successfully added ${newAddress.slice(0, 10)}... as admin`,
        color: 'green',
      });
      setNewAddress('');
      closeAddModal();
      fetchAdmins();
    } catch (error: any) {
      notifications.show({
        title: 'Add Failed',
        message: error.response?.data?.message || error.message || 'Failed to add admin',
        color: 'red',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (address: string) => {
    setDeletingAddress(address);
    try {
      await apiClient.removeAdmin(address);
      notifications.show({
        title: 'Admin Removed',
        message: `Successfully removed ${address.slice(0, 10)}... as admin`,
        color: 'green',
      });
      fetchAdmins();
    } catch (error: any) {
      notifications.show({
        title: 'Remove Failed',
        message: error.response?.data?.message || error.message || 'Failed to remove admin',
        color: 'red',
      });
    } finally {
      setDeletingAddress(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading admins...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Add Admin Modal */}
      <Modal opened={addModalOpened} onClose={closeAddModal} title="Add Admin" centered>
        <Stack gap="md">
          <TextInput
            label="Admin Address"
            placeholder="0x..."
            description="Enter the Ethereum/eSpace address to grant admin access"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            leftSection={<IconUser size={16} />}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button onClick={handleAdd} loading={isAdding} leftSection={<IconPlus size={16} />}>
              Add Admin
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Info Alert */}
      <Alert icon={<IconShieldCheck size={16} />} color="blue" title="Admin Access">
        Admin users can control the development node, manage wallets, and modify configuration settings.
        Only add addresses you trust.
      </Alert>

      {/* Admin List */}
      <Stack gap="sm">
        {admins.map((admin) => (
          <Card key={admin.address} withBorder padding="sm" radius="md">
            <Group justify="space-between">
              <Group gap="sm">
                <IconUser size={18} />
                <Tooltip label={admin.address} position="top">
                  <Code style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    {formatAddress(admin.address)}
                  </Code>
                </Tooltip>
                <CopyButton value={admin.address} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy address'}>
                      <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy} size="sm">
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
                {admin.isCurrent && (
                  <Badge color="green" variant="filled" size="sm">
                    You
                  </Badge>
                )}
              </Group>
              <Tooltip
                label={
                  admin.isCurrent
                    ? 'Cannot remove yourself'
                    : admins.length === 1
                      ? 'Cannot remove the last admin'
                      : 'Remove admin'
                }
              >
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => handleRemove(admin.address)}
                  loading={deletingAddress === admin.address}
                  disabled={admin.isCurrent || admins.length === 1}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>
        ))}

        {admins.length === 0 && (
          <Card withBorder padding="xl">
            <Stack align="center" gap="md">
              <IconShieldCheck size={48} stroke={1.5} color="gray" />
              <Text c="dimmed">No admins configured</Text>
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Add Button */}
      <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openAddModal}>
        Add Admin
      </Button>
    </Stack>
  );
}
