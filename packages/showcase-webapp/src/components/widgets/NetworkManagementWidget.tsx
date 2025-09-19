import type { NetworkConfig } from '../../types/network';

interface NetworkManagementWidgetProps {
  currentNetwork: NetworkConfig;
  availableNetworks: NetworkConfig[];
  isSwitching: boolean;
  onSwitchNetwork: (networkId: string) => void;
  onAddNetwork: () => void;
}

export function NetworkManagementWidget({
  currentNetwork,
  availableNetworks,
  isSwitching,
  onSwitchNetwork,
  onAddNetwork
}: NetworkManagementWidgetProps) {
  const getNetworkStatusColor = (network: NetworkConfig) => {
    if (network.id === currentNetwork.id) return 'text-green-600';
    return 'text-gray-500';
  };

  const getNetworkIcon = (network: NetworkConfig) => {
    if (network.isTestnet) return '🧪';
    if (network.networkType === 'core') return '🔗';
    return '⛓️';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🌐 Network Management
        </h3>
        {isSwitching && (
          <div className="text-sm text-yellow-600">
            🔄 Switching...
          </div>
        )}
      </div>

      {/* Current Network */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getNetworkIcon(currentNetwork)}</span>
              <h4 className="font-medium text-gray-900">{currentNetwork.name}</h4>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                Connected
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Chain ID: {currentNetwork.chainId}
              {currentNetwork.evmChainId && ` | EVM: ${currentNetwork.evmChainId}`}
            </div>
            <div className="text-xs text-gray-500">
              RPC: {currentNetwork.rpcUrl}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Type</div>
            <div className="text-sm font-medium">{currentNetwork.networkType.toUpperCase()}</div>
            {currentNetwork.isTestnet && (
              <div className="text-xs text-orange-600">Testnet</div>
            )}
          </div>
        </div>
      </div>

      {/* Available Networks */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Available Networks</h5>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {availableNetworks.map((network) => (
            <button
              key={network.id}
              onClick={() => onSwitchNetwork(network.id)}
              disabled={network.id === currentNetwork.id || isSwitching}
              className={`w-full text-left p-2 rounded-md border transition-colors ${
                network.id === currentNetwork.id
                  ? 'bg-blue-50 border-blue-200 cursor-default'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 disabled:opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getNetworkIcon(network)}</span>
                  <div>
                    <div className="text-sm font-medium">{network.name}</div>
                    <div className="text-xs text-gray-500">
                      {network.networkType.toUpperCase()}
                      {network.isTestnet && ' • Testnet'}
                    </div>
                  </div>
                </div>
                <div className={`text-xs ${getNetworkStatusColor(network)}`}>
                  {network.id === currentNetwork.id ? '✅' : '⚪'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Network Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
        <div className="text-xs text-gray-500">
          Switch networks or add custom ones
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onAddNetwork}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            ➕ Add Network
          </button>
          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
}