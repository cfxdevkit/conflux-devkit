# @conflux-devkit/contracts

**Version:** 0.1.0  
**Status:** New Package  
**Type:** Contract Utilities

## Purpose
Contract deployment and interaction utilities for Conflux. Provides standard ABIs and type-safe helpers for common operations.

## Key Features
- **Standard ABIs**: ERC20, ERC721, ERC1155 included
- **Deploy Helper**: Simplified contract deployment
- **Read/Write**: Type-safe contract interactions
- **Dual-chain Support**: Works on both Core Space and eSpace

## Exports
```typescript
// ABIs
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '@conflux-devkit/contracts/abis';

// Deployer
import { ContractDeployer } from '@conflux-devkit/contracts/deployer';

// Interaction
import { ContractReader, ContractWriter } from '@conflux-devkit/contracts/interaction';
```

## Usage Example
```typescript
import { ContractDeployer, ERC20_ABI } from '@conflux-devkit/contracts';

const deployer = new ContractDeployer(client);
const address = await deployer.deploy({
  abi: ERC20_ABI,
  bytecode: '0x...',
  args: ['MyToken', 'MTK', 18]
});
```

## Status
Core structure implemented. Additional ABIs and helpers to be added.
