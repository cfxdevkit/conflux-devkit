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

import { Alert, Button, Card, Collapse, Loader, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconPlus, IconWallet } from '@tabler/icons-react';
import { useEffect } from 'react';
import { AddWalletForm } from '@/components/config/AddWalletForm';
import { WalletCard } from '@/components/config/WalletCard';
import { useDevNodeStore } from '@/stores/devnodeStore';
import { useWalletStore } from '@/stores/walletStore';

export function WalletsPanel() {
  const { wallets, isLoading, isLocked, fetchWallets, switchWallet } = useWalletStore();
  const { status } = useDevNodeStore();
  const [addFormOpened, { open: openAddForm, close: closeAddForm }] = useDisclosure(false);

  const isNodeRunning = status?.isRunning ?? false;

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleSwitch = async (walletId: string) => {
    try {
      await switchWallet(walletId);
      notifications.show({
        title: 'Wallet Switched',
        message: 'Active wallet changed successfully',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Switch Failed',
        message: error.response?.data?.message || error.message || 'Failed to switch wallet',
        color: 'red',
      });
    }
  };

  const handleAddSuccess = () => {
    closeAddForm();
    fetchWallets();
  };

  if (isLoading) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading wallets...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Warnings */}
      {isNodeRunning && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="Node Running">
          Stop the node before adding, deleting, or switching wallets.
        </Alert>
      )}

      {isLocked && (
        <Alert icon={<IconAlertCircle size={16} />} color="orange" title="Keystore Locked">
          Unlock the keystore to manage wallets.
        </Alert>
      )}

      {/* Wallet List */}
      {wallets.length === 0 ? (
        <Card withBorder padding="xl">
          <Stack align="center" gap="md">
            <IconWallet size={48} stroke={1.5} color="gray" />
            <Text c="dimmed">No wallets configured</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={openAddForm}>
              Add Your First Wallet
            </Button>
          </Stack>
        </Card>
      ) : (
        <>
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onDelete={fetchWallets}
              onSwitch={() => handleSwitch(wallet.id)}
              onUpdate={fetchWallets}
            />
          ))}

          {/* Add Wallet Button */}
          <Collapse in={!addFormOpened}>
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={openAddForm}
              disabled={isNodeRunning || isLocked}
              fullWidth
            >
              Add New Wallet
            </Button>
          </Collapse>
        </>
      )}

      {/* Add Wallet Form */}
      <Collapse in={addFormOpened}>
        <Card withBorder padding="md">
          <AddWalletForm onSuccess={handleAddSuccess} onCancel={closeAddForm} />
        </Card>
      </Collapse>
    </Stack>
  );
}
