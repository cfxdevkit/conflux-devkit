import { Card, NumberInput, Stack, Switch, Text, Title } from '@mantine/core';
import { useDevNodeStore } from '@/stores/devnodeStore';

export function NodeConfigPanel() {
  const { status, config, setConfig } = useDevNodeStore();

  const isNodeRunning = status?.isRunning ?? false;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Title order={3}>Node Configuration</Title>
        <Text size="sm" c="dimmed">
          Configure node settings before starting. Settings cannot be changed while the node is running.
        </Text>
      </Card.Section>

      <Stack mt="md" gap="md">
        <NumberInput
          label="Core Chain ID"
          description="Conflux Core chain ID"
          value={config.chainId}
          onChange={(value) => setConfig({ chainId: Number(value) || 2029 })}
          disabled={isNodeRunning}
          min={1}
          max={999999}
          step={1}
          allowDecimal={false}
        />

        <NumberInput
          label="eSpace Chain ID"
          description="Conflux eSpace (EVM) chain ID"
          value={config.evmChainId}
          onChange={(value) => setConfig({ evmChainId: Number(value) || 2030 })}
          disabled={isNodeRunning}
          min={1}
          max={999999}
          step={1}
          allowDecimal={false}
        />

        <Switch
          label="Auto Mining"
          description="Automatically mine blocks at regular intervals"
          checked={config.autoMining}
          onChange={(event) => setConfig({ autoMining: event.currentTarget.checked })}
          disabled={isNodeRunning}
        />

        {config.autoMining && (
          <NumberInput
            label="Mining Interval (ms)"
            description="Time between automatic block generation"
            value={config.miningInterval}
            onChange={(value) => setConfig({ miningInterval: Number(value) || 1000 })}
            disabled={isNodeRunning}
            min={100}
            max={60000}
            step={100}
            leftSection={
              <Text size="xs" c="dimmed">
                ms
              </Text>
            }
          />
        )}

        <Switch
          label="Data Persistence"
          description="Keep blockchain data between restarts"
          checked={config.persistence}
          onChange={(event) => setConfig({ persistence: event.currentTarget.checked })}
          disabled={isNodeRunning}
        />

        {isNodeRunning && (
          <Text size="sm" c="orange" mt="xs">
            ⚠️ Node must be stopped to change configuration
          </Text>
        )}
      </Stack>
    </Card>
  );
}
