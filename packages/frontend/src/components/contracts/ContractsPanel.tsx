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
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconCode,
  IconCopy,
  IconRefresh,
  IconRocket,
  IconTrash,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { useDevNodeStore } from '@/stores/devnodeStore';

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
}

interface DeployedContract {
  id: string;
  name: string;
  address: string;
  chain: 'evm' | 'core';
  chainId: number;
  deployedAt: string;
  deployer: string;
  transactionHash: string;
  abi: unknown[];
  constructorArgs: unknown[];
}

interface CompilerInfo {
  version: string;
  defaultEvmVersion: string;
  defaultOptimizer: { enabled: boolean; runs: number };
}

export function ContractsPanel() {
  const { status } = useDevNodeStore();
  const isNodeRunning = status?.isRunning ?? false;

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([]);
  const [compilerInfo, setCompilerInfo] = useState<CompilerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [deployModalOpened, { open: openDeployModal, close: closeDeployModal }] = useDisclosure(false);
  const [interactModalOpened, { open: openInteractModal, close: closeInteractModal }] = useDisclosure(false);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [deployChain, setDeployChain] = useState<'evm' | 'core'>('evm');
  const [constructorArgs, setConstructorArgs] = useState<string>('');
  const [accountIndex, setAccountIndex] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);

  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(null);
  const [callFunction, setCallFunction] = useState('');
  const [callArgs, setCallArgs] = useState('');
  const [callResult, setCallResult] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templatesRes, deployedRes, compilerRes] = await Promise.all([
        apiClient.getContractTemplates(),
        apiClient.getDeployedContracts(),
        apiClient.getCompilerInfo(),
      ]);

      setTemplates(templatesRes.templates);
      setDeployedContracts(deployedRes.contracts);
      setCompilerInfo(compilerRes);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load contract data',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Deploy template
  const handleDeploy = async () => {
    if (!selectedTemplate) return;

    setIsDeploying(true);
    try {
      let args: unknown[] = [];
      if (constructorArgs.trim()) {
        try {
          args = JSON.parse(constructorArgs);
          if (!Array.isArray(args)) {
            args = [args];
          }
        } catch {
          notifications.show({
            title: 'Invalid Arguments',
            message: 'Constructor arguments must be valid JSON',
            color: 'red',
          });
          setIsDeploying(false);
          return;
        }
      }

      const result = await apiClient.deployTemplate({
        template: selectedTemplate,
        chain: deployChain,
        constructorArgs: args.length > 0 ? args : undefined,
        accountIndex,
      });

      notifications.show({
        title: 'Contract Deployed',
        message: `${result.deployment.name} deployed at ${result.deployment.address}`,
        color: 'green',
      });

      closeDeployModal();
      setConstructorArgs('');
      setSelectedTemplate(null);
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Deployment Failed',
        message: error.response?.data?.details || error.response?.data?.error || error.message,
        color: 'red',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Call contract function
  const handleCall = async (isWrite: boolean) => {
    if (!selectedContract || !callFunction) return;

    setIsCalling(true);
    setCallResult(null);

    try {
      let args: unknown[] = [];
      if (callArgs.trim()) {
        try {
          args = JSON.parse(callArgs);
          if (!Array.isArray(args)) {
            args = [args];
          }
        } catch {
          notifications.show({
            title: 'Invalid Arguments',
            message: 'Function arguments must be valid JSON',
            color: 'red',
          });
          setIsCalling(false);
          return;
        }
      }

      if (isWrite) {
        const result = await apiClient.sendToContract({
          address: selectedContract.address,
          abi: selectedContract.abi,
          functionName: callFunction,
          args: args.length > 0 ? args : undefined,
          chain: selectedContract.chain,
          accountIndex,
        });

        setCallResult(`Transaction sent: ${result.transactionHash}`);
        notifications.show({
          title: 'Transaction Sent',
          message: `Hash: ${result.transactionHash.substring(0, 20)}...`,
          color: 'green',
        });
      } else {
        const result = await apiClient.callContract({
          address: selectedContract.address,
          abi: selectedContract.abi,
          functionName: callFunction,
          args: args.length > 0 ? args : undefined,
          chain: selectedContract.chain,
        });

        const formatted = typeof result.result === 'object'
          ? JSON.stringify(result.result, null, 2)
          : String(result.result);
        setCallResult(formatted);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
      setCallResult(`Error: ${errorMessage}`);
      notifications.show({
        title: 'Call Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsCalling(false);
    }
  };

  // Delete contract from tracking
  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteDeployedContract(id);
      notifications.show({
        title: 'Contract Removed',
        message: 'Contract removed from tracking (still exists on chain)',
        color: 'blue',
      });
      loadData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to remove contract',
        color: 'red',
      });
    }
  };

  // Get functions from ABI
  const getFunctions = (abi: unknown[]) => {
    return (abi as Array<{ type: string; name?: string; stateMutability?: string; inputs?: Array<{ name: string; type: string }> }>)
      .filter((item) => item.type === 'function')
      .map((item) => ({
        name: item.name || '',
        stateMutability: item.stateMutability || 'nonpayable',
        inputs: item.inputs || [],
      }));
  };

  if (isLoading) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading contracts...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Warning if node not running */}
      {!isNodeRunning && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="Node Not Running">
          Start the local node to deploy and interact with contracts.
        </Alert>
      )}

      {/* Compiler Info */}
      {compilerInfo && (
        <Paper withBorder p="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <IconCode size={16} />
              <Text size="sm" fw={500}>Solidity Compiler</Text>
            </Group>
            <Badge color="blue" variant="light">
              solc {compilerInfo.version.split('+')[0]}
            </Badge>
          </Group>
        </Paper>
      )}

      <Tabs defaultValue="templates">
        <Tabs.List>
          <Tabs.Tab value="templates">Contract Templates</Tabs.Tab>
          <Tabs.Tab value="deployed">
            Deployed Contracts
            {deployedContracts.length > 0 && (
              <Badge size="xs" ml="xs" variant="filled">
                {deployedContracts.length}
              </Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>

        {/* Templates Tab */}
        <Tabs.Panel value="templates" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {templates.map((template) => (
              <Card key={template.id} withBorder padding="md">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Title order={5}>{template.name}</Title>
                    <Badge color="green" variant="light" size="sm">
                      Template
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {template.description}
                  </Text>
                  <Button
                    leftSection={<IconRocket size={16} />}
                    variant="light"
                    disabled={!isNodeRunning}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      // Set default args based on template
                      if (template.id === 'SimpleStorage') {
                        setConstructorArgs('[42]');
                      } else if (template.id === 'TestToken') {
                        setConstructorArgs('["Test Token", "TEST", 1000000]');
                      } else {
                        setConstructorArgs('');
                      }
                      openDeployModal();
                    }}
                  >
                    Deploy
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        {/* Deployed Contracts Tab */}
        <Tabs.Panel value="deployed" pt="md">
          {deployedContracts.length === 0 ? (
            <Card withBorder padding="xl">
              <Stack align="center" gap="md">
                <IconCode size={48} stroke={1.5} color="gray" />
                <Text c="dimmed">No contracts deployed yet</Text>
                <Text size="sm" c="dimmed">
                  Deploy a template contract to get started
                </Text>
              </Stack>
            </Card>
          ) : (
            <Stack gap="md">
              <Group justify="flex-end">
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconRefresh size={14} />}
                  onClick={loadData}
                >
                  Refresh
                </Button>
              </Group>
              {deployedContracts.map((contract) => (
                <Card key={contract.id} withBorder padding="md">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Title order={5}>{contract.name}</Title>
                        <Badge
                          color={contract.chain === 'evm' ? 'blue' : 'orange'}
                          variant="light"
                          size="sm"
                        >
                          {contract.chain === 'evm' ? 'eSpace' : 'Core Space'}
                        </Badge>
                      </Group>
                      <Group gap="xs">
                        <Tooltip label="Interact with contract">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setSelectedContract(contract);
                              setCallFunction('');
                              setCallArgs('');
                              setCallResult(null);
                              openInteractModal();
                            }}
                          >
                            <IconCode size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Remove from tracking">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDelete(contract.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    <Group gap="xs">
                      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                        {contract.address.length > 42
                          ? `${contract.address.substring(0, 20)}...${contract.address.substring(contract.address.length - 10)}`
                          : contract.address}
                      </Text>
                      <CopyButton value={contract.address}>
                        {({ copied, copy }) => (
                          <ActionIcon size="xs" variant="subtle" onClick={copy}>
                            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                          </ActionIcon>
                        )}
                      </CopyButton>
                    </Group>

                    <Text size="xs" c="dimmed">
                      Deployed: {new Date(contract.deployedAt).toLocaleString()}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Deploy Modal */}
      <Modal
        opened={deployModalOpened}
        onClose={closeDeployModal}
        title="Deploy Contract"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Template"
            placeholder="Select a template"
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            data={templates.map((t) => ({ value: t.id, label: t.name }))}
          />

          <Select
            label="Target Chain"
            value={deployChain}
            onChange={(v) => setDeployChain(v as 'evm' | 'core')}
            data={[
              { value: 'evm', label: 'eSpace (EVM)' },
              { value: 'core', label: 'Core Space' },
            ]}
          />

          <Textarea
            label="Constructor Arguments"
            description='JSON array of arguments (e.g., [42] or ["name", "symbol"])'
            placeholder="[42]"
            value={constructorArgs}
            onChange={(e) => setConstructorArgs(e.target.value)}
            minRows={2}
          />

          <NumberInput
            label="Account Index"
            description="Which genesis account to deploy from (0-9)"
            value={accountIndex}
            onChange={(v) => setAccountIndex(Number(v))}
            min={0}
            max={9}
          />

          <Button
            leftSection={<IconRocket size={16} />}
            loading={isDeploying}
            onClick={handleDeploy}
            disabled={!selectedTemplate}
          >
            Deploy Contract
          </Button>
        </Stack>
      </Modal>

      {/* Interact Modal */}
      <Modal
        opened={interactModalOpened}
        onClose={closeInteractModal}
        title={`Interact: ${selectedContract?.name || 'Contract'}`}
        size="lg"
      >
        {selectedContract && (
          <Stack gap="md">
            <Paper withBorder p="sm">
              <Group gap="xs">
                <Text size="sm" fw={500}>Address:</Text>
                <Code>{selectedContract.address}</Code>
                <CopyButton value={selectedContract.address}>
                  {({ copied, copy }) => (
                    <ActionIcon size="xs" variant="subtle" onClick={copy}>
                      {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                    </ActionIcon>
                  )}
                </CopyButton>
              </Group>
            </Paper>

            <Select
              label="Function"
              placeholder="Select a function"
              value={callFunction}
              onChange={(v) => setCallFunction(v || '')}
              data={getFunctions(selectedContract.abi).map((f) => ({
                value: f.name,
                label: `${f.name}(${f.inputs.map((i) => i.type).join(', ')}) - ${f.stateMutability}`,
              }))}
            />

            <Textarea
              label="Arguments"
              description="JSON array of arguments"
              placeholder='[]'
              value={callArgs}
              onChange={(e) => setCallArgs(e.target.value)}
              minRows={2}
            />

            <NumberInput
              label="Account Index (for write operations)"
              value={accountIndex}
              onChange={(v) => setAccountIndex(Number(v))}
              min={0}
              max={9}
            />

            <Group>
              <Button
                variant="light"
                loading={isCalling}
                onClick={() => handleCall(false)}
                disabled={!callFunction}
              >
                Read (call)
              </Button>
              <Button
                loading={isCalling}
                onClick={() => handleCall(true)}
                disabled={!callFunction}
              >
                Write (send)
              </Button>
            </Group>

            {callResult && (
              <Paper withBorder p="sm">
                <Text size="sm" fw={500} mb="xs">Result:</Text>
                <ScrollArea h={100}>
                  <Code block style={{ whiteSpace: 'pre-wrap' }}>
                    {callResult}
                  </Code>
                </ScrollArea>
              </Paper>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
