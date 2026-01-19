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
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconPlus, IconRefresh, IconWallet } from '@tabler/icons-react';
import { useState } from 'react';
import { apiClient } from '@/services/api';

interface AddWalletFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddWalletForm({ onSuccess, onCancel }: AddWalletFormProps) {
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [label, setLabel] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [setAsActive, setSetAsActive] = useState(false);
  const [mnemonicError, setMnemonicError] = useState<string | null>(null);

  // Node config
  const [accountsCount, setAccountsCount] = useState(10);
  const [chainId, setChainId] = useState(2029);
  const [evmChainId, setEvmChainId] = useState(2030);
  const [miningAuthor, setMiningAuthor] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await apiClient.generateMnemonic();
      setGeneratedMnemonic(result.mnemonic);
      setMnemonic(result.mnemonic);
      setMnemonicError(null);
    } catch (error: any) {
      notifications.show({
        title: 'Generation Failed',
        message: error.message || 'Failed to generate mnemonic',
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidateMnemonic = async (value: string) => {
    setMnemonic(value);
    if (!value.trim()) {
      setMnemonicError(null);
      return;
    }

    try {
      const result = await apiClient.validateMnemonic(value.trim());
      if (result.valid) {
        setMnemonicError(null);
      } else {
        setMnemonicError(result.message || 'Invalid mnemonic phrase');
      }
    } catch (error: any) {
      setMnemonicError('Failed to validate mnemonic');
    }
  };

  const handleSubmit = async () => {
    if (!label.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a label for the wallet',
        color: 'red',
      });
      return;
    }

    const mnemonicToUse = mode === 'generate' ? generatedMnemonic : mnemonic;
    if (!mnemonicToUse.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: mode === 'generate' ? 'Please generate a mnemonic first' : 'Please enter a mnemonic',
        color: 'red',
      });
      return;
    }

    if (mnemonicError) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fix the mnemonic error before saving',
        color: 'red',
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.addWalletV2({
        mnemonic: mnemonicToUse.trim(),
        label: label.trim(),
        nodeConfig: {
          accountsCount,
          chainId,
          evmChainId,
          miningAuthor: miningAuthor.trim() || undefined,
        },
        setAsActive,
      });

      notifications.show({
        title: 'Wallet Added',
        message: `Successfully added wallet "${label}"`,
        color: 'green',
      });

      onSuccess();
    } catch (error: any) {
      notifications.show({
        title: 'Add Failed',
        message: error.response?.data?.message || error.message || 'Failed to add wallet',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <SegmentedControl
        value={mode}
        onChange={(val) => {
          setMode(val as 'generate' | 'import');
          setMnemonic('');
          setGeneratedMnemonic('');
          setMnemonicError(null);
        }}
        data={[
          { label: 'Generate New', value: 'generate' },
          { label: 'Import Existing', value: 'import' },
        ]}
        fullWidth
      />

      <TextInput
        label="Wallet Label"
        placeholder="My Development Wallet"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        leftSection={<IconWallet size={16} />}
      />

      {mode === 'generate' && (
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>
              Mnemonic Phrase
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconRefresh size={14} />}
              onClick={handleGenerate}
              loading={isGenerating}
            >
              Generate
            </Button>
          </Group>
          {generatedMnemonic ? (
            <Alert color="blue" title="Generated Mnemonic" icon={<IconAlertCircle size={16} />}>
              <Text ff="monospace" size="sm">
                {generatedMnemonic}
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                Store this mnemonic securely. It cannot be recovered if lost.
              </Text>
            </Alert>
          ) : (
            <Text size="sm" c="dimmed">
              Click &quot;Generate&quot; to create a new 12-word mnemonic phrase.
            </Text>
          )}
        </Stack>
      )}

      {mode === 'import' && (
        <Textarea
          label="Mnemonic Phrase"
          placeholder="Enter your 12 or 24 word mnemonic phrase..."
          value={mnemonic}
          onChange={(e) => handleValidateMnemonic(e.target.value)}
          error={mnemonicError}
          minRows={3}
          required
        />
      )}

      {/* Node Configuration */}
      <Text size="sm" fw={500} mt="md">
        Node Configuration
      </Text>

      <NumberInput
        label="Genesis Accounts"
        description="Number of pre-funded accounts to generate"
        value={accountsCount}
        onChange={(val) => setAccountsCount(Number(val) || 10)}
        min={1}
        max={20}
      />

      <Group grow>
        <NumberInput
          label="Core Chain ID"
          value={chainId}
          onChange={(val) => setChainId(Number(val) || 2029)}
          min={1}
        />
        <NumberInput
          label="eSpace Chain ID"
          value={evmChainId}
          onChange={(val) => setEvmChainId(Number(val) || 2030)}
          min={1}
        />
      </Group>

      <TextInput
        label="Mining Author (Optional)"
        description="Core address to receive mining rewards"
        placeholder="net2029:aa..."
        value={miningAuthor}
        onChange={(e) => setMiningAuthor(e.target.value)}
      />

      {/* Set as active toggle */}
      <Group gap="xs">
        <input
          type="checkbox"
          id="setAsActive"
          checked={setAsActive}
          onChange={(e) => setSetAsActive(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="setAsActive" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
          Set as active wallet after adding
        </label>
      </Group>

      {/* Actions */}
      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={isSaving} leftSection={<IconPlus size={16} />}>
          Add Wallet
        </Button>
      </Group>
    </Stack>
  );
}
