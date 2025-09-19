// Unified wallet interface that routes to correct implementation based on network type

import type {
  CoreClient,
  EvmClient,
  NetworkConfig,
  ReadContractParams,
  TransactionRequest,
  UnifiedClient,
  WalletInfo,
  WriteContractParams,
} from '../types/blockchain';

export interface UnifiedWalletInterface {
  // Wallet management
  generateWallet(
    mnemonic: string,
    index: number,
    network: NetworkConfig
  ): Promise<WalletInfo>;
  createWalletFromPrivateKey(
    privateKey: `0x${string}`,
    network: NetworkConfig
  ): Promise<WalletInfo>;
  generateWallets(
    mnemonic: string,
    count: number,
    network: NetworkConfig
  ): Promise<WalletInfo[]>;

  // Wallet operations
  getBalance(wallet: WalletInfo, network: NetworkConfig): Promise<bigint>;
  fundWallet(
    wallet: WalletInfo,
    amount: bigint,
    network: NetworkConfig
  ): Promise<void>;
  setMiningWallet(wallet: WalletInfo, network: NetworkConfig): Promise<void>;

  // Transaction operations
  sendTransaction(
    wallet: WalletInfo,
    transaction: TransactionRequest,
    network: NetworkConfig
  ): Promise<`0x${string}`>;
  signMessage(
    wallet: WalletInfo,
    message: string,
    network: NetworkConfig
  ): Promise<`0x${string}`>;

  // Contract operations
  readContract(
    params: ReadContractParams,
    network: NetworkConfig
  ): Promise<string | number | bigint | boolean | `0x${string}` | unknown[]>;
  writeContract(
    wallet: WalletInfo,
    params: WriteContractParams,
    network: NetworkConfig
  ): Promise<`0x${string}`>;

  // Client access
  getClient(network: NetworkConfig): UnifiedClient;
  getEvmClient(network: NetworkConfig): EvmClient;
  getCoreClient(network: NetworkConfig): CoreClient;
}

export class UnifiedWalletManager implements UnifiedWalletInterface {
  private evmClients: Map<string, EvmClient> = new Map();
  private coreClients: Map<string, CoreClient> = new Map();

  constructor(
    private evmClientFactory: (network: NetworkConfig) => EvmClient,
    private coreClientFactory: (network: NetworkConfig) => CoreClient
  ) {}

  async generateWallet(
    _mnemonic: string,
    _index: number,
    network: NetworkConfig
  ): Promise<WalletInfo> {
    const _client = this.getClient(network);
    // Implementation will be provided by the blockchain package
    throw new Error(
      'generateWallet not implemented - requires blockchain package'
    );
  }

  async createWalletFromPrivateKey(
    _privateKey: `0x${string}`,
    network: NetworkConfig
  ): Promise<WalletInfo> {
    const _client = this.getClient(network);
    // Implementation will be provided by the blockchain package
    throw new Error(
      'createWalletFromPrivateKey not implemented - requires blockchain package'
    );
  }

  async generateWallets(
    mnemonic: string,
    count: number,
    network: NetworkConfig
  ): Promise<WalletInfo[]> {
    const wallets: WalletInfo[] = [];
    for (let i = 0; i < count; i++) {
      const wallet = await this.generateWallet(mnemonic, i, network);
      wallets.push(wallet);
    }
    return wallets;
  }

  async getBalance(
    wallet: WalletInfo,
    network: NetworkConfig
  ): Promise<bigint> {
    const client = this.getClient(network);
    return await client.getBalance({ address: wallet.address });
  }

  async fundWallet(
    _wallet: WalletInfo,
    _amount: bigint,
    _network: NetworkConfig
  ): Promise<void> {
    // This would require a funded account to send from
    throw new Error('fundWallet not implemented - requires funded account');
  }

  async setMiningWallet(
    _wallet: WalletInfo,
    _network: NetworkConfig
  ): Promise<void> {
    // This would require node management capabilities
    throw new Error(
      'setMiningWallet not implemented - requires node management'
    );
  }

  async sendTransaction(
    _wallet: WalletInfo,
    transaction: TransactionRequest,
    network: NetworkConfig
  ): Promise<`0x${string}`> {
    const client = this.getClient(network);
    return await client.sendTransaction(transaction);
  }

  async signMessage(
    _wallet: WalletInfo,
    _message: string,
    _network: NetworkConfig
  ): Promise<`0x${string}`> {
    // This would require wallet client implementation
    throw new Error('signMessage not implemented - requires wallet client');
  }

  async readContract(
    params: ReadContractParams,
    network: NetworkConfig
  ): Promise<string | number | bigint | boolean | `0x${string}` | unknown[]> {
    const client = this.getClient(network);
    return await client.readContract(params);
  }

  async writeContract(
    _wallet: WalletInfo,
    params: WriteContractParams,
    network: NetworkConfig
  ): Promise<`0x${string}`> {
    const client = this.getClient(network);
    return await client.writeContract(params);
  }

  getClient(network: NetworkConfig): UnifiedClient {
    if (network.networkType === 'evm') {
      return this.getEvmClient(network);
    } else {
      return this.getCoreClient(network);
    }
  }

  getEvmClient(network: NetworkConfig): EvmClient {
    const key = `${network.name}-${network.chainId}`;
    if (!this.evmClients.has(key)) {
      this.evmClients.set(key, this.evmClientFactory(network));
    }
    const client = this.evmClients.get(key);
    if (!client) {
      throw new Error(`EVM client not found for network: ${key}`);
    }
    return client;
  }

  getCoreClient(network: NetworkConfig): CoreClient {
    const key = `${network.name}-${network.chainId}`;
    if (!this.coreClients.has(key)) {
      this.coreClients.set(key, this.coreClientFactory(network));
    }
    const client = this.coreClients.get(key);
    if (!client) {
      throw new Error(`Core client not found for network: ${key}`);
    }
    return client;
  }
}

// Factory function to create unified wallet manager
export function createUnifiedWalletManager(
  evmClientFactory: (network: NetworkConfig) => EvmClient,
  coreClientFactory: (network: NetworkConfig) => CoreClient
): UnifiedWalletInterface {
  return new UnifiedWalletManager(evmClientFactory, coreClientFactory);
}
