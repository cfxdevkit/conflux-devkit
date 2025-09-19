export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ContractConfig {
  address: string;
  abi: any[];
  networks: string[];
}

export interface ContractConfiguration {
  networks: Record<string, NetworkConfig>;
  contracts: Record<string, ContractConfig>;
  generatedAt: string;
}

declare const contractConfig: ContractConfiguration;
export default contractConfig;
