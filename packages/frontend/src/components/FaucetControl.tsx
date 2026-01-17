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
import { Alert, Button, Card, Group, NumberInput, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconDroplet } from '@tabler/icons-react';
import { useState } from 'react';

/**
 * Compact faucet control for requesting test tokens
 * Accessible to both admin and non-admin users
 * Auto-detects address type (Core vs eSpace)
 * Only available on local network
 */
export function FaucetControl() {
  const { status, faucetAccount, requestFaucet } = useDevNodeStore();
  const [loadingFaucet, setLoadingFaucet] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState<number | string>(10);

  // Check network capabilities
  const canUseFaucet = status?.capabilities?.canUseFaucet ?? true;

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
        message: `${amountStr} ${chain === 'core' ? 'CFX' : 'ETH'} sent to ${recipientAddress.slice(0, 10)}...`,
        color: 'green',
      });
      setRecipientAddress('');
      setAmount(10);
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

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        {!canUseFaucet && (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light" p="xs">
            Faucet is only available on local network
          </Alert>
        )}
        
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" fw={600}>
              Faucet
            </Text>
            <Text size="xs" c="dimmed">
              {canUseFaucet ? 'Request test tokens' : 'Local network only'}
            </Text>
          </div>
          {canUseFaucet && (
            <div style={{ textAlign: 'right' }}>
              <Text size="xs" c="dimmed">Available Balance</Text>
              <Text size="sm" fw={600} style={{ fontFamily: 'monospace', color: 'var(--mantine-color-green-6)' }}>
                {faucetAccount?.balance?.core ? parseFloat(faucetAccount.balance.core).toFixed(2) : '0.00'} CFX
              </Text>
            </div>
          )}
        </Group>

        <Group gap="xs" align="flex-end">
          <TextInput
            label="Recipient"
            placeholder="cfx... or 0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 200 }}
            size="sm"
            autoComplete="off"
            disabled={!canUseFaucet}
          />
          <NumberInput
            label="Amount"
            value={amount}
            onChange={setAmount}
            min={1}
            max={10000}
            size="sm"
            style={{ width: 90 }}
            disabled={!canUseFaucet}
          />
          <Tooltip 
            label={!canUseFaucet ? 'Local network only' : 'Auto-detects Core (cfx...) vs eSpace (0x...) addresses'}
            multiline
            w={180}
          >
            <Button
              leftSection={<IconDroplet size={16} />}
              onClick={handleFaucet}
              loading={loadingFaucet}
              disabled={!recipientAddress.trim() || !canUseFaucet}
              size="sm"
              color="blue"
            >
              Send
            </Button>
          </Tooltip>
        </Group>
      </Stack>
    </Card>
  );
}
