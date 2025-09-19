type NetworkType = 'local' | 'testnet' | 'mainnet';
type ChainType = 'core' | 'evm';

interface NetworkSelectorProps {
  currentNetwork: NetworkType;
  currentChain: ChainType;
  nodeRunning: boolean;
  onNetworkChange: (network: NetworkType, chain: ChainType) => void;
}

export function NetworkSelector({
  currentNetwork,
  currentChain,
  nodeRunning,
  onNetworkChange,
}: NetworkSelectorProps) {
  const networks = [
    {
      id: 'local' as NetworkType,
      name: 'Local Development',
      description: 'Local DevKit node',
      chains: {
        core: {
          name: 'Core Space',
          chainId: 2029,
          rpcUrl: 'http://localhost:12537',
        },
        evm: { name: 'eSpace', chainId: 2030, rpcUrl: 'http://localhost:8545' },
      },
      available: true,
      color: 'bg-green-100 text-green-800',
    },
    {
      id: 'testnet' as NetworkType,
      name: 'Conflux Testnet',
      description: 'Official test network',
      chains: {
        core: {
          name: 'Core Space',
          chainId: 1,
          rpcUrl: 'https://test.confluxrpc.com',
        },
        evm: {
          name: 'eSpace',
          chainId: 71,
          rpcUrl: 'https://evmtestnet.confluxrpc.com',
        },
      },
      available: !nodeRunning,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: 'mainnet' as NetworkType,
      name: 'Conflux Mainnet',
      description: 'Production network',
      chains: {
        core: {
          name: 'Core Space',
          chainId: 1029,
          rpcUrl: 'https://main.confluxrpc.com',
        },
        evm: {
          name: 'eSpace',
          chainId: 1030,
          rpcUrl: 'https://evm.confluxrpc.com',
        },
      },
      available: !nodeRunning,
      color: 'bg-blue-100 text-blue-800',
    },
  ];

  const handleNetworkChange = (network: NetworkType, chain: ChainType) => {
    const networkConfig = networks.find((n) => n.id === network);

    if (!networkConfig?.available) {
      if (nodeRunning) {
        alert(
          'Cannot switch networks while local node is running. Stop the node first.'
        );
      }
      return;
    }

    onNetworkChange(network, chain);
  };

  const currentNetworkConfig = networks.find((n) => n.id === currentNetwork);
  const currentChainConfig = currentNetworkConfig?.chains[currentChain];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Network Selector
      </h3>

      {/* Current Network Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Current Network:
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${currentNetworkConfig?.color}`}
          >
            {currentNetworkConfig?.name}
          </span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            Chain: {currentChainConfig?.name} (ID: {currentChainConfig?.chainId}
            )
          </p>
          <p>RPC: {currentChainConfig?.rpcUrl}</p>
        </div>
      </div>

      {nodeRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            🔒 Network locked to local while DevKit node is running
          </p>
        </div>
      )}

      {/* Network Options */}
      <div className="space-y-3">
        {networks.map((network) => (
          <div key={network.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{network.name}</h4>
                <p className="text-sm text-gray-500">{network.description}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${network.color}`}
              >
                {network.available ? 'Available' : 'Locked'}
              </span>
            </div>

            {/* Chain Selection */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleNetworkChange(network.id, 'core')}
                disabled={!network.available}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  !network.available
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : currentNetwork === network.id && currentChain === 'core'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Core Space ({network.chains.core.chainId})
              </button>
              <button
                type="button"
                onClick={() => handleNetworkChange(network.id, 'evm')}
                disabled={!network.available}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  !network.available
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : currentNetwork === network.id && currentChain === 'evm'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                eSpace ({network.chains.evm.chainId})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Wallet Connection Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          💡 <strong>Wallet Auto-Switch:</strong> When you select a network,
          connected wallets will automatically switch to the corresponding
          chain.
        </p>
      </div>
    </div>
  );
}
