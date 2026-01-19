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
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconPick,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDevNodeStore } from '@/stores/devnodeStore';

export function NodeControlPanel() {
  const { user } = useAuthStore();
  const isAdmin = user?.isAdmin ?? false;

  const {
    status,
    isStarting,
    isStopping,
    isResetting,
    isMining,
    startNode,
    stopNode,
    resetNode,
    startAutoMine,
    stopAutoMine,
    setMiningInterval,
  } = useDevNodeStore();

  // Network capabilities
  const capabilities = status?.capabilities;
  const canControlNode = capabilities?.canControlNode ?? true;
  const canMine = capabilities?.canMine ?? true;
  const isLocalNetwork = !status?.network || status.network === 'local';

  const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false);

  // Mining controls
  const [blocksToMine, setBlocksToMine] = useState(1);
  const [miningMode, setMiningMode] = useState<'empty' | 'withTxs'>('empty');
  const [autoMineInterval, setAutoMineInterval] = useState(status?.miningInterval || 500);
  const [isTogglingAutoMine, setIsTogglingAutoMine] = useState(false);
  const [isSettingInterval, setIsSettingInterval] = useState(false);

  const isAutoMining = status?.miningMode === 'auto';
  const currentInterval = status?.miningInterval || 500;
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
    const { mineBlocks } = useDevNodeStore.getState();
    try {
      const numTxs = miningMode === 'withTxs' ? 1 : undefined;
      await mineBlocks(blocksToMine, numTxs);
      notifications.show({
        title: 'Mining Complete',
        message:
          miningMode === 'withTxs'
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

  return (
    <>
      {/* Reset Confirmation Modal */}
      <Modal opened={resetModalOpened} onClose={closeResetModal} title="Reset Development Node" centered>
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
            <strong>Clear Data:</strong> Delete blockchain data and start fresh from block 0.
          </Text>
        </Stack>
      </Modal>

      <Card withBorder padding="md" radius="md">
        <Stack gap="md">
          {/* Alerts */}
          {!isLocalNetwork && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue" title="Remote Network Mode">
              Connected to {status?.network}. Node control and mining features are only available on local
              network.
            </Alert>
          )}
          {isLocalNetwork && !isAdmin && (
            <Alert icon={<IconAlertCircle size={16} />} color="yellow" title="Read-Only Mode">
              Only admin users can control the development node.
            </Alert>
          )}

          {/* Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <Text fw={600}>Node Control</Text>
              {isAdmin && (
                <Badge size="xs" variant="filled" color="green">
                  Admin
                </Badge>
              )}
            </Group>
            <Badge color={isRunning ? 'green' : 'gray'} variant="filled">
              {isRunning ? 'Running' : 'Stopped'}
            </Badge>
          </Group>

          {/* Control Buttons */}
          <Group grow>
            <Tooltip
              label={!canControlNode ? 'Local network only' : !isAdmin ? 'Admin only' : ''}
              disabled={canControlNode && isAdmin}
            >
              <Button
                leftSection={<IconPlayerPlay size={16} />}
                onClick={handleStart}
                loading={isStarting}
                disabled={isRunning || !isAdmin || !canControlNode}
                color="green"
              >
                Start
              </Button>
            </Tooltip>
            <Tooltip
              label={!canControlNode ? 'Local network only' : !isAdmin ? 'Admin only' : ''}
              disabled={canControlNode && isAdmin}
            >
              <Button
                leftSection={<IconPlayerStop size={16} />}
                onClick={handleStop}
                loading={isStopping}
                disabled={!isRunning || !isAdmin || !canControlNode}
                color="red"
              >
                Stop
              </Button>
            </Tooltip>
            <Tooltip
              label={!canControlNode ? 'Local network only' : !isAdmin ? 'Admin only' : ''}
              disabled={canControlNode && isAdmin}
            >
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={openResetModal}
                loading={isResetting}
                disabled={!isRunning || !isAdmin || !canControlNode}
                color="blue"
              >
                Restart
              </Button>
            </Tooltip>
          </Group>

          {/* Mining Controls - Only when node is running */}
          {isRunning && canMine && (
            <Card withBorder padding="sm" bg={isAutoMining ? 'blue.0' : 'gray.0'}>
              <Stack gap="sm">
                {/* Mining Mode Toggle */}
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      {isAutoMining ? 'Auto Mining' : 'Manual Mining'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {isAutoMining
                        ? 'Automatically mine blocks at regular intervals'
                        : 'Mine blocks on demand'}
                    </Text>
                  </div>
                  <Switch
                    checked={isAutoMining}
                    onChange={(e) => handleToggleAutoMine(e.currentTarget.checked)}
                    disabled={isTogglingAutoMine || !isAdmin || !canMine}
                    color="green"
                    size="md"
                    label={isAutoMining ? 'Auto' : 'Manual'}
                  />
                </Group>

                {/* Mode-specific controls */}
                {isAutoMining ? (
                  <>
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
                        disabled={!isAdmin || !canMine}
                      />
                      <Button
                        size="xs"
                        variant="light"
                        onClick={handleSetInterval}
                        loading={isSettingInterval}
                        color={autoMineInterval !== currentInterval ? 'blue' : 'gray'}
                        disabled={!isAdmin || !canMine}
                      >
                        {autoMineInterval !== currentInterval ? 'Update' : 'Apply'}
                      </Button>
                    </Group>
                    <Text size="xs" c="blue">
                      Mining blocks every {currentInterval}ms
                    </Text>
                  </>
                ) : (
                  <>
                    <Group justify="space-between" align="flex-end">
                      <NumberInput
                        label="Blocks to mine"
                        value={blocksToMine}
                        onChange={(val) => setBlocksToMine(Number(val) || 1)}
                        min={1}
                        max={100}
                        size="xs"
                        style={{ flex: 1 }}
                        disabled={!isAdmin || !canMine}
                      />
                      <SegmentedControl
                        size="xs"
                        value={miningMode}
                        onChange={(val) => setMiningMode(val as 'empty' | 'withTxs')}
                        data={[
                          { label: 'Empty', value: 'empty' },
                          { label: 'Pack Txs', value: 'withTxs' },
                        ]}
                        disabled={!isAdmin || !canMine}
                      />
                    </Group>
                    <Text size="xs" c="dimmed">
                      {miningMode === 'empty'
                        ? 'Mine empty blocks (advances block height only)'
                        : 'Mine blocks that pack pending transactions from txpool'}
                    </Text>
                    <Tooltip label={!isAdmin ? 'Admin only' : ''} disabled={isAdmin}>
                      <Button
                        leftSection={<IconPick size={16} />}
                        onClick={handleMineBlocks}
                        loading={isMining}
                        variant="light"
                        fullWidth
                        disabled={!isAdmin || !canMine}
                      >
                        Mine {blocksToMine} Block{blocksToMine > 1 ? 's' : ''}
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </Card>
          )}
        </Stack>
      </Card>
    </>
  );
}
