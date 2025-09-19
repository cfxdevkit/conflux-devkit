// Types for accounts and wallet management
export interface AccountInfo {
  index: number;
  addresses: {
    core: string;
    evm: string;
  };
  isAdmin: boolean;
}

export interface AccountBalance {
  index: number;
  balances: {
    core: string;
    evm: string;
  };
  error?: string;
  nodeStatus?: string;
}

export interface AllAccountsResponse {
  accounts: AccountInfo[];
  total: number;
  faucetAccount?: {
    addresses: {
      core: string;
      evm: string;
    };
  };
}

export interface TransferRequest {
  accountIndex: number;
  to: string;
  value: string;
  chain: 'core' | 'evm';
}

export interface TransferResponse {
  transactionHash: string;
  from: string;
  to: string;
  value: string;
  chain: string;
}