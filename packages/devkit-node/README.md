# @conflux-devkit/devkit-node

> **Node management and CLI tools for Conflux DevKit**

[![npm version](https://img.shields.io/npm/v/@conflux-devkit/devkit-node)](https://www.npmjs.com/package/@conflux-devkit/devkit-node)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Overview

The devkit-node package provides comprehensive node management and CLI tools for Conflux DevKit. It includes node lifecycle management, contract deployment automation, workflow orchestration, and command-line interfaces for development and production environments.

## ✨ Features

- **🖥️ Node Management**: Complete Conflux node lifecycle management
- **📦 Contract Deployment**: Automated contract deployment and management
- **🔄 Workflow Orchestration**: End-to-end development workflows
- **🛠️ CLI Tools**: Command-line interface for all operations
- **📊 Status Monitoring**: Real-time node and network status
- **🔧 Configuration**: Flexible configuration management
- **🚀 Automation**: Automated development and deployment processes
- **📝 Logging**: Comprehensive logging and debugging

## 📦 Installation

```bash
pnpm add @conflux-devkit/devkit-node
# or
npm install @conflux-devkit/devkit-node
# or
yarn add @conflux-devkit/devkit-node
```

## 🚀 Quick Start

```typescript
import {
  NodeManager,
  ContractDeployer,
  WorkflowOrchestrator,
  createCLI
} from '@conflux-devkit/devkit-node';

// Create node manager
const nodeManager = new NodeManager({
  chainId: 2029,
  evmChainId: 2030,
  corePort: 12537,
  evmPort: 8545
});

// Start node
await nodeManager.startNode();

// Deploy contracts
const deployer = new ContractDeployer();
const deployment = await deployer.deployContract({
  name: 'MyToken',
  bytecode: '0x608060405234801561001057600080fd5b50...',
  abi: [...],
  args: [1000000]
});

console.log('Contract deployed:', deployment.address);

// Stop node
await nodeManager.stopNode();
```

## 📚 API Reference

### Node Management

#### `NodeManager`

```typescript
class NodeManager {
  constructor(config: NodeConfig);

  // Node lifecycle
  startNode(): Promise<void>;
  stopNode(): Promise<void>;
  restartNode(): Promise<void>;

  // Status management
  getNodeStatus(): Promise<NodeStatus>;
  isNodeRunning(): Promise<boolean>;
  waitForNode(): Promise<void>;

  // Configuration
  updateConfig(config: Partial<NodeConfig>): void;
  getConfig(): NodeConfig;
}
```

#### `NodeConfig`

```typescript
interface NodeConfig {
  chainId: number;
  evmChainId: number;
  corePort: number;
  evmPort: number;
  dataDir?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  rpcUrl?: string;
  evmRpcUrl?: string;
}
```

#### `NodeStatus`

```typescript
interface NodeStatus {
  running: boolean;
  chainId: string;
  evmChainId: string;
  blockNumber: string;
  peerCount: string;
  uptime: number;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
}
```

### Contract Deployment

#### `ContractDeployer`

```typescript
class ContractDeployer {
  constructor(config?: DeployerConfig);

  // Contract deployment
  deployContract(config: ContractDeploymentConfig): Promise<DeploymentResult>;
  deployMultiple(
    contracts: ContractDeploymentConfig[]
  ): Promise<DeploymentResult[]>;

  // Contract management
  getDeployedContracts(): Promise<DeploymentResult[]>;
  getContractByAddress(address: string): Promise<DeploymentResult | null>;

  // Verification
  verifyContract(address: string, sourceCode: string): Promise<boolean>;
}
```

#### `ContractDeploymentConfig`

```typescript
interface ContractDeploymentConfig {
  name: string;
  bytecode: `0x${string}`;
  abi: AbiItem[];
  args?: unknown[];
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  network?: 'core' | 'evm' | 'both';
}
```

#### `DeploymentResult`

```typescript
interface DeploymentResult {
  contractName: string;
  address: string;
  transactionHash: string;
  blockNumber: bigint;
  blockHash: string;
  gasUsed: bigint;
  gasPrice: bigint;
  abi: AbiItem[];
  bytecode: string;
  deployedBytecode: string;
  deployedAt: Date;
  network: string;
  networkId: string;
  chainId: number;
  evmChainId: number;
  chainType: 'core' | 'evm';
  typesGenerated: boolean;
}
```

### Workflow Orchestration

#### `WorkflowOrchestrator`

```typescript
class WorkflowOrchestrator {
  constructor(config: WorkflowConfig);

  // Workflow execution
  executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
  executeStep(step: WorkflowStep): Promise<StepResult>;

  // Workflow management
  createWorkflow(name: string, steps: WorkflowStep[]): Workflow;
  validateWorkflow(workflow: Workflow): boolean;

  // Step execution
  executeNodeStep(step: NodeStep): Promise<StepResult>;
  executeDeployStep(step: DeployStep): Promise<StepResult>;
  executeVerifyStep(step: VerifyStep): Promise<StepResult>;
}
```

#### `Workflow`

```typescript
interface Workflow {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  config: WorkflowConfig;
}
```

#### `WorkflowStep`

```typescript
interface WorkflowStep {
  id: string;
  type: 'node' | 'deploy' | 'verify' | 'custom';
  name: string;
  description?: string;
  config: Record<string, unknown>;
  dependencies?: string[];
  retry?: number;
  timeout?: number;
}
```

### CLI Tools

#### `createCLI`

```typescript
function createCLI(): CommanderStatic;

// Available commands:
// - node start [options]
// - node stop [options]
// - node restart [options]
// - node status [options]
// - contract deploy [options]
// - contract list [options]
// - contract verify [options]
// - workflow run [options]
// - workflow create [options]
// - workflow list [options]
```

## 🧪 Examples

### Basic Node Management

```typescript
import { NodeManager } from '@conflux-devkit/devkit-node';

const nodeManager = new NodeManager({
  chainId: 2029,
  evmChainId: 2030,
  corePort: 12537,
  evmPort: 8545,
  logLevel: 'info',
});

// Start node
await nodeManager.startNode();
console.log('Node started');

// Check status
const status = await nodeManager.getNodeStatus();
console.log('Node status:', status);

// Wait for node to be ready
await nodeManager.waitForNode();
console.log('Node is ready');

// Stop node
await nodeManager.stopNode();
console.log('Node stopped');
```

### Contract Deployment

```typescript
import { ContractDeployer } from '@conflux-devkit/devkit-node';

const deployer = new ContractDeployer();

// Deploy single contract
const deployment = await deployer.deployContract({
  name: 'MyToken',
  bytecode: '0x608060405234801561001057600080fd5b50...',
  abi: [
    {
      "type": "constructor",
      "inputs": [{"name": "initialSupply", "type": "uint256"}],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "totalSupply",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    }
  ],
  args: [1000000],
  network: 'evm'
});

console.log('Contract deployed:', deployment.address);
console.log('Transaction hash:', deployment.transactionHash);
console.log('Gas used:', deployment.gasUsed.toString());

// Deploy multiple contracts
const deployments = await deployer.deployMultiple([
  {
    name: 'TokenA',
    bytecode: '0x...',
    abi: [...],
    args: [1000000]
  },
  {
    name: 'TokenB',
    bytecode: '0x...',
    abi: [...],
    args: [2000000]
  }
]);

console.log('All contracts deployed:', deployments.map(d => d.address));
```

### Workflow Orchestration

```typescript
import { WorkflowOrchestrator } from '@conflux-devkit/devkit-node';

const orchestrator = new WorkflowOrchestrator();

// Create workflow
const workflow = orchestrator.createWorkflow('Deploy and Verify', [
  {
    id: 'start-node',
    type: 'node',
    name: 'Start Conflux Node',
    config: {
      chainId: 2029,
      evmChainId: 2030,
      corePort: 12537,
      evmPort: 8545
    }
  },
  {
    id: 'deploy-contract',
    type: 'deploy',
    name: 'Deploy MyToken Contract',
    config: {
      name: 'MyToken',
      bytecode: '0x608060405234801561001057600080fd5b50...',
      abi: [...],
      args: [1000000]
    },
    dependencies: ['start-node']
  },
  {
    id: 'verify-contract',
    type: 'verify',
    name: 'Verify Contract on Explorer',
    config: {
      address: '${deploy-contract.address}',
      sourceCode: '...'
    },
    dependencies: ['deploy-contract']
  }
]);

// Execute workflow
const result = await orchestrator.executeWorkflow(workflow);
console.log('Workflow completed:', result.success);
console.log('Results:', result.results);
```

### CLI Usage

```bash
# Install globally
npm install -g @conflux-devkit/devkit-node

# Start node
conflux-devkit node start --chain-id 2029 --evm-chain-id 2030

# Check node status
conflux-devkit node status

# Deploy contract
conflux-devkit contract deploy \
  --name MyToken \
  --bytecode 0x608060405234801561001057600080fd5b50... \
  --abi-file ./abi.json \
  --args 1000000

# List deployed contracts
conflux-devkit contract list

# Run workflow
conflux-devkit workflow run --file ./workflow.json

# Create workflow
conflux-devkit workflow create --name "Deploy and Verify" --interactive
```

### Programmatic CLI

```typescript
import { createCLI } from '@conflux-devkit/devkit-node';

const cli = createCLI();

// Add custom commands
cli
  .command('custom <action>')
  .description('Custom command')
  .option('-v, --verbose', 'Verbose output')
  .action((action, options) => {
    console.log('Custom action:', action);
    if (options.verbose) {
      console.log('Verbose mode enabled');
    }
  });

// Parse command line arguments
cli.parse(process.argv);
```

## 🔧 Configuration

### Node Configuration

```typescript
const nodeConfig: NodeConfig = {
  chainId: 2029,
  evmChainId: 2030,
  corePort: 12537,
  evmPort: 8545,
  dataDir: './data',
  logLevel: 'info',
  rpcUrl: 'http://localhost:12537',
  evmRpcUrl: 'http://localhost:8545',
};
```

### Deployer Configuration

```typescript
const deployerConfig: DeployerConfig = {
  network: 'evm',
  gasLimit: 1000000n,
  gasPrice: 20000000000n,
  timeout: 300000, // 5 minutes
  retries: 3,
};
```

### Workflow Configuration

```typescript
const workflowConfig: WorkflowConfig = {
  parallel: false,
  timeout: 600000, // 10 minutes
  retries: 3,
  onError: 'stop', // 'stop' | 'continue' | 'retry'
  logging: {
    level: 'info',
    format: 'json',
  },
};
```

## 🔗 Dependencies

- **commander**: CLI framework
- **chalk**: Terminal styling
- **ora**: Spinners and progress indicators
- **@conflux-devkit/core**: Core types and utilities
- **@conflux-devkit/blockchain**: Blockchain interactions
- **@xcfx/node**: Conflux node integration

## 📊 Bundle Size

- **Minified**: ~40KB
- **Gzipped**: ~15KB
- **Tree-shakeable**: Import only what you need

## 🚨 Security Notes

- **Node Security**: Always run nodes in secure environments
- **Private Keys**: Never expose private keys in logs
- **Network Security**: Verify network configurations
- **File Permissions**: Set appropriate file permissions for data directories

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Part of the Conflux DevKit ecosystem** 🚀
