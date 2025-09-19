// UI-friendly contract representation and visualization helpers

import type {
  ContractDeploymentSummary,
  ContractInteractionSummary,
  ContractOrchestrator,
} from '../types/contract-orchestration';

/**
 * Create UI-friendly contract card data
 */
export function createContractCard(contract: ContractOrchestrator): {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  address: string;
  network: string;
  chainType: 'core' | 'evm';
  category: string;
  tags: string[];
  icon?: string;
  color?: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: {
    canRead: boolean;
    canWrite: boolean;
    hasEvents: boolean;
  };
  methods: {
    read: number;
    write: number;
    events: number;
  };
  lastActivity?: string;
  gasEstimate?: string;
  value?: string;
  error?: string;
} {
  return {
    id: contract.id,
    title: contract.ui.displayName || 'Unknown Contract',
    subtitle: contract.address,
    description: generateContractDescription(contract),
    address: contract.address,
    network: contract.ui.displayName, // Using displayName as network identifier
    chainType: contract.chainType,
    category: categorizeContract(contract),
    tags: generateContractTags(contract),
    icon: getContractIcon(contract),
    color: getContractColor(contract),
    status: getContractStatus(contract),
    capabilities: {
      canRead: contract.capabilities.canRead,
      canWrite: contract.capabilities.canWrite,
      hasEvents: contract.capabilities.hasEvents,
    },
    methods: {
      read: contract.methods.read.length,
      write: contract.methods.write.length,
      events: contract.methods.events.length,
    },
    lastActivity: contract.ui.lastUsed?.toISOString(),
    gasEstimate: contract.deployment.gasUsed.toString(),
    value: '0', // Not available in current interface
    error: contract.types.error,
  };
}

/**
 * Create contract interaction summary
 */
export function createInteractionSummary(
  contract: ContractOrchestrator
): ContractInteractionSummary {
  return {
    contractId: contract.id,
    contractName: contract.ui.displayName,
    totalCalls: 0, // This would be tracked in real usage
    readCalls: 0,
    writeCalls: 0,
    eventLogs: 0,
    lastInteraction: new Date(),
    successRate: 100, // This would be calculated from actual calls
    averageGasUsed: contract.deployment.gasUsed,
    totalGasUsed: 0n,
    errors: [],
  };
}

/**
 * Create contract deployment summary
 */
export function createDeploymentSummary(
  contract: ContractOrchestrator
): ContractDeploymentSummary {
  return {
    totalContracts: 1,
    byChainType: {
      evm: contract.chainType === 'evm' ? 1 : 0,
      core: contract.chainType === 'core' ? 1 : 0,
    },
    byNetwork: {
      [contract.ui.displayName]: 1,
    },
    byCategory: {
      [categorizeContract(contract)]: 1,
    },
    recentlyDeployed: [contract],
    mostUsed: [contract],
    withErrors: contract.types.error ? [contract] : [],
  };
}

/**
 * Generate contract description based on capabilities and methods
 */
function generateContractDescription(contract: ContractOrchestrator): string {
  const parts: string[] = [];

  if (contract.capabilities.canRead) {
    parts.push(
      `${contract.methods.read.length} read method${
        contract.methods.read.length !== 1 ? 's' : ''
      }`
    );
  }

  if (contract.capabilities.canWrite) {
    parts.push(
      `${contract.methods.write.length} write method${
        contract.methods.write.length !== 1 ? 's' : ''
      }`
    );
  }

  if (contract.capabilities.hasEvents) {
    parts.push(
      `${contract.methods.events.length} event${
        contract.methods.events.length !== 1 ? 's' : ''
      }`
    );
  }

  const capabilities = [];
  if (contract.capabilities.isUpgradeable) capabilities.push('upgradeable');
  if (contract.capabilities.isPausable) capabilities.push('pausable');
  if (contract.capabilities.isOwnable) capabilities.push('ownable');

  if (capabilities.length > 0) {
    parts.push(`Features: ${capabilities.join(', ')}`);
  }

  return parts.join(' • ') || 'Smart contract deployed on Conflux network';
}

/**
 * Categorize contract based on name and capabilities
 */
function categorizeContract(contract: ContractOrchestrator): string {
  const name = contract.ui.displayName?.toLowerCase() || '';

  if (
    name.includes('token') ||
    name.includes('erc20') ||
    name.includes('erc721') ||
    name.includes('erc1155')
  ) {
    return 'Token';
  }
  if (name.includes('nft')) {
    return 'NFT';
  }
  if (name.includes('swap') || name.includes('dex')) {
    return 'DeFi';
  }
  if (name.includes('governance') || name.includes('dao')) {
    return 'Governance';
  }
  if (name.includes('vault') || name.includes('lending')) {
    return 'DeFi';
  }
  if (name.includes('marketplace')) {
    return 'Marketplace';
  }
  if (name.includes('game') || name.includes('gaming')) {
    return 'Gaming';
  }

  return 'Smart Contract';
}

/**
 * Generate tags for contract
 */
