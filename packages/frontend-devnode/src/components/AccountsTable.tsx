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
import { ActionIcon, Button, Card, CopyButton, Group, Select, Stack, Table, Text, TextInput, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCopy, IconDroplet, IconRefresh } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function AccountsTable() {
  const { accounts, faucetAccount, fetchAccounts, requestFaucet } = useDevNodeStore();
  const [loadingFaucet, setLoadingFaucet] = useState<string | null>(null);
  const [faucetAddress, setFaucetAddress] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('10');
  const [faucetChain, setFaucetChain] = useState<'core' | 'eSpace' | 'auto'>('auto');

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 10000);
    return () => clearInterval(interval);
  }, [fetchAccounts]);

  const detectChain = (address: string): 'core' | 'eSpace' => {
    if (address.toLowerCase().startsWith('0x')) return 'eSpace';
    if (address.toLowerCase().startsWith('cfx')) return 'core';
    return 'core';
  };

  const handleFaucet = async (
    address: string,
    chain: 'core' | 'eSpace' | 'auto' = 'auto',
    amount = '10'
  ) => {
    const targetChain = chain === 'auto' ? detectChain(address) : chain;
    setLoadingFaucet(`${address}-${targetChain}`);
    try {
      await requestFaucet({
        address,
        amount,
        chain: targetChain,
      });
      notifications.show({
        title: 'Faucet Success',
        message: `${amount} ${targetChain === 'core' ? 'CFX' : 'ETH'} sent to ${address.slice(0, 8)}...`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Faucet Failed',
        message: error.message || 'Failed to request tokens',
        color: 'red',
      });
    } finally {
      setLoadingFaucet(null);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={600}>
            Development Accounts
          </Text>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={() => fetchAccounts()}
          >
            Refresh
          </Button>
        </Group>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Faucet (send to any address)
          </Text>
          <Group align="flex-end" wrap="wrap">
            <TextInput
              label="Address"
              placeholder="0x..."
              value={faucetAddress}
              onChange={(e) => setFaucetAddress(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 260 }}
            />
            <TextInput
              label="Amount"
              value={faucetAmount}
              onChange={(e) => setFaucetAmount(e.currentTarget.value)}
              style={{ width: 120 }}
            />
            <Select
              label="Chain"
              data={[
                { value: 'auto', label: 'Auto (by address)' },
                { value: 'core', label: 'Core (CFX)' },
                { value: 'eSpace', label: 'eSpace (ETH)' },
              ]}
              value={faucetChain}
              onChange={(val) => setFaucetChain((val as 'core' | 'eSpace' | 'auto') || 'auto')}
              style={{ width: 160 }}
            />
            <Button
              leftSection={<IconDroplet size={16} />}
              disabled={!faucetAddress}
              onClick={() => handleFaucet(faucetAddress, faucetChain, faucetAmount)}
            >
              Send
            </Button>
          </Group>
        </Stack>

        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Core Space Address</Table.Th>
              <Table.Th>Balance (CFX)</Table.Th>
              <Table.Th>eSpace Address</Table.Th>
              <Table.Th>Balance (ETH)</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {faucetAccount && (
              <Table.Tr key="faucet" style={{ backgroundColor: '#fff3bf' }}>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" style={{ fontFamily: 'monospace' }} fw={500}>
                      {formatAddress(faucetAccount.addresses.core)}
                    </Text>
                    <CopyButton value={faucetAccount.addresses.core}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
                    Faucet Account
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} c="green">
                    {faucetAccount.balance?.core || '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" style={{ fontFamily: 'monospace' }} fw={500}>
                      {formatAddress(faucetAccount.addresses.evm)}
                    </Text>
                    <CopyButton value={faucetAccount.addresses.evm}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600} c="green">
                    {faucetAccount.balance?.eSpace || '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    Rewards only
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {accounts.map((account) => (
              <Table.Tr key={account.index}>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {formatAddress(account.addresses.core)}
                    </Text>
                    <CopyButton value={account.addresses.core}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {account.balance?.core || '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {formatAddress(account.addresses.evm)}
                    </Text>
                    <CopyButton value={account.addresses.evm}>
                      {({ copied, copy }) => (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {account.balance?.eSpace || '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Request CFX">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleFaucet(account.addresses.core, 'core')}
                        loading={loadingFaucet === `${account.addresses.core}-core`}
                      >
                        <IconDroplet size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Request ETH">
                      <ActionIcon
                        variant="light"
                        color="purple"
                        onClick={() => handleFaucet(account.addresses.evm, 'eSpace')}
                        loading={loadingFaucet === `${account.addresses.evm}-eSpace`}
                      >
                        <IconDroplet size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
}
