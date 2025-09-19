// ConnectKit-based authentication button for DevKit Backend Core
import { ConnectKitButton } from 'connectkit';
import React from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useAuthStore } from '../stores/authStore';

interface ConnectButtonProps {
  className?: string;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ className = '' }) => {
  const { address: wagmiAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const {
    isConnected: isAuthenticated,
    walletAddress,
    isAdmin,
    isAuthenticating,
    authRefused,
    connect,
    disconnect,
    clearRefusal
  } = useAuthStore();

  // Handle authentication after wallet connection
  const handleAuth = React.useCallback(async (address: string) => {
    if (address) {
      try {
        await connect(address, async (message: string) => {
          return await signMessageAsync({ message });
        });
      } catch (error) {
        console.error('Authentication failed:', error);
      }
    }
  }, [connect, signMessageAsync]);

  // Handle logout with wallet disconnection
  const handleLogout = React.useCallback(async (hideModal?: () => void) => {
    disconnect();
    wagmiDisconnect();
    hideModal?.();
  }, [disconnect, wagmiDisconnect]);

  // Auto-authenticate when wallet connects (but not if user previously refused)
  React.useEffect(() => {
    if (wagmiAddress && !isAuthenticated && !isAuthenticating && !authRefused) {
      handleAuth(wagmiAddress);
    }
  }, [wagmiAddress, isAuthenticated, isAuthenticating, authRefused, handleAuth]);

  // Clear refusal state when wallet address changes (new wallet connected)
  React.useEffect(() => {
    if (wagmiAddress) {
      clearRefusal();
    }
  }, [wagmiAddress, clearRefusal]);

  return (
    <ConnectKitButton.Custom>
      {({ isConnected: ckIsConnected, isConnecting, show, hide, address }) => {

        // Show loading state
        if (isConnecting) {
          return (
            <button 
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 ${className}`} 
              disabled
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </button>
          );
        }

        // Show authenticated state
        if (isAuthenticated && walletAddress) {
          return (
            <div className="relative">
              <button
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 ${className}`}
                onClick={() => {
                  const dropdown = document.getElementById('user-dropdown');
                  dropdown?.classList.toggle('hidden');
                }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div id="user-dropdown" className="hidden absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border">
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${isAdmin ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {isAdmin ? 'Administrator' : 'User'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      {walletAddress}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Status</div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-700">Connected to DevKit</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-red-700">Admin Access</span>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3">
                    <button
                      onClick={() => handleLogout(hide)}
                      className="w-full text-left text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Show connect button
        if (!ckIsConnected) {
          return (
            <button
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 ${className}`}
              onClick={show}
            >
              Connect Wallet
            </button>
          );
        }

        // Wallet connected but not authenticated
        if (authRefused) {
          // User refused to sign - show options
          return (
            <div className="relative">
              <button
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 ${className}`}
                onClick={() => {
                  const dropdown = document.getElementById('refused-dropdown');
                  dropdown?.classList.toggle('hidden');
                }}
              >
                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                Authentication Required
                <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div id="refused-dropdown" className="hidden absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border">
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-gray-900">Authentication Required</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      You need to sign a message to verify wallet ownership
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <button
                      onClick={() => {
                        document.getElementById('refused-dropdown')?.classList.add('hidden');
                        if (address) handleAuth(address);
                      }}
                      className="w-full mb-2 text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-2 rounded"
                    >
                      ✓ Sign Message & Authenticate
                    </button>
                    <button
                      onClick={() => {
                        document.getElementById('refused-dropdown')?.classList.add('hidden');
                        wagmiDisconnect();
                      }}
                      className="w-full text-left text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-2 rounded"
                    >
                      ✗ Disconnect Wallet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Wallet connected but not authenticated (auto-auth didn't trigger yet)
        return (
          <button
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 ${className}`}
            onClick={() => address && handleAuth(address)}
          >
            Authenticate
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};