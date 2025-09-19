// Example of browser-safe contract usage

import type { ContractOrchestrator, NetworkConfig } from '@conflux-devkit/core';
import {
  type BrowserContractWrapper,
  browserContractManager,
  type ContractEventOptions,
  type ContractReadOptions,
  type ContractWriteOptions,
  createContract,
  createContractFromAddress,
} from '../index';

/**
 * Example: Complete browser contract workflow
 */
export async function completeBrowserContractWorkflow() {
  // 1. Create contract from orchestrator
  const contract = await createContractFromOrchestrator();

  // 2. Read contract data
  const balance = await contract.readMethod('balanceOf', {
    account: '0x1234567890123456789012345678901234567890',
  });

  // 3. Write contract method
  const transferResult = await contract.writeMethod('transfer', {
    to: '0x9876543210987654321098765432109876543210',
    amount: '1000000000000000000', // 1 token
  });

  // 4. Listen to events
  const unsubscribe = await contract.listenToEvents('Transfer', {}, (log) => {
    console.log('Transfer event:', log);
  });

  // 5. Get contract info
  const info = contract.getInfo();
  console.log('Contract info:', info);

  // 6. Validate contract
  const validation = contract.validate();
  console.log('Contract validation:', validation);

  return {
    contract,
    balance,
    transferResult,
    info,
    validation,
    unsubscribe,
  };
}

/**
 * Example: Create contract from orchestrator
 */
async function createContractFromOrchestrator(): Promise<BrowserContractWrapper> {
  // Mock orchestrator (would come from core package)
  const orchestrator: ContractOrchestrator = {
    id: 'MyToken-evm-mainnet',
    name: 'MyToken',
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    chainType: 'evm',
    networkId: 'evm-mainnet',
    chainId: 1029,
    evmChainId: 1030,

    metadata: {
      name: 'MyToken',
      description: 'A simple ERC20 token',
      category: 'token',
      tags: ['erc20', 'token'],
    },

    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
      },
      {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false },
        ],
        anonymous: false,
      },
    ],

    bytecode: '0x',
    deployedBytecode: '0x',

    methods: {
      read: [],
      write: [],
      events: [],
      constructor: null,
    },

    deployment: {
      transactionHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`,
      blockNumber: 12345n,
      gasUsed: 1000000n,
      deployedAt: new Date(),
      isVerified: false,
    },

    types: {
      generated: true,
    },

    ui: {
      displayName: 'MyToken',
      description: 'A simple ERC20 token',
      category: 'token',
      tags: ['erc20', 'token'],
      isActive: true,
      usageCount: 0,
    },

    capabilities: {
      canRead: true,
      canWrite: true,
      canReceive: false,
      canFallback: false,
      hasEvents: true,
      isUpgradeable: false,
      isPausable: false,
      isOwnable: false,
    },

    network: {
      name: 'Conflux eSpace Mainnet',
      rpcUrl: 'https://evm.confluxrpc.com',
      isTestnet: false,
      currency: {
        name: 'Conflux',
        symbol: 'CFX',
        decimals: 18,
      },
    },
  };

  const networkConfig: NetworkConfig = {
    name: 'Conflux eSpace Mainnet',
    rpcUrl: 'https://evm.confluxrpc.com',
    chainId: 1029,
    evmChainId: 1030,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'evm',
  };

  return createContract(orchestrator, networkConfig);
}

/**
 * Example: Create contract from address and ABI
 */
export function createContractFromAddressExample() {
  const address = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const abi = [
    {
      type: 'function',
      name: 'name',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'symbol',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'decimals',
      inputs: [],
      outputs: [{ name: '', type: 'uint8' }],
      stateMutability: 'view',
    },
  ];

  const networkConfig: NetworkConfig = {
    name: 'Conflux eSpace Mainnet',
    rpcUrl: 'https://evm.confluxrpc.com',
    chainId: 1029,
    evmChainId: 1030,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'evm',
  };

  const contract = createContractFromAddress(
    address,
    abi,
    networkConfig,
    'ERC20Token'
  );

  console.log('Created contract from address:', contract.getInfo());
  return contract;
}

/**
 * Example: Contract interaction patterns
 */
export async function contractInteractionExample() {
  const contract = await createContractFromOrchestrator();

  // Read operations
  const readOptions: ContractReadOptions = {
    blockTag: 'latest',
  };

  const balance = await contract.readMethod(
    'balanceOf',
    {
      account: '0x1234567890123456789012345678901234567890',
    },
    readOptions
  );

  console.log('Balance:', balance);

  // Write operations
  const writeOptions: ContractWriteOptions = {
    gasLimit: '100000',
    gasPrice: '20000000000',
    confirmations: 1,
    waitForReceipt: true,
  };

  const transferResult = await contract.writeMethod(
    'transfer',
    {
      to: '0x9876543210987654321098765432109876543210',
      amount: '1000000000000000000',
    },
    writeOptions
  );

  console.log('Transfer result:', transferResult);

  // Event listening
  const eventOptions: ContractEventOptions = {
    fromBlock: 'latest',
    once: false,
  };

  const unsubscribe = await contract.listenToEvents(
    'Transfer',
    eventOptions,
    (log) => {
      console.log('Transfer event received:', log);
    }
  );

  // Gas estimation
  const gasEstimate = await contract.estimateGas('transfer', {
    to: '0x9876543210987654321098765432109876543210',
    amount: '1000000000000000000',
  });

  console.log('Gas estimate:', gasEstimate);

  // Get balance
  const contractBalance = await contract.getBalance();
  console.log('Contract balance:', contractBalance);

  return {
    balance,
    transferResult,
    gasEstimate,
    contractBalance,
    unsubscribe,
  };
}

/**
 * Example: Contract management and search
 */
export function contractManagementExample() {
  // Search contracts
  const searchResults = browserContractManager.searchContracts('token');
  console.log('Search results:', searchResults);

  // Filter by category
  const tokenContracts = browserContractManager.getContractsByCategory('token');
  console.log('Token contracts:', tokenContracts);

  // Filter by chain type
  const evmContracts = browserContractManager.getContractsByChainType('evm');
  console.log('EVM contracts:', evmContracts);

  // Get most used contracts
  const mostUsed = browserContractManager.getMostUsedContracts(5);
  console.log('Most used contracts:', mostUsed);

  // Get contracts with errors
  const errorContracts = browserContractManager.getContractsWithErrors();
  console.log('Contracts with errors:', errorContracts);

  // Get statistics
  const stats = browserContractManager.getStatistics();
  console.log('Contract statistics:', stats);

  // Get deployment summary
  const summary = browserContractManager.getDeploymentSummary();
  console.log('Deployment summary:', summary);
}

/**
 * Example: Contract validation and error handling
 */
export function contractValidationExample() {
  const contracts = browserContractManager.listContracts();

  for (const contract of contracts) {
    if (!contract.id) continue;
    const wrapper = browserContractManager.getContract(contract.id);
    if (!wrapper) continue;

    const validation = wrapper.validate();
    console.log(`Contract ${contract.name} validation:`, validation);

    if (!validation.isValid) {
      console.log(`Errors: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.log(`Warnings: ${validation.warnings.join(', ')}`);
    }

    if (validation.suggestions.length > 0) {
      console.log(`Suggestions: ${validation.suggestions.join(', ')}`);
    }
  }
}

