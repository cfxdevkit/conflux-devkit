/**
 * DevKit - Ergonomic API for Conflux Development
 *
 * This is the main entry point that provides a unified, user-friendly interface
 * for all Conflux development operations including node management, account handling,
 * faucet operations, and contract interactions.
 */

import type { Address as CoreAddress } from 'cive';
import type { Address as EvmAddress } from 'viem';
import { CoreWalletClient } from './clients/core.js';
import { EspaceWalletClient } from './clients/evm.js';
import { ServerManager } from './server/index.js';
import type {
  AccountInfo,
  ChainBalances,
  ChainStatus,
  ContractResult,
  DeployOptions,
  FaucetBalances,
  MiningStatus,
  NodeConfig,
  ReadOptions,
  StartOptions,
  WriteOptions,
} from './types/index.js';

/**
 * DevKitAccount - Convenient wrapper for account operations
 */
export class DevKitAccount {
  private _coreWallet?: CoreWalletClient;
  private _evmWallet?: EspaceWalletClient;

  constructor(
    private accountInfo: AccountInfo,
    private accountIndex: number,
    private devkit: DevKit
  ) {}

  get address(): { core: string; evm: string } {
    return {
      core: this.accountInfo.coreAddress,
      evm: this.accountInfo.evmAddress,
    };
  }

  get privateKey(): string {
    return this.accountInfo.privateKey;
  }

  get evmPrivateKey(): string {
    return this.accountInfo.evmPrivateKey || this.accountInfo.privateKey;
  }

  get index(): number {
    return this.accountIndex;
  }

  /**
   * Get balance for specific chain or both chains
   */
  async getBalance(chain?: 'core' | 'evm'): Promise<string | ChainBalances> {
    if (chain === 'core') {
      // Create a public client to check balance
      const rpcUrls = this.devkit.getRpcUrls();
      const config = this.devkit.getConfig();
      const { CoreClient } = await import('./clients/core.js');
      const coreClient = new CoreClient({
        chainId: config.chainId || 1029,
        rpcUrl: rpcUrls.core,
      });
      return await coreClient.getBalance(this.address.core as CoreAddress);
    } else if (chain === 'evm') {
      const rpcUrls = this.devkit.getRpcUrls();
      const config = this.devkit.getConfig();
      const { EspaceClient } = await import('./clients/evm.js');
      const evmClient = new EspaceClient({
        chainId: config.evmChainId || 1030,
        rpcUrl: rpcUrls.evm,
      });
      return await evmClient.getBalance(this.address.evm as EvmAddress);
    } else {
      // Return both balances
      const [coreBalance, evmBalance] = await Promise.all([
        this.getBalance('core') as Promise<string>,
        this.getBalance('evm') as Promise<string>,
      ]);
      return { core: coreBalance, evm: evmBalance };
    }
  }

  /**
   * Get balances for both chains
   */
  async getBalances(): Promise<ChainBalances> {
    return (await this.getBalance()) as ChainBalances;
  }

  /**
   * Fund this account from the faucet
   */
  async fundFromFaucet(amount: string, chain: 'core' | 'evm'): Promise<string> {
    return await this.devkit.fundAccount(this.address[chain], amount, chain);
  }

