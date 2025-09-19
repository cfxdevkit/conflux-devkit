import { useState } from 'react';
import type { HardhatScript, DeployConfig } from '../../types/hardhat';
import type { DeployedContract } from '../../types/contract';

interface HardhatDeploymentSectionProps {
  availableScripts: HardhatScript[];
  deployedContracts: DeployedContract[];
  isDeploying: boolean;
  onDeploy: (script: HardhatScript, config: DeployConfig) => void;
  onViewContract: (contract: DeployedContract) => void;
}

export function HardhatDeploymentSection({
  availableScripts,
  deployedContracts,
  isDeploying,
  onDeploy,
  onViewContract
}: HardhatDeploymentSectionProps) {
  const [selectedScript, setSelectedScript] = useState<HardhatScript | null>(null);

  const handleDeployScript = (script: HardhatScript) => {
    const config: DeployConfig = {
      scriptId: script.id,
      parameters: {},
      gasLimit: '8000000',
      gasPrice: '20000000000',
    };
    onDeploy(script, config);
  };

  const getContractStatus = (contract: DeployedContract) => {
    if (contract.deployment?.isVerified) return { text: 'Verified', color: 'green' };
    if (contract.deployment?.transactionHash) return { text: 'Deployed', color: 'blue' };
    return { text: 'Pending', color: 'yellow' };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          🛠️ Hardhat Deployment
        </h3>
        {isDeploying && (
          <div className="flex items-center space-x-2 text-yellow-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
            <span className="text-sm">Deploying...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Available Scripts */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            📦 Available Scripts ({availableScripts.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableScripts.map((script) => (
              <div
                key={script.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedScript?.id === script.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedScript(script)}
              >
                <div className="font-medium text-sm">{script.name}</div>
                {script.description && (
                  <div className="text-xs text-gray-500 mt-1">{script.description}</div>
                )}
                {script.estimatedGas && (
                  <div className="text-xs text-blue-600 mt-1">
                    Est. Gas: {script.estimatedGas}
                  </div>
                )}
              </div>
            ))}
            {availableScripts.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No scripts found
              </div>
            )}
          </div>
          <button className="w-full mt-3 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            📁 Browse Scripts
          </button>
        </div>

        {/* Deploy Actions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            🚀 Deploy Actions
          </h4>
          <div className="space-y-3">
            <button
              onClick={() => {
                availableScripts.forEach(script => handleDeployScript(script));
              }}
              disabled={isDeploying || availableScripts.length === 0}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deploy All Scripts
            </button>

            {selectedScript && (
              <button
                onClick={() => handleDeployScript(selectedScript)}
                disabled={isDeploying}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deploy {selectedScript.name}
              </button>
            )}

            <button
              disabled={!selectedScript}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⚙️ Configure Deployment
            </button>

            {selectedScript && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <div className="font-medium">Selected: {selectedScript.name}</div>
                <div className="text-gray-600 text-xs mt-1">
                  Parameters: {selectedScript.parameters.length}
                </div>
                {selectedScript.dependencies && selectedScript.dependencies.length > 0 && (
                  <div className="text-gray-600 text-xs">
                    Dependencies: {selectedScript.dependencies.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deployed Contracts */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            📋 Deployed Contracts ({deployedContracts.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {deployedContracts.map((contract) => {
              const status = getContractStatus(contract);
              return (
                <div
                  key={contract.id}
                  className="p-3 border border-gray-200 rounded-md hover:border-gray-300 cursor-pointer"
                  onClick={() => onViewContract(contract)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{contract.name}</div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      status.color === 'green' ? 'bg-green-100 text-green-700' :
                      status.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    {contract.address}
                  </div>
                  <div className="text-xs text-gray-500">
                    Network: {contract.network.name}
                  </div>
                </div>
              );
            })}
            {deployedContracts.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No contracts deployed
              </div>
            )}
          </div>
          <button className="w-full mt-3 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            👁️ View All
          </button>
        </div>

        {/* Status & Logs */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            📊 Status & Logs
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Ready</span>
                <span className="text-green-600">✅</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Hardhat environment configured
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Scripts Found:</span>
                <span className="font-medium">{availableScripts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deployed:</span>
                <span className="font-medium">{deployedContracts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-green-600">Ready</span>
              </div>
            </div>

            <button className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              📋 View Deployment Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}