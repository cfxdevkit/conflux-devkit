import { useState } from 'react';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: string) => void;
  isConnecting: boolean;
}

interface SupportedWallet {
  id: string;
  name: string;
  icon: string;
  description: string;
  isInstalled: boolean;
  installUrl?: string;
}

export function WalletConnectionModal({
  isOpen,
  onClose,
  onConnect,
  isConnecting
}: WalletConnectionModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  if (!isOpen) return null;

  const supportedWallets: SupportedWallet[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask browser extension',
      isInstalled: typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
      installUrl: 'https://metamask.io'
    },
    {
      id: 'fluent',
      name: 'Fluent Wallet',
      icon: '🌊',
      description: 'Connect using Fluent Wallet for Conflux',
      isInstalled: typeof window !== 'undefined' && !!(window as any).conflux,
      installUrl: 'https://fluentwallet.com'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect using WalletConnect protocol',
      isInstalled: true, // Always available
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🏛️',
      description: 'Connect using Coinbase Wallet',
      isInstalled: typeof window !== 'undefined' && !!(window as any).ethereum?.isCoinbaseWallet,
      installUrl: 'https://wallet.coinbase.com'
    }
  ];

  const handleWalletSelect = (walletId: string) => {
    setSelectedWallet(walletId);
  };

  const handleConnect = () => {
    if (selectedWallet) {
      onConnect(selectedWallet);
    }
  };

  const handleInstall = (wallet: SupportedWallet) => {
    if (wallet.installUrl) {
      window.open(wallet.installUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Connect Wallet
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Choose a wallet to connect to the Conflux network
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Wallet Options */}
        <div className="p-6">
          <div className="space-y-3">
            {supportedWallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedWallet === wallet.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!wallet.isInstalled ? 'opacity-60' : ''}`}
                onClick={() => wallet.isInstalled && handleWalletSelect(wallet.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{wallet.name}</div>
                      <div className="text-sm text-gray-500">{wallet.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!wallet.isInstalled ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstall(wallet);
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Install
                      </button>
                    ) : selectedWallet === wallet.id ? (
                      <span className="text-blue-600">✓</span>
                    ) : (
                      <span className="text-gray-300">○</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Network Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Network Configuration</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Network: Conflux Testnet</div>
              <div>Chain ID: 1</div>
              <div>RPC URL: https://test.confluxrpc.com</div>
              <div>Currency: CFX</div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500 text-sm">⚠️</span>
              <div className="text-sm text-yellow-700">
                <div className="font-medium">Security Notice</div>
                <div>
                  Only connect to trusted websites. Never share your seed phrase or private keys.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedWallet
              ? `Ready to connect with ${supportedWallets.find(w => w.id === selectedWallet)?.name}`
              : 'Select a wallet to continue'
            }
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={!selectedWallet || isConnecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}