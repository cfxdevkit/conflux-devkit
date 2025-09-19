import { useState } from 'react';
import type { HardhatScript, DeployConfig, ScriptParameter } from '../../types/hardhat';

interface DeploymentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (config: DeployConfig) => void;
  script: HardhatScript;
  isDeploying?: boolean;
}

export function DeploymentConfigModal({
  isOpen,
  onClose,
  onDeploy,
  script,
  isDeploying = false
}: DeploymentConfigModalProps) {
  const [parameters, setParameters] = useState<Record<string, any>>(
    script.parameters.reduce((acc, param) => ({
      ...acc,
      [param.name]: param.defaultValue || ''
    }), {})
  );

  const [gasConfig, setGasConfig] = useState({
    gasLimit: script.estimatedGas?.replace(/,/g, '') || '2000000',
    gasPrice: '20000000000', // 20 gwei
    value: '0'
  });

  const [advancedOptions, setAdvancedOptions] = useState({
    confirmations: 1,
    timeout: 300000, // 5 minutes
    skipVerification: false,
    saveArtifacts: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));

    // Clear error when user starts typing
    if (errors[paramName]) {
      setErrors(prev => ({ ...prev, [paramName]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required parameters
    script.parameters.forEach(param => {
      if (param.required && (!parameters[param.name] || parameters[param.name] === '')) {
        newErrors[param.name] = `${param.name} is required`;
      }

      // Type-specific validation
      if (parameters[param.name] && param.type === 'address') {
        if (!/^0x[a-fA-F0-9]{40}$/.test(parameters[param.name])) {
          newErrors[param.name] = 'Invalid address format';
        }
      }

      if (parameters[param.name] && (param.type.includes('uint') || param.type.includes('int'))) {
        if (isNaN(Number(parameters[param.name]))) {
          newErrors[param.name] = 'Must be a valid number';
        }
      }
    });

    // Validate gas configuration
    if (!gasConfig.gasLimit || Number(gasConfig.gasLimit) <= 0) {
      newErrors.gasLimit = 'Gas limit must be greater than 0';
    }

    if (!gasConfig.gasPrice || Number(gasConfig.gasPrice) <= 0) {
      newErrors.gasPrice = 'Gas price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeploy = () => {
    if (!validateForm()) return;

    const config: DeployConfig = {
      scriptId: script.id,
      parameters,
      gasLimit: gasConfig.gasLimit,
      gasPrice: gasConfig.gasPrice,
      value: gasConfig.value,
      confirmations: advancedOptions.confirmations
    };

    onDeploy(config);
  };

  const renderParameterInput = (param: ScriptParameter) => {
    const commonClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[param.name] ? 'border-red-300' : 'border-gray-300'
    }`;

    switch (param.type) {
      case 'bool':
        return (
          <select
            value={parameters[param.name] || 'false'}
            onChange={(e) => handleParameterChange(param.name, e.target.value === 'true')}
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
            value={parameters[param.name] || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className={commonClasses}
          />
        );

      case 'address':
        return (
          <input
            type="text"
            placeholder="0x..."
            value={parameters[param.name] || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className={commonClasses}
          />
        );

      case 'string':
        return (
          <input
            type="text"
            placeholder={param.description || `Enter ${param.name}`}
            value={parameters[param.name] || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className={commonClasses}
          />
        );

      default:
        return (
          <input
            type="text"
            placeholder={`Enter ${param.type}`}
            value={parameters[param.name] || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className={commonClasses}
          />
        );
    }
  };

  const estimatedCostUSD = (Number(gasConfig.gasLimit) * Number(gasConfig.gasPrice) / 1e18 * 0.05).toFixed(4); // Rough estimate

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Deploy Contract
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {script.name} • {script.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Script Information */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Script Path:</span>
              <span className="ml-2 font-mono text-gray-600">{script.path}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Estimated Gas:</span>
              <span className="ml-2 text-gray-600">{script.estimatedGas || 'Unknown'}</span>
            </div>
            {script.dependencies && script.dependencies.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Dependencies:</span>
                <span className="ml-2 text-gray-600">{script.dependencies.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Parameters */}
        {script.parameters.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Contract Parameters</h4>
            <div className="space-y-4">
              {script.parameters.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {param.name} ({param.type})
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {param.description && (
                    <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                  )}
                  {renderParameterInput(param)}
                  {errors[param.name] && (
                    <p className="mt-1 text-sm text-red-600">{errors[param.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gas Configuration */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Gas Configuration</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gas Limit *
              </label>
              <input
                type="number"
                value={gasConfig.gasLimit}
                onChange={(e) => setGasConfig(prev => ({ ...prev, gasLimit: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gasLimit ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.gasLimit && <p className="mt-1 text-sm text-red-600">{errors.gasLimit}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gas Price (wei) *
              </label>
              <input
                type="number"
                value={gasConfig.gasPrice}
                onChange={(e) => setGasConfig(prev => ({ ...prev, gasPrice: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gasPrice ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.gasPrice && <p className="mt-1 text-sm text-red-600">{errors.gasPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value (CFX)
              </label>
              <input
                type="number"
                step="0.001"
                value={gasConfig.value}
                onChange={(e) => setGasConfig(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-mono">{(Number(gasConfig.gasLimit) * Number(gasConfig.gasPrice) / 1e18).toFixed(6)} CFX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">USD Equivalent:</span>
                <span className="font-mono text-green-600">~${estimatedCostUSD}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Advanced Options</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmations
                </label>
                <input
                  type="number"
                  min="1"
                  value={advancedOptions.confirmations}
                  onChange={(e) => setAdvancedOptions(prev => ({ ...prev, confirmations: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={advancedOptions.timeout / 1000}
                  onChange={(e) => setAdvancedOptions(prev => ({ ...prev, timeout: Number(e.target.value) * 1000 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedOptions.skipVerification}
                  onChange={(e) => setAdvancedOptions(prev => ({ ...prev, skipVerification: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Skip contract verification</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={advancedOptions.saveArtifacts}
                  onChange={(e) => setAdvancedOptions(prev => ({ ...prev, saveArtifacts: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Save deployment artifacts</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            * Required fields • Review all parameters carefully
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeploying ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Deploying...
                </div>
              ) : (
                '🚀 Deploy Contract'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}