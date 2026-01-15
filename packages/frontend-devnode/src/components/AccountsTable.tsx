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
import { ActionIcon, Button, Card, CopyButton, Group, Stack, Table, Text } from '@mantine/core';
import { IconCheck, IconCopy, IconRefresh } from '@tabler/icons-react';
import { useEffect } from 'react';

export function AccountsTable() {
  const { accounts, fetchAccounts } = useDevNodeStore();

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 10000);
    return () => clearInterval(interval);
  }, [fetchAccounts]);

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

        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50}>#</Table.Th>
              <Table.Th>Core Space Address</Table.Th>
              <Table.Th>Balance (CFX)</Table.Th>
              <Table.Th>eSpace Address</Table.Th>
              <Table.Th>Balance (CFX)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {accounts.map((account, idx) => (
              <Table.Tr key={account.index}>
                <Table.Td>
                  <Text size="sm" fw={600} c="dimmed">
                    {idx + 1}
                  </Text>
                </Table.Td>
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
                    {account.balance?.core ? parseFloat(account.balance.core).toFixed(2) : '—'}
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
                    {account.balance?.eSpace ? parseFloat(account.balance.eSpace).toFixed(2) : '—'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );
}
