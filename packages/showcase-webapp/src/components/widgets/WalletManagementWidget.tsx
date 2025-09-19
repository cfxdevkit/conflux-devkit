import type { WalletInfo, InternalWallet } from '../../types/wallet';

interface WalletManagementWidgetProps {
  internalWallet: InternalWallet;
  browserWallet: WalletInfo | null;
  activeWallet: 'internal' | 'browser';
  isConnecting: boolean;
  onConnectBrowser: () => void;
  onDisconnectBrowser: () => void;
  onSwitchWallet: (type: 'internal' | 'browser') => void;
}

export function WalletManagementWidget({
  internalWallet,
  browserWallet,
  activeWallet,
  isConnecting,
  onConnectBrowser,
  onDisconnectBrowser,
  onSwitchWallet
}: WalletManagementWidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          💼 Wallet Management
        </h3>
        <div className="text-sm text-gray-500">
          Active: {activeWallet === 'internal' ? 'Internal' : 'Browser'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Internal Wallet */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">🔑 Internal Wallet</h4>
            <button
              onClick={() => onSwitchWallet('internal')}
              className={`px-2 py-1 text-xs rounded ${
                activeWallet === 'internal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {activeWallet === 'internal' ? 'Active' : 'Switch'}
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">EVM:</span>
              <span className="ml-2 font-mono text-xs">
                {internalWallet.evm.address}
              </span>
              <div className="text-xs text-gray-400 ml-12">
                Balance: {internalWallet.evm.balanceFormatted}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Core:</span>
              <span className="ml-2 font-mono text-xs">
                {internalWallet.core.address}
              </span>
              <div className="text-xs text-gray-400 ml-12">
                Balance: {internalWallet.core.balanceFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* Browser Wallet */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">🔗 Browser Wallet</h4>
            {browserWallet ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onSwitchWallet('browser')}
                  className={`px-2 py-1 text-xs rounded ${
                    activeWallet === 'browser'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {activeWallet === 'browser' ? 'Active' : 'Switch'}
                </button>
                <button
                  onClick={onDisconnectBrowser}
                  className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectBrowser}
                disabled={isConnecting}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
          {browserWallet ? (
            <div className="text-sm">
              <div>
                <span className="text-gray-500">Address:</span>
                <span className="ml-2 font-mono text-xs">
                  {browserWallet.address}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Balance: {browserWallet.balanceFormatted}
              </div>
              <div className="text-xs text-gray-400">
                Network: {browserWallet.network || 'Unknown'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No browser wallet connected
            </div>
          )}
        </div>

        {/* Wallet Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Click "Connect" to add a browser wallet like MetaMask
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              ⚙️ Settings
            </button>
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              📋 History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}