# @conflux-devkit/contracts

Contract deployment and interaction utilities for Conflux blockchain, supporting both Core Space and eSpace.

## Installation

```bash
npm install @conflux-devkit/contracts
# or
pnpm add @conflux-devkit/contracts
```

## Features

- **Contract Deployment**: Deploy contracts to Core Space, eSpace, or both
- **Contract Interaction**: Read and write operations with full type safety
- **Multi-Chain Support**: Seamless deployment and interaction across chains
- **Gas Estimation**: Accurate gas cost predictions
- **Bytecode Verification**: Verify deployed contract bytecode
- **Standard ABIs**: Pre-packaged ABIs for common standards (ERC20, ERC721, etc.)

## Usage

### Contract Deployment

Deploy contracts to one or multiple chains with ease.

```typescript
import { ContractDeployer } from '@conflux-devkit/contracts';

const deployer = new ContractDeployer(clientManager);

// Deploy to eSpace
const result = await deployer.deploy({
  bytecode: '0x6080604052...',
  abi: contractABI,
  chain: 'evm',
  args: ['Constructor', 'Arguments'],
  value: 1000000000000000000n, // Optional: send CFX with deployment
});

console.log(`Deployed to: ${result.address}`);
console.log(`Transaction: ${result.transactionHash}`);
console.log(`Block: ${result.blockNumber}`);

// Deploy to Core Space
const coreResult = await deployer.deploy({
  bytecode: '0x6080604052...',
  abi: contractABI,
  chain: 'core',
  args: ['Constructor', 'Arguments'],
});

console.log(`Core address: ${coreResult.address}`); // cfx:...
```

### Multi-Chain Deployment

Deploy the same contract to multiple chains simultaneously.

```typescript
// Deploy to both chains
const multiResult = await deployer.deployToMultipleChains({
  bytecode: '0x6080604052...',
  abi: contractABI,
  chains: ['core', 'evm'],
  args: ['Constructor', 'Arguments'],
});

console.log(`Success: ${multiResult.successCount}/${multiResult.successCount + multiResult.failureCount}`);

if (multiResult.core) {
  console.log(`Core Space: ${multiResult.core.address}`);
}

if (multiResult.evm) {
  console.log(`eSpace: ${multiResult.evm.address}`);
}

// Check for failures
if (multiResult.failureCount > 0) {
  console.error('Some deployments failed:', multiResult.errors);
}
```

### Gas Estimation

Estimate deployment costs before deploying.

```typescript
const estimatedGas = await deployer.estimateDeploymentGas({
  bytecode: '0x6080604052...',
  abi: contractABI,
  chain: 'evm',
  args: ['Constructor', 'Arguments'],
});

console.log(`Estimated gas: ${estimatedGas}`);

// Calculate cost
const gasPrice = await clientManager.getEvmClient().getGasPrice();
const cost = estimatedGas * gasPrice;
console.log(`Estimated cost: ${cost} Drip`);
```

### Contract Interaction - Reading

Read contract state without gas costs.

```typescript
import { ContractReader } from '@conflux-devkit/contracts';

const reader = new ContractReader(clientManager);

// Read ERC20 token name
const name = await reader.read({
  address: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355',
  abi: ERC20_ABI,
  functionName: 'name',
  chain: 'evm',
});

console.log(`Token name: ${name}`);

// Read with arguments
const balance = await reader.read({
  address: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355',
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: ['0xUserAddress'],
  chain: 'evm',
});

console.log(`Balance: ${balance}`);

// Read from Core Space
const coreBalance = await reader.read({
  address: 'cfx:...',
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: ['cfx:useraddress'],
  chain: 'core',
});
```

### Contract Interaction - Writing

Execute state-changing contract functions.

