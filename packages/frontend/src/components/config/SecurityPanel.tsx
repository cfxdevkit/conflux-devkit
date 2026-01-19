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
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconLock,
  IconLockOpen,
  IconShield,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { useWalletStore } from '@/stores/walletStore';

export function SecurityPanel() {
  const { isLocked, isEncrypted, fetchWallets } = useWalletStore();
  const [isTestMnemonic, setIsTestMnemonic] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enable encryption modal
  const [enableModalOpened, { open: openEnableModal, close: closeEnableModal }] = useDisclosure(false);
  const [enablePassword, setEnablePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);

  // Unlock modal
  const [unlockModalOpened, { open: openUnlockModal, close: closeUnlockModal }] = useDisclosure(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const status = await apiClient.getWalletStatus();
        setIsTestMnemonic(status.isTestMnemonic);
      } catch (error) {
        console.error('Failed to fetch wallet status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleEnableEncryption = async () => {
    if (!enablePassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a password',
        color: 'red',
      });
      return;
    }

    if (enablePassword !== confirmPassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'Passwords do not match',
        color: 'red',
      });
      return;
    }

    if (enablePassword.length < 8) {
      notifications.show({
        title: 'Validation Error',
        message: 'Password must be at least 8 characters',
        color: 'red',
      });
      return;
    }

    setIsEnabling(true);
    try {
      await apiClient.enableEncryption(enablePassword);
      notifications.show({
        title: 'Encryption Enabled',
        message: 'Your keystore is now encrypted. Remember your password!',
        color: 'green',
      });
      setEnablePassword('');
      setConfirmPassword('');
      closeEnableModal();
      fetchWallets(); // Refresh encryption status
    } catch (error: any) {
      notifications.show({
        title: 'Enable Failed',
        message: error.response?.data?.message || error.message || 'Failed to enable encryption',
        color: 'red',
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockPassword) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter your password',
        color: 'red',
      });
      return;
    }

    setIsUnlocking(true);
    try {
      await apiClient.unlockWallet(unlockPassword);
      notifications.show({
        title: 'Keystore Unlocked',
        message: 'You can now access all wallet features',
        color: 'green',
      });
      setUnlockPassword('');
      closeUnlockModal();
      fetchWallets(); // Refresh lock status
    } catch (error: any) {
      notifications.show({
        title: 'Unlock Failed',
        message: error.response?.data?.message || error.message || 'Incorrect password',
        color: 'red',
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  if (isLoading) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading security settings...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Enable Encryption Modal */}
      <Modal opened={enableModalOpened} onClose={closeEnableModal} title="Enable Encryption" centered>
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="yellow">
            Once enabled, you&apos;ll need this password to unlock the keystore after restarts.
            <strong> This cannot be disabled.</strong>
          </Alert>

          <PasswordInput
            label="Password"
            placeholder="Enter a strong password"
            description="Minimum 8 characters"
            value={enablePassword}
            onChange={(e) => setEnablePassword(e.target.value)}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword && enablePassword !== confirmPassword ? 'Passwords do not match' : null}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeEnableModal}>
              Cancel
            </Button>
            <Button
              onClick={handleEnableEncryption}
              loading={isEnabling}
              leftSection={<IconShieldCheck size={16} />}
            >
              Enable Encryption
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Unlock Modal */}
      <Modal opened={unlockModalOpened} onClose={closeUnlockModal} title="Unlock Keystore" centered>
        <Stack gap="md">
          <PasswordInput
            label="Password"
            placeholder="Enter your keystore password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeUnlockModal}>
              Cancel
            </Button>
            <Button onClick={handleUnlock} loading={isUnlocking} leftSection={<IconLockOpen size={16} />}>
              Unlock
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Test Mnemonic Warning */}
      {isTestMnemonic === true && (
        <Alert icon={<IconAlertCircle size={16} />} color="orange" title="Using Test Mnemonic">
          Your keystore is using a well-known test mnemonic. This is fine for development, but consider
          using a custom mnemonic for sensitive testing or pre-production environments.
        </Alert>
      )}

      {/* Encryption Status */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconShield size={20} />
              <Title order={5}>Keystore Encryption</Title>
            </Group>
            <Badge color={isEncrypted ? 'green' : 'gray'} variant="filled">
              {isEncrypted ? 'Enabled' : 'Disabled'}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed">
            {isEncrypted
              ? 'Your keystore is encrypted. Sensitive data (mnemonics, private keys) are protected at rest.'
              : 'Your keystore is not encrypted. Consider enabling encryption to protect sensitive data.'}
          </Text>

          {!isEncrypted && (
            <Button
              variant="light"
              color="green"
              onClick={openEnableModal}
              leftSection={<IconShieldCheck size={16} />}
            >
              Enable Encryption
            </Button>
          )}
        </Stack>
      </Card>

      {/* Lock Status (only if encrypted) */}
      {isEncrypted && (
        <Card withBorder padding="md" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                {isLocked ? <IconLock size={20} /> : <IconLockOpen size={20} />}
                <Title order={5}>Keystore Lock</Title>
              </Group>
              <Badge color={isLocked ? 'orange' : 'green'} variant="filled">
                {isLocked ? 'Locked' : 'Unlocked'}
              </Badge>
            </Group>

            <Text size="sm" c="dimmed">
              {isLocked
                ? 'The keystore is locked. Sensitive operations require unlocking.'
                : 'The keystore is unlocked. You have full access to all features.'}
            </Text>

            {isLocked && (
              <Button variant="light" onClick={openUnlockModal} leftSection={<IconLockOpen size={16} />}>
                Unlock Keystore
              </Button>
            )}
          </Stack>
        </Card>
      )}

      {/* Session Info */}
      <Card withBorder padding="md" radius="md">
        <Stack gap="md">
          <Group gap="xs">
            <IconShieldCheck size={20} />
            <Title order={5}>Session Security</Title>
          </Group>

          <Text size="sm" c="dimmed">
            Your session is authenticated via cryptographic signature verification. Admin access is
            determined by the addresses configured in your keystore.
          </Text>

          <Divider />

          <Group justify="space-between">
            <Text size="sm">Session Token</Text>
            <Badge color="green" variant="light">
              {localStorage.getItem('sessionId') ? 'Active' : 'None'}
            </Badge>
          </Group>

          <Group justify="space-between">
            <Text size="sm">Authentication Method</Text>
            <Badge color="blue" variant="light">
              Wallet Signature
            </Badge>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
