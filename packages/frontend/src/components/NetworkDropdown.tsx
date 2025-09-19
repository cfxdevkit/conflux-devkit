import { useState, useRef, useEffect } from 'react';
import { DevKitApiService } from '../services/api';

type NetworkType = 'local' | 'testnet' | 'mainnet';

interface NetworkDropdownProps {
  currentNetwork: NetworkType;
  nodeRunning: boolean;
  onNetworkChange: (network: NetworkType) => void;
}

export function NetworkDropdown({
  currentNetwork,
  nodeRunning,
  onNetworkChange,
}: NetworkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const networks = [
    {
      id: 'local' as NetworkType,
      name: 'Local',
      description: 'DevKit node',
      available: true,
      color: 'text-green-600',
      dotColor: 'bg-green-500',
    },
    {
      id: 'testnet' as NetworkType,
      name: 'Testnet',
      description: 'Conflux test network',
      available: !nodeRunning,
      color: 'text-yellow-600',
      dotColor: 'bg-yellow-500',
    },
    {
      id: 'mainnet' as NetworkType,
      name: 'Mainnet',
      description: 'Conflux mainnet',
      available: !nodeRunning,
      color: 'text-blue-600',
      dotColor: 'bg-blue-500',
    },
  ];

  const currentNetworkConfig = networks.find((n) => n.id === currentNetwork);

  const handleNetworkChange = async (network: NetworkType) => {
    const networkConfig = networks.find((n) => n.id === network);

    if (!networkConfig?.available) {
      if (nodeRunning) {
        alert(
          'Cannot switch networks while local node is running. Stop the node first.'
        );
      }
      return;
    }

    if (network === currentNetwork) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await DevKitApiService.switchNetwork(network);
      onNetworkChange(network);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert('Failed to switch network. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Network button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSwitching ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
        ) : (
          <div className={`w-2 h-2 rounded-full mr-2 ${currentNetworkConfig?.dotColor}`} />
        )}
        <span className="mr-1">
          {currentNetworkConfig?.name}
        </span>
        <svg
          className={`ml-2 h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            {/* Current selection header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Network</span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${currentNetworkConfig?.dotColor}`} />
                  <span className="text-sm text-gray-900">
                    {currentNetworkConfig?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Lock notice */}
            {nodeRunning && (
              <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-blue-800">
                    Locked to local while node running
                  </span>
                </div>
              </div>
            )}

            {/* Network options */}
            <div className="max-h-48 overflow-y-auto">
              {networks.map((network) => (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => handleNetworkChange(network.id)}
                  disabled={!network.available || isSwitching}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 last:border-b-0 ${
                    currentNetwork === network.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${network.dotColor}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {network.name}
                        </span>
                        {currentNetwork === network.id && (
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {!network.available && (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {network.description}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer info */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 Server wallets connect to both Core and eSpace automatically
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}