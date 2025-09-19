import { useState } from 'react';
import type { DeployedContract, ContractMethod } from '../../types/contract';

interface ContractInteractionModalProps {
  contract: DeployedContract;
  method: ContractMethod;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (method: ContractMethod, args: any[]) => Promise<any>;
  isLoading?: boolean;
  error?: string | null;
}

export function ContractInteractionModal({
  contract,
  method,
  isOpen,
  onClose,
  onExecute,
  isLoading = false,
  error = null
}: ContractInteractionModalProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [gasConfig, setGasConfig] = useState({
    gasLimit: '200000',
    gasPrice: '20000000000',
    value: '0'
  });

  if (!isOpen) return null;

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleExecute = async () => {
    try {
      const args = method.inputs.map(input => parameters[input.name] || '');
      const result = await onExecute(method, args);
      setResult(result);
    } catch (err) {
      console.error('Method execution failed:', err);
    }
  };

  const getMethodTypeColor = () => {
    return method.type === 'read' ? 'text-blue-600' : 'text-green-600';
  };

  const getMethodTypeBg = () => {
    return method.type === 'read' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
  };

  const renderParameterInput = (input: any) => {
    const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (input.type) {
      case 'bool':
        return (
          <select
            value={parameters[input.name] || 'false'}
            onChange={(e) => handleParameterChange(input.name, e.target.value === 'true')}
            className={commonClasses}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        );
      case 'uint256':
      case 'uint':
      case 'int256':
      case 'int':
        return (
          <input
            type="number"
            placeholder="Enter number"
            value={parameters[input.name] || ''}
            onChange={(e) => handleParameterChange(input.name, e.target.value)}
            className={commonClasses}
          />
        );
      case 'address':
        return (
          <input
            type="text"
            placeholder="0x..."
            value={parameters[input.name] || ''}
            onChange={(e) => handleParameterChange(input.name, e.target.value)}
            className={commonClasses}
          />
        );
      default:
        return (
          <input
            type="text"
            placeholder={`Enter ${input.type}`}
            value={parameters[input.name] || ''}
            onChange={(e) => handleParameterChange(input.name, e.target.value)}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Execute Contract Method
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {contract.name} • {contract.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Method Info */}
        <div className={`mx-6 mt-6 p-4 border rounded-lg ${getMethodTypeBg()}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-medium ${getMethodTypeColor()}`}>
              {method.name}()
            </h4>
            <span className={`px-2 py-1 text-xs rounded ${
              method.type === 'read'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {method.type.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">State Mutability:</span> {method.stateMutability}
            {method.payable && <span className="ml-4 font-medium text-orange-600">• Payable</span>}
          </div>
        </div>

        {/* Parameters */}
        {method.inputs.length > 0 && (
          <div className="p-6">
            <h5 className="font-medium text-gray-900 mb-4">Parameters</h5>
            <div className="space-y-4">
              {method.inputs.map((input, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {input.name} ({input.type})
                    {input.internalType && (
                      <span className="text-xs text-gray-500 ml-2">
                        {input.internalType}
                      </span>
                    )}
                  </label>
                  {renderParameterInput(input)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gas Configuration (for write methods) */}
        {method.type === 'write' && (
          <div className="px-6 pb-6">
            <h5 className="font-medium text-gray-900 mb-4">Gas Configuration</h5>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gas Limit
                </label>
                <input
                  type="number"
                  value={gasConfig.gasLimit}
                  onChange={(e) => setGasConfig(prev => ({ ...prev, gasLimit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gas Price (gwei)
                </label>
                <input
                  type="number"
                  value={gasConfig.gasPrice}
                  onChange={(e) => setGasConfig(prev => ({ ...prev, gasPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value (CFX)
                </label>
                <input
                  type="number"
                  value={gasConfig.value}
                  onChange={(e) => setGasConfig(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <div className="text-sm text-red-700">
                <div className="font-medium">Execution Failed</div>
                <div className="mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result !== null && (
          <div className="mx-6 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">Result</h5>
            <pre className="text-sm text-green-700 bg-green-100 p-3 rounded overflow-x-auto">
              {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {method.type === 'read' ? 'This will call the contract and return a value' : 'This will send a transaction to the blockchain'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                method.type === 'read'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Executing...
                </div>
              ) : (
                method.type === 'read' ? '📖 Call' : '✏️ Execute'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}