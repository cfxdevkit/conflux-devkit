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

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Container,
  CopyButton,
  Group,
  NumberInput,
  PasswordInput,
  Stack,
  Stepper,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  ActionIcon,
  Badge,
  Paper,
  Divider,
  List,
} from '@mantine/core';
import {
  IconWallet,
  IconSettings,
  IconLock,
  IconCheck,
  IconCopy,
  IconRefresh,
  IconAlertCircle,
  IconInfoCircle,
  IconShieldCheck,
} from '@tabler/icons-react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuthStore } from '@/stores/authStore';
import { useSetupStore } from '@/stores/setupStore';

export function SetupWizard() {
  const { address, isConnected } = useAccount();

  const {
    currentStep,
    formData,
    generatedMnemonic,
    validation,
    isLoading,
    isSubmitting,
    error,
    setCurrentStep,
    updateFormData,
    generateMnemonic,
    validateForm,
    completeSetup,
  } = useSetupStore();

  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  // Auto-fill admin address when wallet connects
  useEffect(() => {
    if (isConnected && address && !formData.adminAddress) {
      updateFormData({ adminAddress: address });
    }
  }, [isConnected, address, formData.adminAddress, updateFormData]);

  const handleGenerateMnemonic = async () => {
    try {
      await generateMnemonic();
      setShowMnemonic(true);
      setMnemonicConfirmed(false);
    } catch {
      // Error is handled in store
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 0) {
      // Validate wallet connection step
      if (!formData.adminAddress) {
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate mnemonic step
      if (!formData.mnemonic || !mnemonicConfirmed) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate config step - proceed to review
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Final validation and submit
      const result = await validateForm();
      if (result.valid) {
        const success = await completeSetup();
        if (success) {
          setCurrentStep(4); // Success step
        }
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.adminAddress;
      case 1:
        return !!formData.mnemonic && mnemonicConfirmed;
      case 2:
        return formData.accountsCount >= 1 && formData.accountsCount <= 20;
      case 3:
        return !formData.encryptionEnabled ||
          (formData.encryptionPassword.length >= 8 &&
           formData.encryptionPassword === formData.encryptionConfirm);
      default:
        return false;
    }
  };

  return (
    <Container size="md" py="xl">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="lg">
          <Group justify="center">
            <IconShieldCheck size={48} color="var(--mantine-color-blue-6)" />
          </Group>
          <Title order={2} ta="center">
            Conflux DevKit Setup
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            Configure your development environment in a few simple steps
          </Text>

          <Stepper active={currentStep} onStepClick={setCurrentStep} allowNextStepsSelect={false}>
            <Stepper.Step
              label="Connect Wallet"
              description="Admin address"
              icon={<IconWallet size={18} />}
            >
              <WalletStep
                address={formData.adminAddress}
                isConnected={isConnected}
                onAddressChange={(addr) => updateFormData({ adminAddress: addr })}
              />
            </Stepper.Step>

            <Stepper.Step
              label="Mnemonic"
              description="Recovery phrase"
              icon={<IconLock size={18} />}
            >
              <MnemonicStep
                mnemonic={formData.mnemonic}
                generatedMnemonic={generatedMnemonic}
                showMnemonic={showMnemonic}
                confirmed={mnemonicConfirmed}
                isLoading={isLoading}
                onGenerate={handleGenerateMnemonic}
                onMnemonicChange={(m) => updateFormData({ mnemonic: m })}
                onConfirmChange={setMnemonicConfirmed}
                onShowChange={setShowMnemonic}
                mnemonicLabel={formData.mnemonicLabel}
                onLabelChange={(label) => updateFormData({ mnemonicLabel: label })}
              />
            </Stepper.Step>

            <Stepper.Step
              label="Configuration"
              description="Node settings"
              icon={<IconSettings size={18} />}
            >
              <ConfigStep
                formData={formData}
                onUpdate={updateFormData}
              />
            </Stepper.Step>

            <Stepper.Step
              label="Security"
              description="Encryption (optional)"
              icon={<IconLock size={18} />}
            >
              <SecurityStep
                formData={formData}
                validation={validation}
                error={error}
                onUpdate={updateFormData}
              />
            </Stepper.Step>

            <Stepper.Completed>
              <CompletedStep />
            </Stepper.Completed>
          </Stepper>

          {currentStep < 4 && (
            <Group justify="space-between" mt="xl">
              <Button
                variant="default"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!canProceed() || isLoading || isSubmitting}
                loading={isSubmitting}
              >
                {currentStep === 3 ? 'Complete Setup' : 'Next'}
              </Button>
            </Group>
          )}
        </Stack>
      </Card>
    </Container>
  );
}

// Step Components

interface WalletStepProps {
  address: string;
  isConnected: boolean;
  onAddressChange: (address: string) => void;
}

function WalletStep({ address, isConnected, onAddressChange }: WalletStepProps) {
  return (
    <Stack gap="md" mt="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        Connect your wallet or enter an admin address manually. This address will have full administrative access to your DevKit instance.
      </Alert>

      <Group>
        <ConnectKitButton />
        {isConnected && (
          <Badge color="green" variant="light">Wallet Connected</Badge>
        )}
      </Group>

      <TextInput
        label="Admin Address"
        description="Ethereum address (0x...) that will be the admin"
        placeholder="0x..."
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        required
      />
    </Stack>
  );
}

interface MnemonicStepProps {
  mnemonic: string;
  generatedMnemonic: string | null;
  showMnemonic: boolean;
  confirmed: boolean;
  isLoading: boolean;
  mnemonicLabel: string;
  onGenerate: () => void;
  onMnemonicChange: (mnemonic: string) => void;
  onConfirmChange: (confirmed: boolean) => void;
  onShowChange: (show: boolean) => void;
  onLabelChange: (label: string) => void;
}

function MnemonicStep({
  mnemonic,
  showMnemonic,
  confirmed,
  isLoading,
  mnemonicLabel,
  onGenerate,
  onMnemonicChange,
  onConfirmChange,
  onShowChange,
  onLabelChange,
}: MnemonicStepProps) {
  // Word count for display
  const wordCount = mnemonic ? mnemonic.trim().split(/\s+/).filter(Boolean).length : 0;
  const isValidWordCount = wordCount === 12 || wordCount === 24;

  return (
    <Stack gap="md" mt="md">
      <Alert icon={<IconAlertCircle size={16} />} color="orange">
        Your mnemonic phrase is the master key to all accounts. Store it securely and never share it!
      </Alert>

      <Group>
        <Button
          onClick={() => {
            onGenerate();
            onShowChange(true); // Always show after generating
          }}
          loading={isLoading}
          leftSection={<IconRefresh size={16} />}
          variant="light"
        >
          Generate New Mnemonic
        </Button>
        <Text size="sm" c="dimmed">or enter an existing one below</Text>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Recovery Phrase (12 or 24 words)</Text>
            <Group gap="xs">
              {mnemonic && (
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => onShowChange(!showMnemonic)}
                >
                  {showMnemonic ? 'Hide' : 'Show'}
                </Button>
              )}
              {mnemonic && (
                <CopyButton value={mnemonic}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy'}>
                      <ActionIcon
                        color={copied ? 'teal' : 'gray'}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              )}
            </Group>
          </Group>

          {/* Always use Textarea - apply visual masking via CSS when hidden */}
          <Textarea
            placeholder="Enter 12 or 24 word mnemonic phrase separated by spaces..."
            value={mnemonic}
            onChange={(e) => onMnemonicChange(e.target.value)}
            minRows={3}
            style={!showMnemonic && mnemonic ? {
              // Apply visual masking using filter blur
              filter: 'blur(4px)',
              userSelect: 'none',
            } : undefined}
          />

          {!showMnemonic && mnemonic && (
            <Text size="xs" c="dimmed" ta="center">
              Click "Show" to reveal the mnemonic
            </Text>
          )}

          {mnemonic && (
            <Group justify="space-between">
              <Text size="xs" c={isValidWordCount ? 'dimmed' : 'red'}>
                Word count: {wordCount} {!isValidWordCount && wordCount > 0 && '(must be 12 or 24)'}
              </Text>
              {isValidWordCount && (
                <Badge color="green" size="sm" variant="light">Valid length</Badge>
              )}
            </Group>
          )}
        </Stack>
      </Paper>

      <TextInput
        label="Wallet Label"
        description="A friendly name for this wallet"
        value={mnemonicLabel}
        onChange={(e) => onLabelChange(e.target.value)}
      />

      <Checkbox
        label="I have securely stored my mnemonic phrase"
        checked={confirmed}
        onChange={(e) => onConfirmChange(e.currentTarget.checked)}
        disabled={!mnemonic}
      />
    </Stack>
  );
}

