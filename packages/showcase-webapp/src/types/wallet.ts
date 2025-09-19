export interface WalletInfo {
  address: string;
  privateKey?: string;
  balance: string;
  balanceFormatted: string;
  isDefault?: boolean;
  name?: string;
  network?: string;
  type: 'internal' | 'browser';
  chainType: 'evm' | 'core';
}

export interface InternalWallet {
  evm: WalletInfo;
  core: WalletInfo;
}