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

import { Badge, Button, Card, Group, NumberInput, Stack, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPick, IconPlayerPlay, IconPlayerStop, IconRefresh } from '@tabler/icons-react';
import { useState } from 'react';
import { useDevNodeStore } from '@/stores/devnodeStore';

export function DevNodeControlPanel() {
  const { status, isStarting, isStopping, isRestarting, isMining, startNode, stopNode, restartNode, setMiningMode, mineBlock } =
    useDevNodeStore();

  const [autoMining, setAutoMining] = useState(status?.miningMode === 'auto');
  const [blockTime, setBlockTime] = useState(1000);

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

  const handleRestart = async () => {
    try {
      await restartNode();
      notifications.show({
        title: 'Node Restarted',
        message: 'Development node has been restarted',
        color: 'blue',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Restart Failed',
        message: error.message || 'Failed to restart development node',
        color: 'red',
      });
    }
  };

  const handleMiningToggle = async (checked: boolean) => {
    setAutoMining(checked);
    try {
      await setMiningMode({ autoMining: checked, blockTime: checked ? blockTime : undefined });
      notifications.show({
        title: 'Mining Mode Updated',
        message: `Auto-mining ${checked ? 'enabled' : 'disabled'}`,
        color: 'blue',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Update Failed',
        message: error.message || 'Failed to update mining mode',
        color: 'red',
      });
      setAutoMining(!checked);
    }
  };

  const handleMineBlock = async () => {
    try {
      await mineBlock();
      notifications.show({
        title: 'Block Mined',
        message: 'Successfully mined a new block',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Mining Failed',
        message: error.message || 'Failed to mine block',
        color: 'red',
      });
    }
  };

  const isRunning = status?.isRunning || false;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            DevNode Control
          </Text>
          <Badge color={isRunning ? 'green' : 'gray'} variant="filled">
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </Group>

        <Group grow>
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={handleStart}
            loading={isStarting}
            disabled={isRunning}
            color="green"
          >
            Start Node
          </Button>
          <Button
            leftSection={<IconPlayerStop size={16} />}
            onClick={handleStop}
            loading={isStopping}
            disabled={!isRunning}
            color="red"
          >
            Stop Node
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRestart}
            loading={isRestarting}
            disabled={!isRunning}
            color="blue"
          >
            Restart
          </Button>
        </Group>

        {isRunning && (
          <Card withBorder padding="sm" bg="gray.0">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Auto Mining
                </Text>
                <Switch
                  checked={autoMining}
                  onChange={(e) => handleMiningToggle(e.target.checked)}
                />
              </Group>

              {autoMining && (
                <NumberInput
                  label="Block Time (ms)"
                  value={blockTime}
                  onChange={(val) => setBlockTime(Number(val))}
                  min={100}
                  max={10000}
                  step={100}
                  size="xs"
                />
              )}

              {!autoMining && (
                <Button
                  leftSection={<IconPick size={16} />}
                  onClick={handleMineBlock}
                  loading={isMining}
                  size="sm"
                  variant="light"
                >
                  Mine Block
                </Button>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
