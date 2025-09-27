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

import { Code, Copy, Loader2, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import {
  type ContractTemplate,
  SIMPLE_STORAGE_TEMPLATE,
} from '../contracts/SimpleStorage';
import {
  type DeployedContract,
  usePersistedContracts,
} from '../hooks/usePersistedContracts';
import { DevKitApiService } from '../services/api';
import { useToast } from './Toast';

interface ContractDeploymentProps {
  onContractDeployed?: (contract: DeployedContract) => void;
  currentNetwork: 'local' | 'testnet' | 'mainnet';
}

const CONTRACT_TEMPLATES: ContractTemplate[] = [SIMPLE_STORAGE_TEMPLATE];

export function ContractDeployment({
  onContractDeployed,
  currentNetwork,
}: ContractDeploymentProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);
  const [customAbi, setCustomAbi] = useState('');
  const [customBytecode, setCustomBytecode] = useState('');
  const [constructorArgs, setConstructorArgs] = useState<
    Record<string, string>
  >({});
  const [selectedChain, setSelectedChain] = useState<'core' | 'evm'>('core');
  const [accountIndex, setAccountIndex] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const { success, error } = useToast();
  const { deployedContracts, addContract, removeContract } =
    usePersistedContracts();

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setCustomAbi(JSON.stringify(template.abi, null, 2));
    setCustomBytecode(template.bytecode);

    // Set default constructor arguments
    const defaultArgs: Record<string, string> = {};
    template.constructorArgs.forEach((arg) => {
      defaultArgs[arg.name] = arg.defaultValue?.toString() || '';
    });
    setConstructorArgs(defaultArgs);
    setShowTemplates(false);
  };

  const handleCustomContract = () => {
    setSelectedTemplate(null);
    setCustomAbi('');
    setCustomBytecode('');
    setConstructorArgs({});
    setShowTemplates(false);
  };

  const parseConstructorArgs = () => {
    if (!selectedTemplate) {
      return [];
    }

    return selectedTemplate.constructorArgs.map((arg) => {
      const value = constructorArgs[arg.name] || '';

      // Parse based on type - return strings for API serialization
      if (arg.type === 'uint256' || arg.type.startsWith('uint')) {
        // Validate it's a valid number, but return as string for JSON serialization
        const numValue = value || '0';
        try {
          BigInt(numValue); // Validate it's a valid BigInt
          return numValue;
        } catch {
          throw new Error(`Invalid number format for ${arg.name}: ${numValue}`);
        }
      }
      if (arg.type === 'bool') {
        return value.toLowerCase() === 'true';
      }
      if (arg.type === 'address') {
        if (value && !value.match(/^0x[a-fA-F0-9]{40}$/)) {
          throw new Error(`Invalid address format for ${arg.name}: ${value}`);
        }
        return value;
      }
      // Default to string
      return value;
    });
  };

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);

      let abi: unknown[];
      let bytecode: string;

      if (selectedTemplate) {
        abi = selectedTemplate.abi;
        bytecode = selectedTemplate.bytecode;
      } else {
        if (!customAbi || !customBytecode) {
          error('Please provide both ABI and bytecode');
          return;
        }

        try {
          abi = JSON.parse(customAbi);
        } catch {
          error('Invalid ABI JSON format');
          return;
        }

        bytecode = customBytecode;
      }

      let args: (string | boolean)[] = [];
      try {
        args = selectedTemplate ? parseConstructorArgs() : [];
      } catch (validationError) {
        error(
          validationError instanceof Error
            ? validationError.message
            : 'Invalid constructor arguments'
        );
        return;
      }

      const result = await DevKitApiService.deployContract(
        abi,
        bytecode,
        args,
        selectedChain,
        accountIndex
      );

      const newContract: DeployedContract = {
        address: result.address,
        chain: selectedChain,
        deployer: result.deployer,
        timestamp: new Date().toISOString(),
        template: selectedTemplate?.name,
        name: selectedTemplate?.name || 'Custom Contract',
        abi: selectedTemplate ? selectedTemplate.abi : JSON.parse(customAbi),
        network: currentNetwork,
      };

      addContract(newContract);
      success(
        `Contract deployed successfully at ${result.address.slice(0, 10)}...`
      );

      onContractDeployed?.(newContract);

      // Reset form
      setSelectedTemplate(null);
      setCustomAbi('');
      setCustomBytecode('');
      setConstructorArgs({});
      setShowTemplates(true);
    } catch (err) {
      console.error('Deployment failed:', err);
      error('Contract deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  if (showTemplates) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Code className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Deploy Contract
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Choose Deployment Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contract Templates */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Contract Templates
                </h4>
                {CONTRACT_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {template.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {template.functions.length} functions •{' '}
                      {template.constructorArgs.length} constructor args
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Contract */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Custom Contract
                </h4>
                <button
                  onClick={handleCustomContract}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-gray-900">
                      Upload Custom Contract
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Deploy your own contract by providing ABI and bytecode
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Deployments */}
          {deployedContracts.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Recent Deployments
              </h3>
              <div className="space-y-2">
                {deployedContracts.slice(0, 3).map((contract, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-mono text-sm text-gray-900">
                        {contract.address.slice(0, 10)}...
                        {contract.address.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {contract.template} • {contract.chain} •{' '}
                        {new Date(contract.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          contract.chain === 'core'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {contract.chain === 'core' ? 'Core Space' : 'eSpace'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Deploy Contract
            {selectedTemplate && (
              <span className="ml-2 text-sm text-gray-600">
                ({selectedTemplate.name})
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Back to Templates
        </button>
      </div>

      <div className="space-y-6">
        {/* Chain Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Chain
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedChain('core')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedChain === 'core'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Core Space
            </button>
            <button
              onClick={() => setSelectedChain('evm')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedChain === 'evm'
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              eSpace
            </button>
          </div>
        </div>

        {/* Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deployer Account
          </label>
          <select
            value={accountIndex}
            onChange={(e) => setAccountIndex(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i} value={i}>
                Account {i}
              </option>
            ))}
          </select>
        </div>

        {/* Constructor Arguments */}
        {selectedTemplate && selectedTemplate.constructorArgs.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Constructor Arguments
            </label>
            <div className="space-y-3">
              {selectedTemplate.constructorArgs.map((arg) => (
                <div key={arg.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {arg.name} ({arg.type})
                  </label>
                  <input
                    type="text"
                    value={constructorArgs[arg.name] || ''}
                    onChange={(e) =>
                      setConstructorArgs((prev) => ({
                        ...prev,
                        [arg.name]: e.target.value,
                      }))
                    }
                    placeholder={arg.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Contract Fields */}
        {!selectedTemplate && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract ABI
              </label>
              <textarea
                value={customAbi}
                onChange={(e) => setCustomAbi(e.target.value)}
                placeholder="Paste your contract ABI JSON here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Bytecode
              </label>
              <textarea
                value={customBytecode}
                onChange={(e) => setCustomBytecode(e.target.value)}
                placeholder="Paste your contract bytecode here (0x...)..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </>
        )}

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={
            isDeploying ||
            (!selectedTemplate && (!customAbi || !customBytecode))
          }
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying Contract...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Deploy Contract
            </>
          )}
        </button>

        {/* Deployed Contracts History */}
        {(() => {
          // Filter contracts for current network
          const networkContracts = deployedContracts.filter(contract => 
            contract.network === currentNetwork
          );
          
          return networkContracts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Deployed Contracts on {currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)} ({networkContracts.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {networkContracts.slice(0, 10).map((contract) => (
                  <div
                    key={`${contract.address}-${contract.chain}-${contract.network}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative"
                  >
                    <button
                      type="button" 
                      onClick={() => onContractDeployed?.(contract)}
                      title="Click to load in contract interaction"
                      className="absolute inset-0 w-full h-full bg-transparent border-none cursor-pointer z-0"
                      aria-label={`Load ${contract.name || contract.template || 'Contract'} in interaction widget`}
                    />
                    <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {contract.name || contract.template || 'Contract'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            contract.chain === 'core'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {contract.chain === 'core' ? 'Core' : 'eSpace'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            currentNetwork === 'local'
                              ? 'bg-green-100 text-green-700'
                              : currentNetwork === 'testnet'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {currentNetwork.toUpperCase()}
                        </span>
                      </div>
                      <code className="text-xs text-gray-600 font-mono">
                        {contract.address}
                      </code>
                    </div>
                    <div className="flex gap-1 relative z-10 pointer-events-auto">
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(contract.address)
                        }
                        title="Copy address"
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeContract(contract.address, contract.chain)
                        }
                        title="Remove from list"
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