function generateContractTags(contract: ContractOrchestrator): string[] {
  const tags: string[] = [];

  // Network tags
  tags.push(contract.ui.displayName);
  tags.push(contract.chainType.toUpperCase());

  // Capability tags
  if (contract.capabilities.canRead) tags.push('Read');
  if (contract.capabilities.canWrite) tags.push('Write');
  if (contract.capabilities.hasEvents) tags.push('Events');
  if (contract.capabilities.isUpgradeable) tags.push('Upgradeable');
  if (contract.capabilities.isPausable) tags.push('Pausable');
  if (contract.capabilities.isOwnable) tags.push('Ownable');

  // Method count tags
  if (contract.methods.read.length > 5) tags.push('Read-Heavy');
  if (contract.methods.write.length > 5) tags.push('Write-Heavy');
  if (contract.methods.events.length > 3) tags.push('Event-Rich');

  return tags;
}

/**
 * Get contract icon based on category
 */
function getContractIcon(contract: ContractOrchestrator): string {
  const category = categorizeContract(contract);

  switch (category) {
    case 'Token':
      return '🪙';
    case 'NFT':
      return '🖼️';
    case 'DeFi':
      return '💱';
    case 'Governance':
      return '🏛️';
    case 'Marketplace':
      return '🛒';
    case 'Gaming':
      return '🎮';
    default:
      return '📄';
  }
}

/**
 * Get contract color based on category
 */
