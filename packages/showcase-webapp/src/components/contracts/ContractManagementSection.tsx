import { useState } from 'react';
import { ContractCard } from './ContractCard';
import type { DeployedContract } from '../../types/contract';

interface ContractManagementSectionProps {
  contracts: DeployedContract[];
  onSelectContract: (contract: DeployedContract) => void;
  onRemoveContract: (contractId: string) => void;
  onExecuteMethod: (contract: DeployedContract, methodName: string, args: any[]) => void;
}

export function ContractManagementSection({
  contracts,
  onSelectContract,
  onRemoveContract,
  onExecuteMethod
}: ContractManagementSectionProps) {
  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'core' | 'evm'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContracts = contracts.filter(contract => {
    const matchesType = filterType === 'all' || contract.chainType === filterType;
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleContractSelect = (contract: DeployedContract) => {
    setSelectedContract(contract);
    onSelectContract(contract);
  };

  const getContractTypeColor = (chainType: 'core' | 'evm') => {
    return chainType === 'core' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          📋 Contract Management
        </h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {filteredContracts.length} contracts
          </span>
          <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
            ➕ Add Contract
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contracts by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-2">
          {['all', 'core', 'evm'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-2 text-sm rounded-md ${
                filterType === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Grid */}
      {filteredContracts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <div key={contract.id} className="relative">
              <ContractCard
                contract={contract}
                isSelected={selectedContract?.id === contract.id}
                onSelect={() => handleContractSelect(contract)}
                onRemove={() => onRemoveContract(contract.id)}
                onExecuteMethod={(methodName, args) => onExecuteMethod(contract, methodName, args)}
              />
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 text-xs rounded ${getContractTypeColor(contract.chainType)}`}>
                  {contract.chainType.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h4>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Deploy some contracts to get started'
            }
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Deploy Your First Contract
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {contracts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{contracts.length}</div>
              <div className="text-sm text-gray-500">Total Contracts</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {contracts.filter(c => c.chainType === 'core').length}
              </div>
              <div className="text-sm text-gray-500">Core Contracts</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {contracts.filter(c => c.chainType === 'evm').length}
              </div>
              <div className="text-sm text-gray-500">EVM Contracts</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {contracts.filter(c => c.deployment?.isVerified).length}
              </div>
              <div className="text-sm text-gray-500">Verified</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}