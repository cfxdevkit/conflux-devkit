import { ConnectButton } from './ConnectButton';
import { NetworkDropdown } from './NetworkDropdown';
import { useAuthStore } from '../stores/authStore';

interface HeaderProps {
  currentNetwork: 'local' | 'testnet' | 'mainnet';
  nodeRunning: boolean;
  onNetworkChange: (network: 'local' | 'testnet' | 'mainnet') => void;
}

export function Header({
  currentNetwork,
  nodeRunning,
  onNetworkChange,
}: HeaderProps) {
  const { isAdmin } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Conflux DevKit
          </h1>
          {isAdmin && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Admin
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <NetworkDropdown
            currentNetwork={currentNetwork}
            nodeRunning={nodeRunning}
            onNetworkChange={onNetworkChange}
          />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}