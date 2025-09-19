import type { NetworkConfig } from './network';

export interface ContractMethod {
  name: string;
  type: 'read' | 'write';
  inputs: ContractInput[];
  outputs: ContractOutput[];
  stateMutability: 'view' | 'pure' | 'nonpayable' | 'payable';
  payable?: boolean;
  constant?: boolean;
}

export interface ContractInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
}

export interface ContractOutput {
  name: string;
  type: string;
  internalType?: string;
}

export interface ContractEvent {
  name: string;
  inputs: ContractInput[];
  anonymous: boolean;
}

export interface ContractCapabilities {
  read: boolean;
  write: boolean;
  events: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  hasEvents?: boolean;
  canReceive?: boolean;
  canFallback?: boolean;
  isUpgradeable?: boolean;
  isPausable?: boolean;
  isOwnable?: boolean;
}

export interface ContractMetadata {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  source?: string;
  tags?: string[];
  category?: string;
  icon?: string;
  color?: string;
  website?: string;
  documentation?: string;
}

export interface ContractDeployment {
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  deployedAt?: string;
  isVerified?: boolean;
  verificationStatus?: string;
}

export interface ContractUI {
  displayName?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  tags?: string[];
  isActive?: boolean;
  lastUsed?: string;
  usageCount?: number;
}

export interface DeployedContract {
  id: string;
  name: string;
  address: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: string | number;
  evmChainId?: string | number;
  network: NetworkConfig;
  methods: {
    read: ContractMethod[];
    write: ContractMethod[];
    events: ContractEvent[];
  };
  capabilities: ContractCapabilities;
  metadata?: ContractMetadata;
  deployment?: ContractDeployment;
  ui?: ContractUI;
  createdAt: Date;
  updatedAt: Date;
}