interface ConfigStepProps {
  formData: {
    accountsCount: number;
    chainId: number;
    evmChainId: number;
    miningAuthor: string;
  };
  onUpdate: (data: Partial<ConfigStepProps['formData']>) => void;
}

function ConfigStep({ formData, onUpdate }: ConfigStepProps) {
  return (
    <Stack gap="md" mt="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        Configure your local development node. These settings are locked once you start using the node.
      </Alert>

      <NumberInput
        label="Number of Accounts"
        description="Genesis accounts to create (1-20)"
        value={formData.accountsCount}
        onChange={(val) => onUpdate({ accountsCount: Number(val) || 10 })}
        min={1}
        max={20}
      />

      <Divider label="Chain IDs" labelPosition="center" />

      <Group grow>
        <NumberInput
          label="Core Space Chain ID"
          description="Default: 2029 (local)"
          value={formData.chainId}
          onChange={(val) => onUpdate({ chainId: Number(val) || 2029 })}
        />
        <NumberInput
          label="eSpace Chain ID"
          description="Default: 2030 (local)"
          value={formData.evmChainId}
          onChange={(val) => onUpdate({ evmChainId: Number(val) || 2030 })}
        />
      </Group>

      <Divider label="Mining" labelPosition="center" />

      <TextInput
        label="Mining Author"
        description="Address to receive mining rewards, or 'auto' for last genesis account"
        placeholder="auto"
        value={formData.miningAuthor}
        onChange={(e) => onUpdate({ miningAuthor: e.target.value || 'auto' })}
      />
    </Stack>
  );
}

