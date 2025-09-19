import { useState } from 'react';
import { ContractInteractionModal } from './ContractInteractionModal';
import type { DeployedContract, ContractMethod } from '../../types/contract';

interface ContractCardProps {
  contract: DeployedContract;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onExecuteMethod: (methodName: string, args: any[]) => void;
}

export function ContractCard({
  contract,
  isSelected,
  onSelect,
  onRemove,
  onExecuteMethod
}: ContractCardProps) {
  const [expandedSection, setExpandedSection] = useState<'read' | 'write' | 'events' | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<ContractMethod | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMethodClick = (method: ContractMethod) => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  const handleExecuteMethod = async (method: ContractMethod, args: any[]) => {
    // Simulate execution
    onExecuteMethod(method.name, args);

    // Simulate result based on method type
    if (method.type === 'read') {
      // Return mock data for read methods
      if (method.name === 'name') return 'MyToken';
      if (method.name === 'symbol') return 'MTK';
      if (method.name === 'totalSupply') return '1000000000000000000000000';
      if (method.name === 'balanceOf') return '1000000000000000000';
      return 'Mock result';
    } else {
      // Return transaction hash for write methods
      return {
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: 12345,
        gasUsed: '21000'
      };
    }
  };

  const toggleSection = (section: 'read' | 'write' | 'events') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getMethodCount = () => {
    return {
      read: contract.methods?.read?.length || 0,
      write: contract.methods?.write?.length || 0,
      events: contract.methods?.events?.length || 0
    };
  };

  const methodCounts = getMethodCount();

  return (
    <div
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-lg">
            🎯 {contract.name}
          </h4>
          <p className="text-xs text-gray-500 font-mono mt-1 break-all">
            {contract.address}
          </p>
          {contract.metadata?.description && (
            <p className="text-sm text-gray-600 mt-1">
              {contract.metadata.description}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-gray-400 hover:text-red-600 transition-colors ml-2"
          title="Remove contract"
        >
          ❌
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-2 mb-4">
        {contract.ui?.isActive && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
            Active
          </span>
        )}
        {contract.deployment?.isVerified && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
            Verified
          </span>
        )}
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
          {contract.network.name}
        </span>
      </div>

      {/* Methods Overview */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('read');
          }}
          className={`p-2 text-center border rounded transition-colors ${
            expandedSection === 'read' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg font-bold text-blue-600">{methodCounts.read}</div>
          <div className="text-xs text-gray-500">📖 Read</div>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('write');
          }}
          className={`p-2 text-center border rounded transition-colors ${
            expandedSection === 'write' ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg font-bold text-green-600">{methodCounts.write}</div>
          <div className="text-xs text-gray-500">✏️ Write</div>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('events');
          }}
          className={`p-2 text-center border rounded transition-colors ${
            expandedSection === 'events' ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg font-bold text-purple-600">{methodCounts.events}</div>
          <div className="text-xs text-gray-500">📡 Events</div>
        </button>
      </div>

      {/* Expanded Methods */}
      {expandedSection && (
        <div className="border-t border-gray-200 pt-3">
          {expandedSection === 'read' && contract.methods?.read && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Read Methods</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {contract.methods.read.map((method) => (
                  <button
                    key={method.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMethodClick(method);
                    }}
                    className="block w-full text-left px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 rounded"
                  >
                    {method.name}({method.inputs.map(i => i.name).join(', ')})
                  </button>
                ))}
              </div>
            </div>
          )}

          {expandedSection === 'write' && contract.methods?.write && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Write Methods</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {contract.methods.write.map((method) => (
                  <button
                    key={method.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMethodClick(method);
                    }}
                    className="block w-full text-left px-2 py-1 text-xs bg-green-50 hover:bg-green-100 rounded"
                  >
                    {method.name}({method.inputs.map(i => i.name).join(', ')})
                  </button>
                ))}
              </div>
            </div>
          )}

          {expandedSection === 'events' && contract.methods?.events && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Events</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {contract.methods.events.map((event) => (
                  <div
                    key={event.name}
                    className="px-2 py-1 text-xs bg-purple-50 rounded"
                  >
                    {event.name}({event.inputs.map(i => i.name).join(', ')})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>
            <span className="font-medium">Created:</span> {contract.createdAt.toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Used:</span> {contract.ui?.usageCount || 0} times
          </div>
        </div>
      </div>

      {/* Contract Interaction Modal */}
      {isModalOpen && selectedMethod && (
        <ContractInteractionModal
          contract={contract}
          method={selectedMethod}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMethod(null);
          }}
          onExecute={handleExecuteMethod}
        />
      )}
    </div>
  );
}