```typescript
import { ContractWriter } from '@conflux-devkit/contracts';

const writer = new ContractWriter(clientManager);

// Transfer ERC20 tokens
const txHash = await writer.write({
  address: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355',
  abi: ERC20_ABI,
  functionName: 'transfer',
  args: ['0xRecipient', 1000000000000000000n],
  chain: 'evm',
});

console.log(`Transaction: ${txHash}`);

// Wait for confirmation
const receipt = await writer.waitForTransaction(txHash, 'evm');
console.log(`Confirmed in block: ${receipt.blockNumber}`);

// Write with value (payable function)
const mintHash = await writer.write({
  address: '0xNFTContract',
  abi: NFT_ABI,
  functionName: 'mint',
  args: [1], // Token ID
  value: 100000000000000000n, // 0.1 CFX
  chain: 'evm',
});
```

### Standard ABIs

Use pre-packaged ABIs for common standards.

```typescript
import {
  ERC20_ABI,
  ERC721_ABI,
  ERC1155_ABI
} from '@conflux-devkit/contracts/abis';

// Use standard ABIs directly
const tokenName = await reader.read({
  address: '0xTokenAddress',
  abi: ERC20_ABI,
  functionName: 'name',
  chain: 'evm',
});

const nftOwner = await reader.read({
  address: '0xNFTAddress',
  abi: ERC721_ABI,
  functionName: 'ownerOf',
  args: [1], // Token ID
  chain: 'evm',
});
```

### Bytecode Verification

Verify that deployed bytecode matches expected bytecode.

```typescript
const isVerified = await deployer.verifyBytecode(
  '0xContractAddress',
  expectedBytecode,
  'evm',
);

if (isVerified) {
  console.log('Contract bytecode verified!');
} else {
  console.error('Bytecode mismatch!');
}
```

## API Reference

### ContractDeployer

#### Methods

- `deploy(params: DeployParams): Promise<DeploymentResult>`
- `deployToMultipleChains(params: MultiChainDeployParams): Promise<MultiChainDeploymentResult>`
- `estimateDeploymentGas(params: DeployParams): Promise<bigint>`
- `verifyBytecode(address: string, expectedBytecode: string, chain: ChainType): Promise<boolean>`

#### Types

```typescript
interface DeployParams {
  bytecode: string;
  abi: any[];
  chain: 'core' | 'evm';
  args?: any[];
  value?: bigint;
  gasLimit?: bigint;
}

interface DeploymentResult {
  address: string;
  transactionHash: string;
  blockNumber: bigint;
  deployer: string;
  chain: 'core' | 'evm';
  deployedAt: Date;
}

interface MultiChainDeploymentResult {
  core?: DeploymentResult;
  evm?: DeploymentResult;
  successCount: number;
  failureCount: number;
  errors?: { chain: ChainType; error: Error }[];
}
```

### ContractReader

#### Methods

- `read(params: ReadParams): Promise<any>`

#### Types

```typescript
interface ReadParams {
  address: string;
  abi: any[];
  functionName: string;
  args?: any[];
  chain: 'core' | 'evm';
  blockTag?: 'latest' | 'pending' | bigint;
}
```

### ContractWriter

#### Methods

- `write(params: WriteParams): Promise<string>`
- `waitForTransaction(hash: string, chain: ChainType): Promise<TransactionReceipt>`

#### Types

```typescript
interface WriteParams {
  address: string;
  abi: any[];
  functionName: string;
  args?: any[];
  chain: 'core' | 'evm';
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
}
```

## Standard ABIs

The package includes ABIs for common token standards:

- `ERC20_ABI` - Fungible token standard
- `ERC721_ABI` - Non-fungible token standard
- `ERC1155_ABI` - Multi-token standard

Import from:
```typescript
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '@conflux-devkit/contracts/abis';
```

## Testing

```bash
pnpm test
```

See [test files](./src/) for comprehensive usage examples.

## Examples

Check out the [simple-dapp example](../../examples/simple-dapp) for a complete integration example.

## License

Apache-2.0

## Related Packages

- [@conflux-devkit/core](../core) - Core blockchain clients
- [@conflux-devkit/wallet](../wallet) - Wallet abstraction
- [@conflux-devkit/ui-headless](../ui-headless) - React components