interface SecurityStepProps {
  formData: {
    encryptionEnabled: boolean;
    encryptionPassword: string;
    encryptionConfirm: string;
  };
  validation: { valid: boolean; errors: string[]; warnings?: string[] } | null;
  error: string | null;
  onUpdate: (data: Partial<SecurityStepProps['formData']>) => void;
}

function SecurityStep({ formData, validation, error, onUpdate }: SecurityStepProps) {
  const passwordsMatch = formData.encryptionPassword === formData.encryptionConfirm;
  const passwordValid = !formData.encryptionEnabled || formData.encryptionPassword.length >= 8;

  return (
    <Stack gap="md" mt="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue">
        Optionally encrypt your keystore with a password. This adds an extra layer of security but requires the password to access your wallets.
      </Alert>

      <Checkbox
        label="Enable encryption"
        description="Encrypt mnemonic and private keys at rest"
        checked={formData.encryptionEnabled}
        onChange={(e) => onUpdate({ encryptionEnabled: e.currentTarget.checked })}
      />

      {formData.encryptionEnabled && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <PasswordInput
              label="Password"
              description="Minimum 8 characters"
              placeholder="Enter password"
              value={formData.encryptionPassword}
              onChange={(e) => onUpdate({ encryptionPassword: e.target.value })}
              error={!passwordValid && 'Password must be at least 8 characters'}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm password"
              value={formData.encryptionConfirm}
              onChange={(e) => onUpdate({ encryptionConfirm: e.target.value })}
              error={formData.encryptionConfirm && !passwordsMatch && 'Passwords do not match'}
            />
          </Stack>
        </Paper>
      )}

      {validation && !validation.valid && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors">
          <List size="sm">
            {validation.errors.map((err, i) => (
              <List.Item key={i}>{err}</List.Item>
            ))}
          </List>
        </Alert>
      )}

      {validation?.warnings && validation.warnings.length > 0 && (
        <Alert icon={<IconInfoCircle size={16} />} color="yellow" title="Warnings">
          <List size="sm">
            {validation.warnings.map((warn, i) => (
              <List.Item key={i}>{warn}</List.Item>
            ))}
          </List>
        </Alert>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}
    </Stack>
  );
}

function CompletedStep() {
  const [countdown, setCountdown] = useState(3);
  const { disconnect } = useDisconnect();
  const { logout } = useAuthStore();

  // Clear all auth and wallet state - used for both immediate cleanup and before reload
  const clearAllState = useCallback(() => {
    // Clear auth store state
    logout();

    // Clear localStorage
    localStorage.removeItem('sessionId');
    localStorage.removeItem('auth-storage');

    // Clear wagmi/connectkit connection state to prevent stale wallet detection
    const localStorageKeysToRemove = Object.keys(localStorage).filter(
      (key) =>
        key.startsWith('wagmi') ||
        key.startsWith('wc@') ||
        key.startsWith('walletconnect') ||
        key.includes('wallet') ||
        key.includes('connector') ||
        key.includes('W3M') ||
        key.includes('web3modal')
    );
    localStorageKeysToRemove.forEach((key) => localStorage.removeItem(key));

    // Also clear sessionStorage
    const sessionStorageKeysToRemove = Object.keys(sessionStorage).filter(
      (key) =>
        key.startsWith('wagmi') ||
        key.startsWith('wc@') ||
        key.startsWith('walletconnect') ||
        key.includes('wallet') ||
        key.includes('connector')
    );
    sessionStorageKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }, [logout]);

  // Disconnect wallet and clear state immediately on mount
  useEffect(() => {
    console.log('[SetupComplete] Disconnecting wallet and clearing state...');
    try {
      disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    clearAllState();
  }, [disconnect, clearAllState]);

  const handleRefresh = useCallback(() => {
    // Ensure everything is cleared before reload
    try {
      disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    clearAllState();

    // Small delay to let disconnect complete
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [disconnect, clearAllState]);

  useEffect(() => {
    // Auto-refresh after 3 seconds since DevKit is now auto-initialized
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRefresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleRefresh]);

  return (
    <Stack gap="md" mt="md" align="center">
      <IconCheck size={64} color="var(--mantine-color-green-6)" />
      <Title order={3}>Setup Complete!</Title>
      <Text c="dimmed" ta="center">
        Your Conflux DevKit configuration has been saved and initialized.
      </Text>
      <Alert icon={<IconInfoCircle size={16} />} color="green" title="Ready to Use">
        <Text size="sm">
          DevKit has been initialized with your configuration. The page will refresh automatically in {countdown} seconds...
        </Text>
      </Alert>
      <Button
        onClick={handleRefresh}
        leftSection={<IconRefresh size={16} />}
        variant="light"
      >
        Refresh Now
      </Button>
    </Stack>
  );
}
