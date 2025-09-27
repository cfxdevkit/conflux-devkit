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

/**
 * Demo utility to show how local vs persistent contract storage works
 * This is for testing/documentation purposes only
 */

export interface DeployedContract {
  address: string;
  chain: 'core' | 'evm';
  deployer: string;
  timestamp: string;
  template?: string;
  name?: string;
  abi?: unknown[];
  network?: 'local' | 'testnet' | 'mainnet';
}

const PERSISTENT_STORAGE_KEY = 'conflux-devkit-deployed-contracts';
const SESSION_STORAGE_KEY = 'conflux-devkit-local-contracts';

export function demoContractStorage() {
  console.log('=== Contract Storage Demo ===');
  
  // Create sample contracts
  const localContract: DeployedContract = {
    address: '0x1234...local',
    chain: 'core',
    deployer: '0xdev...',
    timestamp: new Date().toISOString(),
    name: 'LocalContract',
    network: 'local'
  };

  const testnetContract: DeployedContract = {
    address: '0x5678...testnet',
    chain: 'evm',
    deployer: '0xdev...',
    timestamp: new Date().toISOString(),
    name: 'TestnetContract',
    network: 'testnet'
  };

  const mainnetContract: DeployedContract = {
    address: '0x9abc...mainnet',
    chain: 'core',
    deployer: '0xdev...',
    timestamp: new Date().toISOString(),
    name: 'MainnetContract',
    network: 'mainnet'
  };

  // Store contracts according to their network
  const persistentContracts = [testnetContract, mainnetContract];
  const localContracts = [localContract];

  localStorage.setItem(PERSISTENT_STORAGE_KEY, JSON.stringify(persistentContracts));
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(localContracts));
  
  console.log('📝 Stored contracts:');
  console.log('  - Persistent (localStorage):', persistentContracts);
  console.log('  - Local (sessionStorage):', localContracts);
  
  console.log('\n🔄 Simulating node restart (clearing sessionStorage):');
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  
  console.log('📖 After restart:');
  console.log('  - Persistent still available:', JSON.parse(localStorage.getItem(PERSISTENT_STORAGE_KEY) || '[]'));
  console.log('  - Local contracts cleared:', JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || '[]'));
  
  console.log('\n✅ Demo complete! Local contracts are ephemeral, testnet/mainnet persist.');
}