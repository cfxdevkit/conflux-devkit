import { useState } from 'react';
import type { NetworkConfig } from '../../types/network';

interface NetworkConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (network: NetworkConfig) => void;
  existingNetwork?: NetworkConfig;
}

export function NetworkConfigModal({
  isOpen,
  onClose,
  onSave,
  existingNetwork
}: NetworkConfigModalProps) {
  const [formData, setFormData] = useState<Partial<NetworkConfig>>(
    existingNetwork || {
      id: '',
      name: '',
      rpcUrl: '',
      chainId: '',
      evmChainId: '',
      currency: {
        name: 'Conflux',
        symbol: 'CFX',
        decimals: '18'
      },
      isTestnet: true,
      networkType: 'core',
      blockExplorer: ''
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof NetworkConfig] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Network name is required';
    }

    if (!formData.rpcUrl?.trim()) {
      newErrors.rpcUrl = 'RPC URL is required';
    } else if (!formData.rpcUrl.match(/^https?:\/\/.+/)) {
      newErrors.rpcUrl = 'RPC URL must be a valid HTTP/HTTPS URL';
    }

    if (!formData.chainId?.trim()) {
      newErrors.chainId = 'Chain ID is required';
    }

    if (!formData.currency?.name?.trim()) {
      newErrors['currency.name'] = 'Currency name is required';
    }

    if (!formData.currency?.symbol?.trim()) {
      newErrors['currency.symbol'] = 'Currency symbol is required';
    }

    if (!formData.currency?.decimals?.trim()) {
      newErrors['currency.decimals'] = 'Currency decimals is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const network: NetworkConfig = {
      id: formData.id || `custom-${Date.now()}`,
      name: formData.name!,
      rpcUrl: formData.rpcUrl!,
      chainId: formData.chainId!,
      evmChainId: formData.evmChainId,
      currency: {
        name: formData.currency!.name,
        symbol: formData.currency!.symbol,
        decimals: formData.currency!.decimals
      },
      isTestnet: formData.isTestnet!,
      networkType: formData.networkType!,
      blockExplorer: formData.blockExplorer
    };

    onSave(network);
    onClose();
  };

  const predefinedNetworks = [
    {
      name: 'Conflux Mainnet',
      rpcUrl: 'https://main.confluxrpc.com',
      chainId: '1029',
      evmChainId: '1030',
      isTestnet: false
    },
    {
      name: 'Conflux Testnet',
      rpcUrl: 'https://test.confluxrpc.com',
      chainId: '1',
      evmChainId: '71',
      isTestnet: true
    },
    {
      name: 'Local Conflux',
      rpcUrl: 'http://localhost:12537',
      chainId: '999',
      evmChainId: '999',
      isTestnet: true
    }
  ];

  const loadPredefined = (preset: any) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      rpcUrl: preset.rpcUrl,
      chainId: preset.chainId,
      evmChainId: preset.evmChainId,
      isTestnet: preset.isTestnet
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {existingNetwork ? 'Edit Network' : 'Add Custom Network'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure network connection settings
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Predefined Networks */}
        {!existingNetwork && (
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Quick Setup</h4>
            <div className="grid gap-2">
              {predefinedNetworks.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPredefined(preset)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-500">{preset.rpcUrl}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Network Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Network Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., My Custom Network"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* RPC URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RPC URL *
            </label>
            <input
              type="url"
              value={formData.rpcUrl || ''}
              onChange={(e) => handleChange('rpcUrl', e.target.value)}
              placeholder="https://your-rpc-endpoint.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.rpcUrl ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.rpcUrl && <p className="mt-1 text-sm text-red-600">{errors.rpcUrl}</p>}
          </div>

          {/* Chain IDs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chain ID *
              </label>
              <input
                type="text"
                value={formData.chainId || ''}
                onChange={(e) => handleChange('chainId', e.target.value)}
                placeholder="1029"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.chainId ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.chainId && <p className="mt-1 text-sm text-red-600">{errors.chainId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EVM Chain ID
              </label>
              <input
                type="text"
                value={formData.evmChainId || ''}
                onChange={(e) => handleChange('evmChainId', e.target.value)}
                placeholder="1030"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Currency</h5>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.currency?.name || ''}
                  onChange={(e) => handleChange('currency.name', e.target.value)}
                  placeholder="Conflux"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['currency.name'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={formData.currency?.symbol || ''}
                  onChange={(e) => handleChange('currency.symbol', e.target.value)}
                  placeholder="CFX"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['currency.symbol'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decimals *
                </label>
                <input
                  type="number"
                  value={formData.currency?.decimals || ''}
                  onChange={(e) => handleChange('currency.decimals', e.target.value)}
                  placeholder="18"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['currency.decimals'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Network Type & Testnet */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network Type
              </label>
              <select
                value={formData.networkType || 'core'}
                onChange={(e) => handleChange('networkType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="core">Core</option>
                <option value="evm">EVM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <select
                value={formData.isTestnet ? 'testnet' : 'mainnet'}
                onChange={(e) => handleChange('isTestnet', e.target.value === 'testnet')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>
          </div>

          {/* Block Explorer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block Explorer URL
            </label>
            <input
              type="url"
              value={formData.blockExplorer || ''}
              onChange={(e) => handleChange('blockExplorer', e.target.value)}
              placeholder="https://confluxscan.io"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            * Required fields
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {existingNetwork ? 'Update Network' : 'Add Network'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}