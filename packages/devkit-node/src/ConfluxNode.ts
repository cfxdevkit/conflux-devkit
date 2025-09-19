// Dynamic imports for ESM/CJS compatibility will be handled in the class methods
import { createServer } from '@xcfx/node';
import { BIP32Factory } from 'bip32';
import { mnemonicToSeed, validateMnemonic } from 'bip39';
import chalk from 'chalk';
import { privateKeyToAccount as corePrivateKeyToAccount } from 'cive/accounts';
import * as ecc from 'tiny-secp256k1';
import { privateKeyToAccount as espacePrivateKeyToAccount } from 'viem/accounts';
import type {
  ExecutionResult,
  NodeConfig,
  NodeStatus,
  WalletInfo,
} from './types';

const bip32 = BIP32Factory(ecc);

export class ConfluxNode {
  private server: unknown = null;
  private coreClient: any = null;
  private evmClient: any = null;
  private originalConsole: Record<string, unknown> = {};
  private isSilent: boolean = false;
  private wallets: WalletInfo[] = [];
  private mnemonic?: string;
  private privateKey?: string;
  private walletMode: 'mnemonic' | 'privatekey' = 'mnemonic';
  private miningWallet: WalletInfo | null = null;

  constructor() {
    this.setupConsoleOverride();
  }

