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
  ActionIcon,
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconChevronUp,
  IconPick,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';

export function DevNodeControlPanel() {
  const {
    status,
    config,
    setConfig,
    isStarting,
    isStopping,
    isResetting,
    isMining,
    startNode,
    stopNode,
    resetNode,
    clearData,
    mineBlocks,
    startAutoMine,
    stopAutoMine,
    setMiningInterval,
  } = useDevNodeStore();

  const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false);
  const [configOpened, { toggle: toggleConfig }] = useDisclosure(false);
  
  // Mining controls
  const [blocksToMine, setBlocksToMine] = useState(1);
  const [miningMode, setMiningMode] = useState<'empty' | 'withTxs'>('empty');
  const [autoMineInterval, setAutoMineInterval] = useState(status?.miningInterval || 500);
  const [isTogglingAutoMine, setIsTogglingAutoMine] = useState(false);
  const [isSettingInterval, setIsSettingInterval] = useState(false);

  // Derive auto-mining state from status
  const isAutoMining = status?.miningMode === 'auto';
  const currentInterval = status?.miningInterval || 500;
  const isClearingData = useDevNodeStore((state) => state.isClearingData);
  const isRunning = status?.isRunning ?? false;

  const handleStart = async () => {
    try {
      await startNode();
      notifications.show({
        title: 'Node Started',
        message: 'Development node has been started successfully',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Start Failed',
        message: error.message || 'Failed to start development node',
        color: 'red',
      });
    }
  };

  const handleStop = async () => {
    try {
      await stopNode();
      notifications.show({
        title: 'Node Stopped',
        message: 'Development node has been stopped',
        color: 'blue',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Stop Failed',
        message: error.message || 'Failed to stop development node',
        color: 'red',
      });
    }
  };

  const handleClearData = async () => {
    try {
      if (status?.isRunning) {
        notifications.show({
          title: 'Node Running',
          message: 'Please stop the node before clearing data',
          color: 'yellow',
        });
        return;
      }
      await clearData();
      notifications.show({
        title: 'Data Cleared',
        message: 'All blockchain data has been deleted',
        color: 'orange',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Clear Failed',
        message: error.message || 'Failed to clear blockchain data',
        color: 'red',
      });
    }
  };

  const handleRestart = () => {
    openResetModal();
  };

  const handleResetConfirm = async (clearData: boolean) => {
    closeResetModal();
    try {
      await resetNode(clearData);
      notifications.show({
        title: clearData ? 'Node Reset' : 'Node Restarted',
        message: clearData
          ? 'Development node has been reset with fresh blockchain data'
          : 'Development node has been restarted (data preserved)',
        color: clearData ? 'orange' : 'blue',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Reset Failed',
        message: error.message || 'Failed to reset development node',
        color: 'red',
      });
    }
  };

  const handleMineBlocks = async () => {
    try {
      const numTxs = miningMode === 'withTxs' ? 1 : undefined;
      await mineBlocks(blocksToMine, numTxs);
      notifications.show({
        title: 'Mining Complete',
        message: miningMode === 'withTxs' 
          ? `Mined ${blocksToMine} block(s) with pending transactions`
          : `Mined ${blocksToMine} empty block(s)`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Mining Failed',
        message: error.message || 'Failed to mine blocks',
        color: 'red',
      });
    }
  };

  const handleToggleAutoMine = async (enabled: boolean) => {
    setIsTogglingAutoMine(true);
    try {
      if (enabled) {
        await startAutoMine(autoMineInterval);
        notifications.show({
          title: 'Auto-Mining Started',
          message: `Blocks will be mined every ${autoMineInterval}ms`,
          color: 'green',
        });
      } else {
        await stopAutoMine();
        notifications.show({
          title: 'Auto-Mining Stopped',
          message: 'Switched to manual mining mode',
          color: 'blue',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Failed',
        message: error.message || 'Failed to toggle auto-mining',
        color: 'red',
      });
    } finally {
      setIsTogglingAutoMine(false);
    }
  };

  const handleSetInterval = async () => {
    setIsSettingInterval(true);
    try {
      await setMiningInterval(autoMineInterval);
      notifications.show({
        title: 'Interval Updated',
        message: `Mining interval set to ${autoMineInterval}ms`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Failed',
        message: error.message || 'Failed to update mining interval',
        color: 'red',
      });
    } finally {
      setIsSettingInterval(false);
    }
  };

  const isRunning = status?.isRunning || false;

  return (
    <>
      {/* Reset Confirmation Modal */}
      <Modal
        opened={resetModalOpened}
        onClose={closeResetModal}
        title="Reset Development Node"
        centered
      >
        <Stack gap="md">
          <Text size="sm">How would you like to restart the node?</Text>
          <Group grow>
            <Button
              variant="light"
              color="blue"
              onClick={() => handleResetConfirm(false)}
              loading={isResetting}
              leftSection={<IconRefresh size={16} />}
            >
              Keep Data
            </Button>
            <Button
              variant="light"
              color="orange"
              onClick={() => handleResetConfirm(true)}
              loading={isResetting}
              leftSection={<IconTrash size={16} />}
            >
              Clear Data
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            <strong>Keep Data:</strong> Restart preserving blockchain state.
          </Text>
          <Text size="xs" c="dimmed">
            <strong>Clear Data:</strong> Delete <code>.conflux-dev</code> and start fresh from block 0.
          </Text>
        </Stack>
      </Modal>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <Text size="lg" fw={600}>
                DevNode Control
              </Text>
              <Tooltip label={configOpened ? 'Hide configuration' : 'Show configuration'}>
                <ActionIcon 
                  variant="subtle" 
                  color="gray" 
                  onClick={toggleConfig}
                  size="sm"
                >
                  {configOpened ? <IconChevronUp size={16} /> : <IconSettings size={16} />}
                </ActionIcon>
              </Tooltip>
            </Group>
            <Badge color={isRunning ? 'green' : 'gray'} variant="filled">
              {isRunning ? 'Running' : 'Stopped'}
            </Badge>
          </Group>

          {/* Node Control Buttons */}
          <Group grow>
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              onClick={handleStart}
              loading={isStarting}
              disabled={isRunning}
              color="green"
            >
              Start
            </Button>
            <Button
              leftSection={<IconPlayerStop size={16} />}
              onClick={handleStop}
              loading={isStopping}
              disabled={!isRunning}
              color="red"
            >
              Stop
            </Button>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleRestart}
              loading={isResetting}
              disabled={!isRunning}
              color="blue"
            >
              Restart
            </Button>
          </Group>

          {/* Collapsible Configuration Section */}
          <Collapse in={configOpened}>
            <Card withBorder padding="sm" bg="gray.0" mt="xs">
              <Stack gap="sm">
                <Text size="sm" fw={500} c="dimmed">
                  Node Configuration
                </Text>
                {isRunning && (
                  <Text size="xs" c="orange">
                    ⚠️ Stop the node to change configuration
                  </Text>
                )}
                <Group grow>
                  <NumberInput
                    label="Core Chain ID"
                    description="Core space chain ID"
                    value={config.chainId}
                    onChange={(value) => setConfig({ chainId: Number(value) || 2029 })}
                    disabled={isRunning}
                    min={1}
                    max={999999}
                    size="xs"
                  />
                  <NumberInput
                    label="eSpace Chain ID"
                    description="EVM space chain ID"
                    value={config.evmChainId}
                    onChange={(value) => setConfig({ evmChainId: Number(value) || 2030 })}
                    disabled={isRunning}
                    min={1}
                    max={999999}
                    size="xs"
                  />
                </Group>

                <Group grow align="flex-start">
                  <NumberInput
                    label="Genesis Accounts"
                    description="Number of pre-funded accounts to generate (1-20)"
                    value={config.accountsCount ?? 10}
                    onChange={(value) => setConfig({ accountsCount: Number(value) || 10 })}
                    disabled={isRunning}
                    min={1}
                    max={20}
                    size="xs"
                  />
                  <TextInput
                    label="Mining Author (Optional)"
                    description="Core address to receive mining rewards (defaults to faucet account)"
                    placeholder="net2029:aa..." 
                    value={config.miningAuthor ?? ''}
                    onChange={(e) => setConfig({ miningAuthor: e.target.value || undefined })}
                    disabled={isRunning}
                    size="xs"
                    style={{ fontFamily: 'monospace' }}
                  />
                </Group>

                {/* RPC Port Configuration */}
                <Divider my="xs" label="RPC Ports" labelPosition="left" />
                <Stack gap="xs">
                  <Group grow>
                    <NumberInput
                      label="Core HTTP RPC Port"
                      description="Core space HTTP RPC port"
                      value={config.jsonrpcHttpPort ?? 12537}
                      onChange={(value) => setConfig({ jsonrpcHttpPort: Number(value) || 12537 })}
                      disabled={isRunning}
                      min={1024}
                      max={65535}
                      size="xs"
                    />
                    <NumberInput
                      label="Core WebSocket Port"
                      description="Core space WebSocket port"
                      value={config.jsonrpcWsPort ?? 12535}
                      onChange={(value) => setConfig({ jsonrpcWsPort: Number(value) || 12535 })}
                      disabled={isRunning}
                      min={1024}
                      max={65535}
                      size="xs"
                    />
                  </Group>
                  <Group grow>
                    <NumberInput
                      label="eSpace HTTP RPC Port"
                      description="EVM space HTTP RPC port"
                      value={config.jsonrpcHttpEthPort ?? 8545}
                      onChange={(value) => setConfig({ jsonrpcHttpEthPort: Number(value) || 8545 })}
                      disabled={isRunning}
                      min={1024}
                      max={65535}
                      size="xs"
                    />
                    <NumberInput
                      label="eSpace WebSocket Port"
                      description="EVM space WebSocket port"
                      value={config.jsonrpcWsEthPort ?? 8546}
                      onChange={(value) => setConfig({ jsonrpcWsEthPort: Number(value) || 8546 })}
                      disabled={isRunning}
                      min={1024}
                      max={65535}
                      size="xs"
                    />
                  </Group>
                </Stack>

                {/* Data Management */}
                <Divider my="xs" />
                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={handleClearData}
                  loading={isClearingData}
                  disabled={isRunning}
                  fullWidth
                >
                  Delete Configuration Data
                </Button>
              </Stack>
            </Card>
          </Collapse>

          {/* Mining Controls - Only when node is running */}
          {isRunning && (
            <>
              <Divider label="Mining Control" labelPosition="center" />
              
              {/* Mining Mode Selector */}
              <Card withBorder padding="sm" bg="gray.0">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={500}>Mining Mode</Text>
                      <Text size="xs" c="dimmed">
                        Choose automatic or manual block mining
                      </Text>
                    </div>
                    <Switch
                      checked={isAutoMining}
                      onChange={(e) => handleToggleAutoMine(e.currentTarget.checked)}
                      disabled={isTogglingAutoMine}
                      color="green"
                      size="md"
                      label={isAutoMining ? 'Auto' : 'Manual'}
                    />
                  </Group>
                </Stack>
              </Card>
              
              {/* Auto-Mining Configuration */}
              {isAutoMining && (
                <Card withBorder padding="sm" bg="blue.0">
                  <Stack gap="sm">
                    <Text size="sm" fw={500} c="blue">Auto Mining Active</Text>
                    <Group gap="xs" align="flex-end">
                      <NumberInput
                        label="Interval (ms)"
                        description="Time between auto-mined blocks"
                        value={autoMineInterval}
                        onChange={(val) => setAutoMineInterval(Number(val) || 500)}
                        min={100}
                        max={10000}
                        step={100}
                        size="xs"
                        style={{ flex: 1 }}
                      />
                      <Button
                        size="xs"
                        variant="light"
                        onClick={handleSetInterval}
                        loading={isSettingInterval}
                        color={autoMineInterval !== currentInterval ? 'blue' : 'gray'}
                      >
                        {autoMineInterval !== currentInterval ? 'Update' : 'Apply'}
                      </Button>
                    </Group>
                    <Text size="xs" c="blue">
                      ✓ Mining blocks every {currentInterval}ms
                    </Text>
                  </Stack>
                </Card>
              )}

              {/* Manual Mining - Only when auto-mining is disabled */}
              {!isAutoMining && (
                <Card withBorder padding="sm" bg="gray.0">
                  <Stack gap="sm">
                    <Text size="sm" fw={500}>Mine Blocks Manually</Text>
                    <Group justify="space-between" align="flex-end">
                      <NumberInput
                        label="Blocks to mine"
                        value={blocksToMine}
                        onChange={(val) => setBlocksToMine(Number(val) || 1)}
                        min={1}
                        max={100}
                        size="xs"
                        style={{ flex: 1 }}
                      />
                      <SegmentedControl
                        size="xs"
                        value={miningMode}
                        onChange={(val) => setMiningMode(val as 'empty' | 'withTxs')}
                        data={[
                          { label: 'Empty', value: 'empty' },
                          { label: 'Pack Txs', value: 'withTxs' },
                        ]}
                      />
                    </Group>
                    <Text size="xs" c="dimmed">
                      {miningMode === 'empty' 
                        ? 'Mine empty blocks (advances block height only)'
                        : 'Mine blocks that pack pending transactions from txpool'
                      }
                    </Text>
                    <Button
                      leftSection={<IconPick size={16} />}
                      onClick={handleMineBlocks}
                      loading={isMining}
                      variant="light"
                      fullWidth
                    >
                      Mine {blocksToMine} Block{blocksToMine > 1 ? 's' : ''}
                    </Button>
                  </Stack>
                </Card>
              )}
            </>
          )}
        </Stack>
      </Card>
    </>
  );
}