function getContractColor(contract: ContractOrchestrator): string {
  const category = categorizeContract(contract);

  switch (category) {
    case 'Token':
      return '#f59e0b'; // amber
    case 'NFT':
      return '#8b5cf6'; // violet
    case 'DeFi':
      return '#10b981'; // emerald
    case 'Governance':
      return '#3b82f6'; // blue
    case 'Marketplace':
      return '#f97316'; // orange
    case 'Gaming':
      return '#ec4899'; // pink
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get contract status
 */
function getContractStatus(
  contract: ContractOrchestrator
): 'active' | 'inactive' | 'error' {
  if (contract.types.error) return 'error';
  if (contract.capabilities.canRead || contract.capabilities.canWrite)
    return 'active';
  return 'inactive';
}

/**
 * Generate verification URL for contract
 */
function _generateVerificationUrl(contract: ContractOrchestrator): string {
  const baseUrl = getExplorerUrl(contract);
  return `${baseUrl}/address/${contract.address}#code`;
}

/**
 * Get explorer URL for network
 */
function getExplorerUrl(contract: ContractOrchestrator): string {
  switch (contract.ui.displayName) {
    case 'mainnet':
      return 'https://confluxscan.net';
    case 'testnet':
      return 'https://testnet.confluxscan.net';
    case 'local':
      return 'http://localhost:12537/explorer';
    default:
      return 'https://confluxscan.net';
  }
}

/**
 * Create contract method card data
 */
export function createMethodCard(method: {
  name: string;
  type: string;
  stateMutability?: string;
  inputs: unknown[];
  outputs: unknown[];
}): {
  name: string;
  type: string;
  category: 'read' | 'write' | 'event' | 'constructor';
  inputs: number;
  outputs: number;
  isPayable: boolean;
  isView: boolean;
  isPure: boolean;
  description: string;
  icon: string;
  color: string;
} {
  const category =
    method.type === 'function'
      ? method.stateMutability === 'view' || method.stateMutability === 'pure'
        ? 'read'
        : 'write'
      : (method.type as 'event' | 'constructor');

  return {
    name: method.name,
    type: method.type,
    category,
    inputs: method.inputs.length,
    outputs: method.outputs.length,
    isPayable: method.stateMutability === 'payable',
    isView: method.stateMutability === 'view',
    isPure: method.stateMutability === 'pure',
    description: generateMethodDescription(method),
    icon: getMethodIcon(category),
    color: getMethodColor(category),
  };
}

/**
 * Generate method description
 */
function generateMethodDescription(method: {
  name: string;
  type: string;
  stateMutability?: string;
  inputs: unknown[];
  outputs: unknown[];
}): string {
  const parts: string[] = [];

  if (method.inputs.length > 0) {
    parts.push(
      `${method.inputs.length} parameter${method.inputs.length !== 1 ? 's' : ''}`
    );
  }

  if (method.outputs.length > 0) {
    parts.push(
      `${method.outputs.length} return value${
        method.outputs.length !== 1 ? 's' : ''
      }`
    );
  }

  if (method.stateMutability) {
    parts.push(method.stateMutability);
  }

  return parts.join(' • ') || 'Contract method';
}

/**
 * Get method icon
 */
function getMethodIcon(category: string): string {
  switch (category) {
    case 'read':
      return '👁️';
    case 'write':
      return '✏️';
    case 'event':
      return '📡';
    case 'constructor':
      return '🏗️';
    default:
      return '⚙️';
  }
}

/**
 * Get method color
 */
function getMethodColor(category: string): string {
  switch (category) {
    case 'read':
      return '#3b82f6'; // blue
    case 'write':
      return '#ef4444'; // red
    case 'event':
      return '#10b981'; // emerald
    case 'constructor':
      return '#8b5cf6'; // violet
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Create contract event card data
 */
export function createEventCard(event: { name: string; inputs: unknown[] }): {
  name: string;
  inputs: number;
  description: string;
  icon: string;
  color: string;
} {
  return {
    name: event.name,
    inputs: event.inputs.length,
    description: generateEventDescription(event),
    icon: '📡',
    color: '#10b981', // emerald
  };
}

/**
 * Generate event description
 */
function generateEventDescription(event: {
  name: string;
  inputs: unknown[];
}): string {
  if (event.inputs.length === 0) {
    return 'No parameters';
  }
  return `${event.inputs.length} parameter${
    event.inputs.length !== 1 ? 's' : ''
  }`;
}

/**
 * Create contract interaction form data
 */
export function createInteractionForm(contract: ContractOrchestrator): {
  contractAddress: string;
  contractName: string;
  methods: Array<{
    name: string;
    type: 'read' | 'write';
    inputs: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
    outputs: Array<{
      name: string;
      type: string;
    }>;
  }>;
  events: Array<{
    name: string;
    inputs: Array<{
      name: string;
      type: string;
      indexed: boolean;
    }>;
  }>;
} {
  return {
    contractAddress: contract.address,
    contractName: contract.ui.displayName,
    methods: [
      ...contract.methods.read.map((m) => ({
        name: m.name,
        type: 'read' as const,
        inputs: m.inputs.map((input) => ({
          name: input.name || 'unnamed',
          type: input.type,
          required: true,
        })),
        outputs: m.outputs.map((output) => ({
          name: output.name || 'unnamed',
          type: output.type,
        })),
      })),
      ...contract.methods.write.map((m) => ({
        name: m.name,
        type: 'write' as const,
        inputs: m.inputs.map((input) => ({
          name: input.name || 'unnamed',
          type: input.type,
          required: true,
        })),
        outputs: m.outputs.map((output) => ({
          name: output.name || 'unnamed',
          type: output.type,
        })),
      })),
    ],
    events: contract.methods.events.map((e) => ({
      name: e.name,
      inputs: e.inputs.map((input) => ({
        name: input.name || 'unnamed',
        type: input.type,
        indexed: input.indexed || false,
      })),
    })),
  };
}

/**
 * Create contract analytics data
 */
export function createAnalyticsData(contract: ContractOrchestrator): {
  contractAddress: string;
  contractName: string;
  totalMethods: number;
  readMethods: number;
  writeMethods: number;
  events: number;
  capabilities: string[];
  complexity: 'low' | 'medium' | 'high';
  gasEstimate: string;
  bytecodeSize: number;
  abiSize: number;
} {
  const totalMethods =
    contract.methods.read.length + contract.methods.write.length;
  const capabilities = [];

  if (contract.capabilities.canRead) capabilities.push('Read');
  if (contract.capabilities.canWrite) capabilities.push('Write');
  if (contract.capabilities.hasEvents) capabilities.push('Events');
  if (contract.capabilities.isUpgradeable) capabilities.push('Upgradeable');
  if (contract.capabilities.isPausable) capabilities.push('Pausable');
  if (contract.capabilities.isOwnable) capabilities.push('Ownable');

  let complexity: 'low' | 'medium' | 'high' = 'low';
  if (totalMethods > 20) complexity = 'high';
  else if (totalMethods > 10) complexity = 'medium';

  return {
    contractAddress: contract.address,
    contractName: contract.ui.displayName,
    totalMethods,
    readMethods: contract.methods.read.length,
    writeMethods: contract.methods.write.length,
    events: contract.methods.events.length,
    capabilities,
    complexity,
    gasEstimate: contract.deployment.gasUsed.toString(),
    bytecodeSize: contract.bytecode.length,
    abiSize: contract.abi.length,
  };
}

/**
 * Create contract suggestions for improvement
 */
export function createContractSuggestions(
  contract: ContractOrchestrator
): string[] {
  const suggestions: string[] = [];

  if (!contract.capabilities.canRead && !contract.capabilities.canWrite) {
    suggestions.push(
      'Consider adding read or write methods to make the contract functional'
    );
  }

  if (contract.methods.read.length === 0 && contract.capabilities.canWrite) {
    suggestions.push('Add view functions to allow reading contract state');
  }

  if (contract.methods.events.length === 0) {
    suggestions.push('Consider adding events for better off-chain monitoring');
  }

  if (!contract.capabilities.isOwnable && contract.methods.write.length > 0) {
    suggestions.push('Consider adding access control for write methods');
  }

  if (contract.methods.write.length > 0 && !contract.capabilities.isPausable) {
    suggestions.push(
      'Consider adding pausable functionality for emergency situations'
    );
  }

  if (contract.bytecode.length > 100000) {
    suggestions.push('Consider optimizing bytecode size for gas efficiency');
  }

  return suggestions;
}
