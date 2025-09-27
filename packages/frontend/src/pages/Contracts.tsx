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


import { useState } from 'react';
import { ContractDeployment } from '../components/ContractDeployment';
import { ContractInteraction } from '../components/ContractInteraction';

interface DeployedContract {
  address: string;
  chain: 'core' | 'evm';
  deployer: string;
  timestamp: string;
  template?: string;
  network?: 'local' | 'testnet' | 'mainnet';
}

interface ContractsProps {
  currentNetwork: 'local' | 'testnet' | 'mainnet';
}

export function Contracts({ currentNetwork }: ContractsProps) {
  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(null);

  const handleContractDeployed = (contract: DeployedContract) => {
    setSelectedContract(contract);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Smart Contracts</h2>
        <p className="text-gray-600 mt-2">
          Deploy and interact with smart contracts on both Core Space and eSpace (EVM).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Deployment */}
        <div className="bg-white rounded-lg border p-6">
          <ContractDeployment 
            currentNetwork={currentNetwork}
            onContractDeployed={handleContractDeployed} 
          />
        </div>

        {/* Contract Interaction */}
        <div className="bg-white rounded-lg border p-6">
          <ContractInteraction contract={selectedContract} />
        </div>
      </div>
    </div>
  );
}