  private setupConsoleOverride() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
  }

  private enableSilentMode() {
    this.isSilent = true;
    // Override console methods to suppress output
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
  }

  private disableSilentMode() {
    this.isSilent = false;
    // Restore original console methods
    Object.assign(console, this.originalConsole);
  }

  /**
   * Derives a private key from the mnemonic using a derivation path
   */
  private async derivePrivateKey(derivationPath: string): Promise<string> {
    if (!this.mnemonic) {
      throw new Error('Mnemonic not available');
    }

    if (!validateMnemonic(this.mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    const seed = await mnemonicToSeed(this.mnemonic);
    const root = bip32.fromSeed(Buffer.from(seed));
    const child = root.derivePath(derivationPath);

    if (!child.privateKey) {
      throw new Error('Unable to derive private key');
    }

    return `0x${child.privateKey.toString('hex')}`;
  }

  /**
   * Gets a Core private key for the specified index
   */
  private async getCorePrivateKey(index: number): Promise<string> {
    return this.derivePrivateKey(`m/44'/503'/0'/0/${index}`);
  }

  /**
   * Gets an eSpace private key for the specified index
   */
  private async getEspacePrivateKey(index: number): Promise<string> {
    return this.derivePrivateKey(`m/44'/60'/0'/0/${index}`);
  }

  /**
   * Gets a Core address for the specified index
   */
  private async getCoreAddress(
    index: number,
    networkId?: number
  ): Promise<string> {
    const privateKey = await this.getCorePrivateKey(index);
    return corePrivateKeyToAccount(privateKey as `0x${string}`, {
      networkId: networkId || 2029,
    }).address;
  }

  /**
   * Gets an eSpace address for the specified index
   */
  private async getEspaceAddress(index: number): Promise<string> {
    const privateKey = await this.getEspacePrivateKey(index);
    return espacePrivateKeyToAccount(privateKey as `0x${string}`).address;
  }

  /**
   * Initialize wallets based on the configured mode
   */
  private async initializeWallets(config: NodeConfig): Promise<void> {
    const {
      walletMode = 'mnemonic',
      mnemonic,
      privateKey,
      walletCount = 10,
    } = config;

    this.walletMode = walletMode;
    this.wallets = [];

    if (walletMode === 'mnemonic') {
      this.mnemonic =
        mnemonic ||
        process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC ||
        'test test test test test test test test test test test junk';

      if (!this.isSilent) {
        console.log(
          chalk.blue(`🔑 Initializing ${walletCount} wallets from mnemonic...`)
        );
      }

      // Generate wallets
      for (let i = 0; i < walletCount; i++) {
        const _corePrivateKey = await this.getCorePrivateKey(i);
        const espacePrivateKey = await this.getEspacePrivateKey(i);
        const _coreAddress = await this.getCoreAddress(i);
        const espaceAddress = await this.getEspaceAddress(i);

        this.wallets.push({
          index: i,
          address: espaceAddress as `0x${string}`, // Use eSpace address as primary
          privateKey: espacePrivateKey as `0x${string}`,
          isMining: i === 0,
        });
      }

      // Set mining wallet
      this.miningWallet = this.wallets[0];

      if (!this.isSilent) {
        console.log(
          chalk.blue(`⛏️  Mining address set to: ${this.miningWallet.address}`)
        );
      }
    } else if (walletMode === 'privatekey') {
      if (!privateKey) {
        throw new Error("Private key is required for 'privatekey' wallet mode");
      }

      this.privateKey = privateKey;

      if (!this.isSilent) {
        console.log(
          chalk.blue('🔑 Initializing single wallet from private key...')
        );
      }

      // Create single wallet from private key
      const account = espacePrivateKeyToAccount(privateKey as `0x${string}`);

      this.wallets.push({
        index: 0,
        address: account.address,
        privateKey: privateKey as `0x${string}`,
        isMining: true,
      });

      this.miningWallet = this.wallets[0];

      if (!this.isSilent) {
        console.log(
          chalk.blue(`⛏️  Mining address set to: ${this.miningWallet.address}`)
        );
      }
    }
  }

  /**
   * Fund wallets with initial balance
   */
  private async fundWallets(): Promise<void> {
    if (!this.coreClient || !this.evmClient) {
      if (!this.isSilent) {
        console.log('⚠️  Clients not available, skipping wallet funding');
      }
      return;
    }

    if (!this.isSilent) {
      console.log('💰 Funding wallets...');
    }

    try {
      // In a local development node, the mining wallet should already have funds
      // from the genesis block. We just need to verify and distribute if needed.

      if (this.wallets.length > 0 && this.miningWallet) {
        // Check if mining wallet has balance
        const miningBalance = await this.evmClient?.getBalance({
          address: this.miningWallet.address as `0x${string}`,
        });

        if (miningBalance > 0n) {
          if (!this.isSilent) {
            console.log(
              `✅ Mining wallet ${
                this.miningWallet.address
              } has ${miningBalance.toString()} wei`
            );
          }

          // Update mining wallet balance
          this.miningWallet.balance = miningBalance;
          this.miningWallet.balanceFormatted = (
            miningBalance / 1000000000000000000n
          ).toString(); // Convert to ETH

          // If we have multiple wallets, distribute some funds
          if (this.wallets.length > 1) {
            const distributionAmount = 100000000000000000000n; // 0.1 ETH each

            for (let i = 1; i < this.wallets.length; i++) {
              const wallet = this.wallets[i];

              try {
                // Create a simple transfer transaction
                const { createWalletClient, http } = await import('viem');

                const walletClient = createWalletClient({
                  account: this.miningWallet.privateKey as `0x${string}`,
                  transport: http(`http://127.0.0.1:8545`),
                });

                const txHash = await walletClient.sendTransaction({
                  to: wallet.address as `0x${string}`,
                  value: distributionAmount,
                  chain: null,
                });

                // Wait for transaction to be mined
                await this.evmClient?.getTransactionReceipt({ hash: txHash });

                // Update wallet balance
                const balance = await this.evmClient?.getBalance({
                  address: wallet.address as `0x${string}`,
                });
                wallet.balance = balance;
                wallet.balanceFormatted = (
                  balance / 1000000000000000000n
                ).toString(); // Convert to ETH

                if (!this.isSilent) {
                  console.log(
                    `✅ Funded wallet ${wallet.address} with ${(
                      distributionAmount / 1000000000000000000n
                    ).toString()} ETH`
                  );
                }
              } catch (error) {
                if (!this.isSilent) {
                  console.error(
                    `❌ Failed to fund wallet ${wallet.address}:`,
                    error
                  );
                }
              }
            }
          }
        } else {
          if (!this.isSilent) {
            console.log('⚠️  Mining wallet has no balance, skipping funding');
          }
        }
      }
    } catch (error) {
      if (!this.isSilent) {
        console.error('❌ Failed to fund wallets:', error);
      }
    }
  }

  async start(config: Partial<NodeConfig> = {}): Promise<void> {
    const {
      corePort = 12537,
      evmPort = 8545,
      blockInterval = 1000,
      chainId = 2029,
      evmChainId = 2030,
      dataDir = '.conflux-dev',
      silent = false,
      fundWallets = true,
    } = config;

    if (silent) {
      this.enableSilentMode();
    }

    try {
      // Initialize wallets first
      await this.initializeWallets(config);

      // Create server configuration
      const serverConfig = {
        jsonrpcHttpPort: corePort,
        jsonrpcHttpEthPort: evmPort,
        devBlockIntervalMs: blockInterval,
        chainId,
        evmChainId,
        genesisSecrets: this.wallets.map(w => w.privateKey as `0x${string}`),
        genesisEvmSecrets: this.wallets.map(w => w.privateKey as `0x${string}`),
        miningAuthor: this.miningWallet?.address,
        log: !silent,
        dataDir,
        ...(silent && {
          logLevel: 'error',
          disableLogging: true,
        }),
      };

      // Create and start server
      this.server = await createServer(serverConfig);
      await (this.server as { start(): Promise<void> }).start();

      // Create clients using our custom implementations
      const networkConfig = {
        name: 'local',
        rpcUrl: `http://127.0.0.1:${corePort}`,
        chainId: 2029,
        evmChainId: 2030,
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: false,
        networkType: 'core' as const,
      };

      // Dynamic import for ESM/CJS compatibility
      try {
        const blockchainModule = await import('@conflux-devkit/blockchain');
        const CoreClientClass =
          blockchainModule.CoreClient || blockchainModule.default?.CoreClient;
        const EvmClientClass =
          blockchainModule.EvmClient || blockchainModule.default?.EvmClient;

        if (CoreClientClass && EvmClientClass) {
          this.coreClient = new CoreClientClass();
          this.evmClient = new EvmClientClass(networkConfig);
        } else {
          console.warn(
            'CoreClient or EvmClient not found in blockchain module'
          );
        }
      } catch (error) {
        console.warn('Failed to load blockchain clients:', error);
      }

      // Fund wallets if requested
      if (fundWallets) {
        await this.fundWallets();
      }

      if (!silent) {
        console.log(chalk.green('✅ Conflux node started successfully!'));
        console.log(chalk.cyan(`🔗 Core RPC: http://127.0.0.1:${corePort}`));
        console.log(chalk.cyan(`🔗 EVM RPC: http://127.0.0.1:${evmPort}`));
      }
    } catch (error) {
      if (!silent) {
        console.error(chalk.red('❌ Failed to start node:'), error);
      }
      throw error;
    } finally {
      if (silent) {
        this.disableSilentMode();
      }
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      await (this.server as { stop(): Promise<void> }).stop();
      this.server = null;
      this.coreClient = null;
      this.evmClient = null;
      this.wallets = [];
      this.miningWallet = null;
    }
  }

  async getStatus(): Promise<NodeStatus> {
    let blockNumber = 0;
    const peerCount = 0;

    try {
      if (this.evmClient) {
        blockNumber = Number(await this.evmClient?.getBlockNumber());
      }
    } catch (_error) {
      // Ignore errors
    }

    return {
      running: this.server !== null,
      corePort: 12537,
      evmPort: 8545,
      chainId: 2029,
      evmChainId: 2030,
      blockNumber: BigInt(blockNumber),
      peerCount,
      walletMode: this.walletMode,
      wallets: this.wallets,
      miningAddress: this.miningWallet?.address || undefined,
    };
  }

  getCoreClient(): any {
    return this.coreClient;
  }

  getEvmClient(): any {
    return this.evmClient;
  }

  getWallets(): WalletInfo[] {
    return this.wallets;
  }

  getMiningWallet(): WalletInfo | null {
    return this.miningWallet;
  }

  getWalletByAddress(address: string): WalletInfo | undefined {
    return this.wallets.find(
      w => w.address.toLowerCase() === address.toLowerCase()
    );
  }

  async executeScript<T>(
    script: (node: ConfluxNode) => Promise<T>,
    config: Partial<NodeConfig> = {}
  ): Promise<ExecutionResult<T>> {
    const startTime = Date.now();

    try {
      await this.start(config);
      const result = await script(this);
      await this.stop();

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      await this.stop();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }
}
