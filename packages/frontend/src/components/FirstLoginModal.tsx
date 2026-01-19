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

import { Alert, Button, Group, Modal, PasswordInput, Stack, Text, Textarea } from '@mantine/core';
import { IconAlertTriangle, IconKey, IconLock, IconPlus, IconRefresh } from '@tabler/icons-react';
import { useState } from 'react';

interface FirstLoginModalProps {
  opened: boolean;
  onClose: () => void;
  onContinue: () => void;
  onSetMnemonic: (mnemonic: string) => Promise<void>;
  onGenerateMnemonic: () => Promise<string>;
  onEnableEncryption: (password: string) => Promise<void>;
}

type SetupMode = 'warning' | 'custom' | 'generate' | 'encrypt';

export function FirstLoginModal({
  opened,
  onClose,
  onContinue,
  onSetMnemonic,
  onGenerateMnemonic,
  onEnableEncryption,
}: FirstLoginModalProps) {
  const [mode, setMode] = useState<SetupMode>('warning');
  const [customMnemonic, setCustomMnemonic] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = () => {
    // User accepts test mnemonic
    onContinue();
    onClose();
  };

  const handleSetCustom = async () => {
    setLoading(true);
    setError('');
    try {
      await onSetMnemonic(customMnemonic);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set mnemonic');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const mnemonic = await onGenerateMnemonic();
      setGeneratedMnemonic(mnemonic);
      setMode('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate mnemonic');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGenerated = async () => {
    setLoading(true);
    setError('');
    try {
      await onSetMnemonic(generatedMnemonic);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set mnemonic');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableEncryption = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onEnableEncryption(password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable encryption');
    } finally {
      setLoading(false);
    }
  };

  const renderWarning = () => (
    <Stack gap="md">
      <Alert icon={<IconAlertTriangle size={20} />} title="Test Mnemonic Detected" color="yellow">
        <Text size="sm">
          You are using the default test mnemonic. This is insecure and should only be used for
          development.
        </Text>
        <Text size="sm" mt="xs">
          The test mnemonic is publicly known and should never be used with real funds.
        </Text>
      </Alert>

      <Text size="sm" c="dimmed">
        Choose one of the following options:
      </Text>

      <Stack gap="xs">
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={() => setMode('custom')}
          fullWidth
        >
          Set Custom Mnemonic
        </Button>

        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          onClick={handleGenerate}
          loading={loading}
          fullWidth
        >
          Generate New Mnemonic
        </Button>

        <Button
          leftSection={<IconLock size={16} />}
          variant="light"
          onClick={() => setMode('encrypt')}
          fullWidth
        >
          Enable Encryption
        </Button>

        <Button variant="subtle" onClick={handleContinue} fullWidth>
          Continue with Test Mnemonic (Not Recommended)
        </Button>
      </Stack>

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}
    </Stack>
  );

  const renderCustomMnemonic = () => (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Enter your BIP-39 mnemonic phrase (12 or 24 words):
      </Text>

      <Textarea
        label="Mnemonic Phrase"
        placeholder="word1 word2 word3 ..."
        value={customMnemonic}
        onChange={(e) => setCustomMnemonic(e.target.value)}
        minRows={3}
        required
      />

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      <Group justify="flex-end" gap="xs">
        <Button variant="subtle" onClick={() => setMode('warning')}>
          Back
        </Button>
        <Button onClick={handleSetCustom} loading={loading} disabled={!customMnemonic.trim()}>
          Set Mnemonic
        </Button>
      </Group>
    </Stack>
  );

  const renderGeneratedMnemonic = () => (
    <Stack gap="md">
      <Alert icon={<IconKey size={20} />} title="Your New Mnemonic" color="blue">
        <Text size="sm" mb="xs">
          Write down this mnemonic phrase and store it in a safe place. You'll need it to recover
          your wallet.
        </Text>
        <Text
          size="sm"
          fw={600}
          p="xs"
          style={{
            backgroundColor: 'var(--mantine-color-gray-1)',
            borderRadius: '4px',
            fontFamily: 'monospace',
          }}
        >
          {generatedMnemonic}
        </Text>
      </Alert>

      <Alert color="orange" title="Important">
        <Text size="sm">
          Anyone with access to this mnemonic can control your wallet. Never share it with anyone.
        </Text>
      </Alert>

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      <Group justify="flex-end" gap="xs">
        <Button variant="subtle" onClick={() => setMode('warning')}>
          Cancel
        </Button>
        <Button onClick={handleConfirmGenerated} loading={loading}>
          I've Saved It - Use This Mnemonic
        </Button>
      </Group>
    </Stack>
  );

  const renderEncryption = () => (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Encrypt the current mnemonic with a password. You'll need this password to unlock your
        wallet after restart.
      </Text>

      <PasswordInput
        label="Password"
        placeholder="Enter password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <PasswordInput
        label="Confirm Password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      <Group justify="flex-end" gap="xs">
        <Button variant="subtle" onClick={() => setMode('warning')}>
          Back
        </Button>
        <Button
          onClick={handleEnableEncryption}
          loading={loading}
          disabled={!password || !confirmPassword}
        >
          Enable Encryption
        </Button>
      </Group>
    </Stack>
  );

  const getTitle = () => {
    switch (mode) {
      case 'warning':
        return '⚠️ Security Warning';
      case 'custom':
        return 'Set Custom Mnemonic';
      case 'generate':
        return 'New Mnemonic Generated';
      case 'encrypt':
        return 'Enable Encryption';
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getTitle()}
      size="lg"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      {mode === 'warning' && renderWarning()}
      {mode === 'custom' && renderCustomMnemonic()}
      {mode === 'generate' && renderGeneratedMnemonic()}
      {mode === 'encrypt' && renderEncryption()}
    </Modal>
  );
}
