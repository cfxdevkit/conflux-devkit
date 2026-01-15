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

import { useDevNodeStore } from '@/stores/devnodeStore';
import {
    Alert,
    Badge,
    Button,
    Group,
    Modal,
    NumberInput,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconDroplet } from '@tabler/icons-react';
import { useState } from 'react';

/**
 * Faucet button for navbar with modal containing faucet controls
 * Only available on local network
 */
export function FaucetButton() {
  const [opened, { open, close }] = useDisclosure(false);
  const { status, faucetAccount, requestFaucet } = useDevNodeStore();
  const [loadingFaucet, setLoadingFaucet] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState<number | string>(10);

  // Check network capabilities
  const canUseFaucet = status?.capabilities?.canUseFaucet ?? true;
  const isNodeRunning = status?.isRunning ?? false;

  const detectChain = (address: string): 'core' | 'eSpace' => {
    if (address.toLowerCase().startsWith('0x')) return 'eSpace';
    if (address.toLowerCase().startsWith('cfx')) return 'core';
    return 'core';
  };

  const handleFaucet = async () => {
    if (!recipientAddress.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a recipient address',
        color: 'red',
      });
      return;
    }

    const chain = detectChain(recipientAddress);
    const amountStr = String(amount);

    setLoadingFaucet(true);
    try {
      await requestFaucet({
        address: recipientAddress,
        amount: amountStr,
        chain,
      });
      notifications.show({
        title: 'Faucet Success',
        message: `${amountStr} CFX sent to ${recipientAddress.slice(0, 10)}... (${chain === 'core' ? 'Core Space' : 'eSpace'})`,
        color: 'green',
      });
      setRecipientAddress('');
      setAmount(10);
      close();
    } catch (error: any) {
      notifications.show({
        title: 'Faucet Failed',
        message: error.message || 'Failed to request tokens',
        color: 'red',
      });
    } finally {
      setLoadingFaucet(false);
    }
  };

  // Determine button state
  const isDisabled = !canUseFaucet || !isNodeRunning;
  const buttonTooltip = !isNodeRunning
    ? 'Start node to use faucet'
    : !canUseFaucet
      ? 'Faucet only available on local network'
      : 'Request test tokens';

  return (
    <>
      <Button
        variant="light"
        color={isDisabled ? 'gray' : 'cyan'}
        size="sm"
        leftSection={<IconDroplet size={16} />}
        onClick={open}
        disabled={isDisabled}
        title={buttonTooltip}
      >
        Faucet
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <IconDroplet size={20} />
            <Text fw={600}>Faucet</Text>
          </Group>
        }
        size="md"
      >
        <Stack gap="md">
          {!canUseFaucet && (
            <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
              Faucet is only available on local network. Switch to local network to use the faucet.
            </Alert>
          )}

          {!isNodeRunning && canUseFaucet && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
              Start the node to use the faucet.
            </Alert>
          )}

          {/* Faucet Balance */}
          {canUseFaucet && (
            <Group justify="space-between" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
              <Text size="sm" c="dimmed">
                Available Balance
              </Text>
              <Badge color="green" variant="light" size="lg">
                {faucetAccount?.balance?.core
                  ? parseFloat(faucetAccount.balance.core).toFixed(2)
                  : '0.00'}{' '}
                CFX
              </Badge>
            </Group>
          )}

          {/* Recipient Address */}
          <TextInput
            label="Recipient Address"
            placeholder="cfx... or 0x..."
            description="Enter a Core (cfx...) or eSpace (0x...) address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.currentTarget.value)}
            disabled={!canUseFaucet || !isNodeRunning}
            autoComplete="off"
          />

          {/* Amount */}
          <NumberInput
            label="Amount"
            description="Amount of tokens to send"
            value={amount}
            onChange={setAmount}
            min={1}
            max={10000}
            disabled={!canUseFaucet || !isNodeRunning}
          />

          {/* Address Type Detection */}
          {recipientAddress && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Detected:
              </Text>
              <Badge
                color={detectChain(recipientAddress) === 'core' ? 'green' : 'blue'}
                variant="light"
              >
                {detectChain(recipientAddress) === 'core' ? 'Core Space' : 'eSpace'}
              </Badge>
            </Group>
          )}

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button
              leftSection={<IconDroplet size={16} />}
              onClick={handleFaucet}
              loading={loadingFaucet}
              disabled={!recipientAddress.trim() || !canUseFaucet || !isNodeRunning}
              color="cyan"
            >
              Send Tokens
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
