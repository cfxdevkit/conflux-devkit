export interface NetworkConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: string;
  evmChainId?: string;
  currency: {
    name: string;
    symbol: string;
    decimals: string;
  };
  isTestnet: boolean;
  networkType: 'core' | 'evm';
  blockExplorer?: string;
  icon?: string;
  color?: string;
}