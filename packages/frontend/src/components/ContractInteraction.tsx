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

import { Book, Copy, Eye, Loader2, Play, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type ContractTemplate,
  SIMPLE_STORAGE_TEMPLATE,
} from '../contracts/SimpleStorage';
import { usePersistedContracts } from '../hooks/usePersistedContracts';
import { DevKitApiService } from '../services/api';
import { useToast } from './Toast';

interface ContractFunction {
  name: string;
  type: 'read' | 'write';
  description: string;
  args: {
    name: string;
    type: string;
    description: string;
  }[];
}

interface ContractInteractionProps {
  contract?: {
    address: string;
    chain: 'core' | 'evm';
    template?: string;
  } | null;
}

interface FunctionResult {
  functionName: string;
  result: unknown;
  timestamp: string;
  type: 'read' | 'write';
  transactionHash?: string;
}

export function ContractInteraction({ contract }: ContractInteractionProps) {
  const [contractAddress, setContractAddress] = useState(
    contract?.address || ''
  );
  const [selectedChain, setSelectedChain] = useState<'core' | 'evm'>(
    contract?.chain || 'core'
  );
  const [accountIndex, setAccountIndex] = useState(0);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [customAbi, setCustomAbi] = useState('');
  const [functionInputs, setFunctionInputs] = useState<
    Record<string, Record<string, string>>
  >({});

  const [results, setResults] = useState<FunctionResult[]>([]);
  const [loadingFunctions, setLoadingFunctions] = useState<Set<string>>(
    new Set()
  );

  const { success, error } = useToast();
  const { getContractsByChain } = usePersistedContracts();

  useEffect(() => {
    if (contract) {
      setContractAddress(contract.address);
      setSelectedChain(contract.chain);

      // Load template if available
      if (contract.template === 'SimpleStorage') {
        setTemplate(SIMPLE_STORAGE_TEMPLATE);
      }
    }
  }, [contract]);

  const handleLoadTemplate = () => {
    setTemplate(SIMPLE_STORAGE_TEMPLATE);
    setCustomAbi(JSON.stringify(SIMPLE_STORAGE_TEMPLATE.abi, null, 2));
  };

  const handleLoadCustomAbi = () => {
    try {
      const abi = JSON.parse(customAbi);
      // Create a basic template from ABI
      const customTemplate: ContractTemplate = {
        name: 'Custom Contract',
        description: 'Custom contract loaded from ABI',
        abi,
        bytecode: '',
        constructorArgs: [],
        functions: abi
          .filter(
            (item: unknown) => (item as { type: string }).type === 'function'
          )
          .map((func: unknown) => {
            const f = func as {
              name: string;
              stateMutability: string;
              inputs?: unknown[];
            };
            return {
              name: f.name,
              type:
                f.stateMutability === 'view' || f.stateMutability === 'pure'
                  ? ('read' as const)
                  : ('write' as const),
              description: `${f.name} function`,
              args:
                f.inputs?.map((input: unknown) => {
                  const inp = input as { name: string; type: string };
                  return {
                    name: inp.name,
                    type: inp.type,
                    description: `${inp.name} parameter`,
                  };
                }) || [],
            };
          }),
      };
      setTemplate(customTemplate);
      success('ABI loaded successfully');
    } catch {
      error('Invalid ABI JSON format');
    }
  };

  const handleFunctionInputChange = (
    functionName: string,
    argName: string,
    value: string
  ) => {
    setFunctionInputs((prev) => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        [argName]: value,
      },
    }));
  };

  const parseArgumentValue = (value: string, type: string) => {
    if (!value.trim()) {
      if (type.startsWith('uint') || type === 'uint256') {
        return '0';
      }
      if (type === 'bool') {
        return false;
      }
      if (type === 'string') {
        return '';
      }
      return value;
    }

    if (type.startsWith('uint') || type === 'uint256') {
      // Return string for API serialization, validate it's a valid number
      try {
        BigInt(value); // Validate
        return value; // Return as string
      } catch {
        throw new Error(`Invalid number format: ${value}`);
      }
    }
    if (type === 'bool') {
      return value.toLowerCase() === 'true';
    }
    if (type === 'address') {
      if (value && !value.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error(`Invalid address format: ${value}`);
      }
      return value;
    }
    return value;
  };

  const handleReadFunction = async (func: ContractFunction) => {
    if (!contractAddress || !template) return;

    const functionName = func.name;
    setLoadingFunctions((prev) => new Set(prev).add(functionName));

    try {
      const inputs = functionInputs[functionName] || {};
      let args: (string | boolean)[];
      try {
        args = func.args.map((arg) =>
          parseArgumentValue(inputs[arg.name] || '', arg.type)
        );
      } catch (validationError) {
        error(
          validationError instanceof Error
            ? validationError.message
            : 'Invalid function arguments'
        );
        return;
      }

      const response = await DevKitApiService.readContract(
        contractAddress,
        template.abi,
        functionName,
        args,
        selectedChain
      );

      const result: FunctionResult = {
        functionName,
        result: response.result,
        timestamp: new Date().toISOString(),
        type: 'read',
      };

      setResults((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      success(`Function ${functionName} executed successfully`);
    } catch (err) {
      console.error('Read function error:', err);
      error(`Failed to execute ${functionName}`);
    } finally {
      setLoadingFunctions((prev) => {
        const next = new Set(prev);
        next.delete(functionName);
        return next;
      });
    }
  };

  const handleWriteFunction = async (func: ContractFunction) => {
    if (!contractAddress || !template) return;

    const functionName = func.name;
    setLoadingFunctions((prev) => new Set(prev).add(functionName));

    try {
      const inputs = functionInputs[functionName] || {};
      let args: (string | boolean)[];
      try {
        args = func.args.map((arg) =>
          parseArgumentValue(inputs[arg.name] || '', arg.type)
        );
      } catch (validationError) {
        error(
          validationError instanceof Error
            ? validationError.message
            : 'Invalid function arguments'
        );
        return;
      }

      const response = await DevKitApiService.writeContract(
        contractAddress,
        template.abi,
        functionName,
        args,
        selectedChain,
        accountIndex
      );

      const result: FunctionResult = {
        functionName,
        result: 'Transaction sent',
        timestamp: new Date().toISOString(),
        type: 'write',
        transactionHash: response.transactionHash,
      };

      setResults((prev) => [result, ...prev.slice(0, 9)]);
      success(`Transaction sent: ${response.transactionHash.slice(0, 10)}...`);
    } catch (err) {
      console.error('Write function error:', err);
      error(`Failed to execute ${functionName}`);
    } finally {
      setLoadingFunctions((prev) => {
        const next = new Set(prev);
        next.delete(functionName);
        return next;
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard');
  };

  const formatResult = (result: unknown) => {
    if (typeof result === 'bigint') {
      return result.toString();
    }
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }
    return result?.toString() || 'null';
  };

  if (!contractAddress) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Book className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Contract Selected
          </h3>
          <p className="text-gray-600">
            Deploy a contract first or enter a contract address to interact with
            it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Play className="h-5 w-5 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Contract Interaction
        </h2>
      </div>

      <div className="space-y-6">
        {/* Contract Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder={selectedChain === 'core' ? 'cfx:...' : '0x...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(contractAddress)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {selectedChain === 'core'
                ? 'Use Core Space address format (cfx:...)'
                : 'Use eSpace address format (0x...)'}
            </p>

            {/* Quick Contract Selector */}
            {(() => {
              const chainContracts = getContractsByChain(selectedChain);
              return (
                chainContracts.length > 0 && (
                  <div className="mt-2">
                    <select
                      value=""
                      onChange={(e) => {
                        const selectedContract = chainContracts.find(
                          (c) => c.address === e.target.value
                        );
                        if (selectedContract) {
                          setContractAddress(selectedContract.address);
                          if (selectedContract.abi) {
                            setCustomAbi(
                              JSON.stringify(selectedContract.abi, null, 2)
                            );
                            handleLoadCustomAbi();
                          }
                        }
                      }}
                      className="w-full px-3 py-1 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700"
                    >
                      <option value="">Select deployed contract...</option>
                      {chainContracts.map((contract) => (
                        <option key={contract.address} value={contract.address}>
                          {contract.name} - {contract.address.slice(0, 10)}...
                        </option>
                      ))}
                    </select>
                  </div>
                )
              );
            })()}
          </div>

          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Chain
              </legend>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChain('core')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedChain === 'core'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Core Space
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChain('evm')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedChain === 'evm'
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  eSpace
                </button>
              </div>
            </fieldset>
            <p className="mt-1 text-xs text-gray-500">
              Different chains require different contract addresses
            </p>
          </div>
        </div>

        {/* Account Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account (for write functions)
          </label>
          <select
            value={accountIndex}
            onChange={(e) => setAccountIndex(Number(e.target.value))}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i} value={i}>
                Account {i}
              </option>
            ))}
          </select>
        </div>

        {/* ABI Loading */}
        {!template && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Load Contract ABI
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleLoadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load SimpleStorage Template
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Or paste custom ABI:
                </label>
                <textarea
                  value={customAbi}
                  onChange={(e) => setCustomAbi(e.target.value)}
                  placeholder="Paste contract ABI JSON here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                />
                <button
                  onClick={handleLoadCustomAbi}
                  disabled={!customAbi.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Load Custom ABI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract Functions */}
        {template && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Contract Functions ({template.name})
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Read Functions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Read Functions
                </h4>
                <div className="space-y-3">
                  {template.functions
                    .filter((f) => f.type === 'read')
                    .map((func) => (
                      <div
                        key={func.name}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {func.name}
                          </span>
                          <button
                            onClick={() => handleReadFunction(func)}
                            disabled={loadingFunctions.has(func.name)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
                          >
                            {loadingFunctions.has(func.name) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                            Call
                          </button>
                        </div>

                        {func.args.length > 0 && (
                          <div className="space-y-2">
                            {func.args.map((arg) => (
                              <div key={arg.name}>
                                <label className="block text-xs text-gray-600 mb-1">
                                  {arg.name} ({arg.type})
                                </label>
                                <input
                                  type="text"
                                  value={
                                    functionInputs[func.name]?.[arg.name] || ''
                                  }
                                  onChange={(e) =>
                                    handleFunctionInputChange(
                                      func.name,
                                      arg.name,
                                      e.target.value
                                    )
                                  }
                                  placeholder={arg.description}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Write Functions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Write Functions
                </h4>
                <div className="space-y-3">
                  {template.functions
                    .filter((f) => f.type === 'write')
                    .map((func) => (
                      <div
                        key={func.name}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {func.name}
                          </span>
                          <button
                            onClick={() => handleWriteFunction(func)}
                            disabled={loadingFunctions.has(func.name)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                          >
                            {loadingFunctions.has(func.name) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Send
                          </button>
                        </div>

                        {func.args.length > 0 && (
                          <div className="space-y-2">
                            {func.args.map((arg) => (
                              <div key={arg.name}>
                                <label className="block text-xs text-gray-600 mb-1">
                                  {arg.name} ({arg.type})
                                </label>
                                <input
                                  type="text"
                                  value={
                                    functionInputs[func.name]?.[arg.name] || ''
                                  }
                                  onChange={(e) =>
                                    handleFunctionInputChange(
                                      func.name,
                                      arg.name,
                                      e.target.value
                                    )
                                  }
                                  placeholder={arg.description}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Recent Results
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {result.functionName}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.type === 'read'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {result.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded p-2 font-mono text-sm text-gray-800">
                    {formatResult(result.result)}
                  </div>

                  {result.transactionHash && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-600">TX:</span>
                      <code className="text-xs text-gray-800 font-mono">
                        {result.transactionHash.slice(0, 20)}...
                      </code>
                      <button
                        onClick={() =>
                          result.transactionHash &&
                          copyToClipboard(result.transactionHash)
                        }
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
