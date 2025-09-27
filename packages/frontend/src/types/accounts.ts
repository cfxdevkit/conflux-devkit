/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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