/**
 * Example: Contract metadata management
 */
export function contractMetadataExample() {
  const contractId = 'MyToken-evm-mainnet';

  // Update contract metadata
  browserContractManager.updateContractMetadata(contractId, {
    name: 'MyToken v2',
    description: 'Updated ERC20 token contract',
    category: 'token',
    tags: ['erc20', 'token', 'v2'],
    icon: '🪙',
    color: '#10B981',
  });

  // Get updated contract
  const updatedContract = browserContractManager.getContract(contractId);
  console.log(
    'Updated contract metadata:',
    updatedContract?.toBrowserSafe().metadata
  );
}

/**
 * Example: Contract interaction tracking
 */
export function contractInteractionTrackingExample() {
  const contractId = 'MyToken-evm-mainnet';

  // Record interactions
  browserContractManager.recordInteraction(
    contractId,
    'balanceOf',
    true,
    '21000'
  );
  browserContractManager.recordInteraction(
    contractId,
    'transfer',
    true,
    '46000'
  );
  browserContractManager.recordInteraction(contractId, 'approve', false, '0');

  // Get interaction summary
  const summary = browserContractManager.getInteractionSummary(contractId);
  console.log('Interaction summary:', summary);

  // Get all interaction summaries
  const allSummaries = browserContractManager.getAllInteractionSummaries();
  console.log('All interaction summaries:', allSummaries);
}

/**
 * Example: Export and import contracts
 */
export function contractExportImportExample() {
  // Export contracts
  const exportedData = browserContractManager.exportContracts();
  console.log('Exported contracts:', exportedData);

  // Import contracts (would be from file or API)
  // browserContractManager.importContracts(exportedData);
}

/**
 * Example: Multiple contract management
 */
export function multipleContractManagementExample() {
  // Create multiple contracts
  const contracts = [
    {
      name: 'Token',
      address: '0x1111111111111111111111111111111111111111' as `0x${string}`,
    },
    {
      name: 'Vault',
      address: '0x2222222222222222222222222222222222222222' as `0x${string}`,
    },
    {
      name: 'Governance',
      address: '0x3333333333333333333333333333333333333333' as `0x${string}`,
    },
  ];

  const networkConfig: NetworkConfig = {
    name: 'Conflux eSpace Mainnet',
    rpcUrl: 'https://evm.confluxrpc.com',
    chainId: 1029,
    evmChainId: 1030,
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: 18,
    },
    isTestnet: false,
    networkType: 'evm',
  };

  const abi = [
    {
      type: 'function',
      name: 'name',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
      stateMutability: 'view',
    },
  ];

  const wrappers = contracts.map((contract) =>
    createContractFromAddress(
      contract.address,
      abi,
      networkConfig,
      contract.name
    )
  );

  console.log(
    'Created multiple contracts:',
    wrappers.map((w) => w.getInfo())
  );

  // Get all contracts
  const allContracts = browserContractManager.listContracts();
  console.log('All contracts:', allContracts.length);

  // Search across all contracts
  const searchResults = browserContractManager.searchContracts('Token');
  console.log('Search results:', searchResults);

  return wrappers;
}
