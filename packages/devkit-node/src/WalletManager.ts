import type { EvmClient } from '@conflux-devkit/blockchain';
import { formatEther } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import type { NodeConfig, WalletInfo } from './types.js';

export class WalletManager {
  private wallets: WalletInfo[] = [];
  private mnemonic?: string;
  private privateKey?: string;
  private walletMode: 'mnemonic' | 'privatekey' = 'mnemonic';
  private coreClient?: unknown; // cive client
  private evmClient?: EvmClient; // viem client

  constructor(config: NodeConfig) {
    this.walletMode = config.walletMode || 'mnemonic';
    this.mnemonic = config.mnemonic;
    this.privateKey = config.privateKey;
  }

  /**
   * Initialize wallets based on configuration
   */
  async initializeWallets(config: NodeConfig): Promise<WalletInfo[]> {
    const walletCount = config.walletCount || 10;
    const fundWallets = config.fundWallets !== false; // Default to true

    if (this.walletMode === 'mnemonic') {
      return this.initializeFromMnemonic(walletCount, fundWallets);
    } else {
      return this.initializeFromPrivateKey(fundWallets);
    }
  }

  /**
   * Initialize wallets from mnemonic
   */
  private async initializeFromMnemonic(
    walletCount: number,
    fundWallets: boolean
  ): Promise<WalletInfo[]> {
    // Use environment variable or default test mnemonic
    const mnemonic =
      this.mnemonic ||
      process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC ||
      'test test test test test test test test test test test junk';

    console.log(`🔑 Initializing ${walletCount} wallets from mnemonic...`);

    this.wallets = [];

    for (let i = 0; i < walletCount; i++) {
      const account = mnemonicToAccount(mnemonic, { addressIndex: i });

      // Get the private key from the HD key
      const hdKey = account.getHdKey();
      const privateKey = `0x${Array.from(hdKey.privateKey || [])
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`;

      const walletInfo: WalletInfo = {
        index: i,
        address: account.address,
        privateKey: privateKey as `0x${string}`,
        isMining: i === 0, // First wallet is mining destination
      };

      this.wallets.push(walletInfo);
    }

    if (fundWallets && this.coreClient && this.evmClient) {
      await this.fundWallets();
    }

    return this.wallets;
  }

  /**
   * Initialize wallet from private key
   */
  private async initializeFromPrivateKey(
    fundWallets: boolean
  ): Promise<WalletInfo[]> {
    if (!this.privateKey) {
      throw new Error('Private key is required for privatekey mode');
    }

    console.log('🔑 Initializing wallet from private key...');

    const account = privateKeyToAccount(this.privateKey as `0x${string}`);

    const walletInfo: WalletInfo = {
      index: 0,
      address: account.address,
      privateKey: this.privateKey as `0x${string}`,
      isMining: true, // Single wallet is mining destination
    };

    this.wallets = [walletInfo];

    if (fundWallets && this.coreClient && this.evmClient) {
      await this.fundWallets();
    }

    return this.wallets;
  }

  /**
   * Fund wallets with initial balance
   */
  private async fundWallets(): Promise<void> {
    if (!this.coreClient || !this.evmClient) {
      console.log('⚠️  Clients not available, skipping wallet funding');
      return;
    }

    console.log('💰 Funding wallets...');

    try {
      // In a local development node, the mining wallet should already have funds
      // from the genesis block. We just need to verify and distribute if needed.

      if (this.wallets.length > 0) {
        const miningWallet = this.wallets[0];

        // Check if mining wallet has balance
        const miningBalance = await this.evmClient?.getBalance({
          address: miningWallet.address,
        });

        if (miningBalance > 0n) {
          console.log(
            `✅ Mining wallet ${{
              address: miningWallet.address,
            }} has ${miningBalance.toString()} wei`
          );

          // Update mining wallet balance
          miningWallet.balance = miningBalance;
          miningWallet.balanceFormatted = formatEther(miningBalance);

          // If we have multiple wallets, distribute some funds
          if (this.wallets.length > 1) {
            const distributionAmount = 100000000000000000000n; // 0.1 ETH each

            for (let i = 1; i < this.wallets.length; i++) {
              const wallet = this.wallets[i];

              try {
                // Create a simple transfer transaction
                const { createWalletClient, http } = await import('viem');

                const walletClient = createWalletClient({
                  account: miningWallet.privateKey as `0x${string}`,
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
                  address: wallet.address,
                });
                wallet.balance = balance;
                wallet.balanceFormatted = formatEther(balance);

                console.log(
                  `✅ Funded wallet ${wallet.address} with ${formatEther(
                    distributionAmount
                  )} ETH`
                );
              } catch (error) {
                console.error(
                  `❌ Failed to fund wallet ${wallet.address}:`,
                  error
                );
              }
            }
          }
        } else {
          console.log('⚠️  Mining wallet has no balance, skipping funding');
        }
      }
    } catch (error) {
      console.error('❌ Failed to fund wallets:', error);
    }
  }

  /**
   * Set clients for wallet operations
   */
  setClients(coreClient: unknown, evmClient: EvmClient): void {
    this.coreClient = coreClient;
    this.evmClient = evmClient;
  }

  /**
   * Get all wallets
   */
  getWallets(): WalletInfo[] {
    return this.wallets;
  }

  /**
   * Get wallet by index
   */
  getWallet(index: number): WalletInfo | undefined {
    return this.wallets[index];
  }

  /**
   * Get mining wallet (wallet 0)
   */
  getMiningWallet(): WalletInfo | undefined {
    return this.wallets[0];
  }

  /**
   * Get wallet by address
   */
  getWalletByAddress(address: string): WalletInfo | undefined {
    return this.wallets.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Get wallet mode
   */
  getWalletMode(): 'mnemonic' | 'privatekey' {
    return this.walletMode;
  }

  /**
   * Get mnemonic (if in mnemonic mode)
   */
  getMnemonic(): string | undefined {
    return this.mnemonic;
  }

  /**
   * Get private key (if in privatekey mode)
   */
  getPrivateKey(): string | undefined {
    return this.privateKey;
  }

  /**
   * Create a new wallet (only in mnemonic mode)
   */
  createNewWallet(): WalletInfo | undefined {
    if (this.walletMode !== 'mnemonic') {
      throw new Error('Cannot create new wallet in privatekey mode');
    }

    const mnemonic =
      this.mnemonic ||
      process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC ||
      'test test test test test test test test test test test junk';

    const index = this.wallets.length;
    const account = mnemonicToAccount(mnemonic, { addressIndex: index });

    // Get the private key from the HD key
    const hdKey = account.getHdKey();
    const privateKey = `0x${Array.from(hdKey.privateKey || [])
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const walletInfo: WalletInfo = {
      index,
      address: account.address,
      privateKey: privateKey as `0x${string}`,
      isMining: false,
    };

    this.wallets.push(walletInfo);
    return walletInfo;
  }

  /**
   * Export wallet information
   */
  exportWallets(): {
    mode: 'mnemonic' | 'privatekey';
    mnemonic?: string;
    privateKey?: string;
    wallets: WalletInfo[];
  } {
    return {
      mode: this.walletMode,
      mnemonic: this.mnemonic,
      privateKey: this.privateKey,
      wallets: this.wallets,
    };
  }
}