  /**
   * Transfer funds to another address
   */
  async transfer(
    to: string,
    amount: string,
    chain: 'core' | 'evm'
  ): Promise<string> {
    if (chain === 'core') {
      return await this.getCoreWallet().sendTransaction({
        to,
        value: BigInt(amount),
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
    } else {
      return await this.getEvmWallet().sendTransaction({
        to,
        value: BigInt(amount),
        gasLimit: 21000n,
        gasPrice: 1000000000n,
      });
    }
  }

  /**
   * Get Core wallet client (lazy initialization)
   */
  get core(): CoreWalletClient {
    return this.getCoreWallet();
  }

  /**
   * Get eSpace wallet client (lazy initialization)
   */
  get evm(): EspaceWalletClient {
    return this.getEvmWallet();
  }

  private getCoreWallet(): CoreWalletClient {
    if (!this._coreWallet) {
      const rpcUrls = this.devkit.getRpcUrls();
      const config = this.devkit.getConfig();
      this._coreWallet = new CoreWalletClient({
        chainId: config.chainId || 1029,
        rpcUrl: rpcUrls.core,
        privateKey: this.privateKey,
      });
    }
    return this._coreWallet;
  }

  private getEvmWallet(): EspaceWalletClient {
    if (!this._evmWallet) {
      const rpcUrls = this.devkit.getRpcUrls();
      const config = this.devkit.getConfig();
      this._evmWallet = new EspaceWalletClient({
        chainId: config.evmChainId || 1030,
        rpcUrl: rpcUrls.evm,
        privateKey: this.privateKey,
      });
    }
    return this._evmWallet;
  }
}

/**
 * DevKit - Main API class for Conflux development
 */
export class DevKit {
  private server: ServerManager;
  private accounts: Map<number, DevKitAccount> = new Map();
  private config: NodeConfig;

  constructor(config: Partial<NodeConfig> = {}) {
    // Set sensible defaults
    this.config = {
      chainId: 1029,
      evmChainId: 1030,
      jsonrpcHttpPort: 12537,
      jsonrpcHttpEthPort: 8545,
      jsonrpcWsPort: 12535,
      log: false,
      ...config,
    };

    this.server = new ServerManager(this.config);
  }

  // ===== Lifecycle Management =====

  /**
   * Start the development node
   */
  async start(options: Partial<StartOptions> = {}): Promise<void> {
    await this.server.start();

    // Initialize accounts
    this.refreshAccounts();

    // Start mining if requested (default: true)
    if (options.mining !== false) {
      await this.server.startMining();
    }

    // Wait for initial blocks if requested
    if (options.waitForBlocks && options.waitForBlocks > 0) {
      await this.mine(options.waitForBlocks);
    }
  }

  /**
   * Stop the development node
   */
  async stop(): Promise<void> {
    await this.server.stop();
  }

  // ===== Account Management =====

  /**
   * Get account by index (creates DevKitAccount wrapper)
   */
  account(index: number): DevKitAccount {
    if (!this.accounts.has(index)) {
      const serverAccounts = this.server.getAccounts();
      if (index >= serverAccounts.length) {
        throw new Error(
          `Account ${index} does not exist. Available accounts: 0-${serverAccounts.length - 1}`
        );
      }

      const accountInfo = serverAccounts[index];
      this.accounts.set(index, new DevKitAccount(accountInfo, index, this));
    }

    const account = this.accounts.get(index);
    if (!account) {
      throw new Error(`Failed to create account ${index}`);
    }
    return account;
  }

  /**
   * Get all available accounts
   */
  getAccounts(): DevKitAccount[] {
    const serverAccounts = this.server.getAccounts();
    return serverAccounts.map((_, index) => this.account(index));
  }

  /**
   * Generate and add a new account
   */
  async addAccount(): Promise<DevKitAccount> {
    const accountInfo = await this.server.addAccount();
    const index = this.server.getAccounts().length - 1;
    const devkitAccount = new DevKitAccount(accountInfo, index, this);
    this.accounts.set(index, devkitAccount);
    return devkitAccount;
  }

  // ===== Faucet Operations =====

  /**
   * Get faucet account balances
   */
  async getFaucetBalances(): Promise<FaucetBalances> {
    return await this.server.getFaucetBalances();
  }

  /**
   * Get faucet account information
   */
  async getFaucetAccount(): Promise<DevKitAccount> {
    const faucetInfo = this.server.getFaucetAccount();
    // Faucet account doesn't have an index, use -1 to indicate it's special
    return new DevKitAccount(faucetInfo, -1, this);
  }

  /**
   * Fund an account using the faucet
   */
  async fundAccount(
    address: string,
    amount: string,
    chain: 'core' | 'evm'
  ): Promise<string> {
    if (chain === 'core') {
      return await this.server.fundCoreAccount(address, amount);
    } else {
      return await this.server.fundEvmAccount(address, amount);
    }
  }

  // ===== Contract Operations =====

  /**
   * Deploy contract to one or both chains
   */
  async deployContract(options: DeployOptions): Promise<ContractResult> {
    const account = this.account(options.account);

    if (options.chains) {
      // Deploy to multiple chains
      const result: ContractResult = {};

      for (const chain of options.chains) {
        if (chain === 'core') {
          result.core = await account.core.deployContract(
            options.abi,
            options.bytecode,
            options.args || []
          );
        } else if (chain === 'evm') {
          result.evm = await account.evm.deployContract(
            options.abi,
            options.bytecode,
            options.args || []
          );
        }
      }

      return result;
    } else if (options.chain) {
      // Deploy to specific chain
      const result: ContractResult = {};

      if (options.chain === 'core') {
        result.core = await account.core.deployContract(
          options.abi,
          options.bytecode,
          options.args || []
        );
      } else {
        result.evm = await account.evm.deployContract(
          options.abi,
          options.bytecode,
          options.args || []
        );
      }

      return result;
    } else {
      throw new Error('Must specify either chain or chains in deploy options');
    }
  }

  /**
   * Read from a contract
   */
  async readContract<T = unknown>(options: ReadOptions): Promise<T> {
    const account = this.account(0); // Use account 0 for read operations

    if (options.chain === 'core') {
      return await account.core.callContract(
        options.address,
        options.abi,
        options.functionName,
        options.args
      );
    } else {
      return await account.evm.callContract(
        options.address,
        options.abi,
        options.functionName,
        options.args
      );
    }
  }

  /**
   * Write to a contract
   */
  async writeContract(options: WriteOptions): Promise<string> {
    const account = this.account(options.account);

    let hash: string;

    if (options.chain === 'core') {
      hash = await account.core.writeContract(
        options.address,
        options.abi,
        options.functionName,
        options.args || [],
        options.value
      );
    } else {
      hash = await account.evm.writeContract(
        options.address,
        options.abi,
        options.functionName,
        options.args || [],
        options.value
      );
    }

    // Wait for confirmation by default
    if (options.waitForConfirmation !== false) {
      if (options.chain === 'core') {
        await account.core.waitForTransaction(hash);
      } else {
        await account.evm.waitForTransaction(hash);
      }
    }

    return hash;
  }

  // ===== Chain Operations =====

  /**
   * Get chain status
   */
  async getStatus(): Promise<ChainStatus> {
    // For now, return server status - can be enhanced later
    return {
      core: { connected: true, status: this.server.getStatus() },
      evm: { connected: true, status: this.server.getStatus() },
    };
  }

  /**
   * Start mining
   */
  async startMining(): Promise<void> {
    await this.server.startMining();
  }

  /**
   * Stop mining
   */
  async stopMining(): Promise<void> {
    await this.server.stopMining();
  }

  /**
   * Mine specific number of blocks
   */
  async mine(blocks: number = 1): Promise<void> {
    await this.server.mine(blocks);
  }

  /**
   * Get mining status
   */
  getMiningStatus(): MiningStatus {
    return this.server.getMiningStatus();
  }

  /**
   * Set mining interval
   */
  async setMiningInterval(interval: number): Promise<void> {
    await this.server.setMiningInterval(interval);
  }

  /**
   * Get Ethereum-compatible admin address derived from mnemonic
   * Uses the standard Ethereum derivation path: m/44'/60'/0'/0/0
   * This address will match what MetaMask and other Ethereum wallets derive
   */
  getEthereumAdminAddress(): string {
    return this.server.getEthereumAdminAddress();
  }

  // ===== Internal Helpers =====

  /**
   * Get current configuration
   */
  getConfig(): NodeConfig {
    return this.config;
  }

  /**
   * Get RPC URLs
   */
  getRpcUrls() {
    return this.server.getRpcUrls();
  }

  /**
   * Refresh account cache when new accounts are added
   */
  private refreshAccounts(): void {
    // Clear cache to force re-creation with updated account list
    this.accounts.clear();
  }
}

// Re-export for convenience
export { ServerManager };
export type {
  AccountInfo,
  ChainBalances,
  ChainStatus,
  ContractResult,
  DeployOptions,
  FaucetBalances,
  MiningStatus,
  NodeConfig,
  ReadOptions,
  StartOptions,
  WriteOptions,
};
