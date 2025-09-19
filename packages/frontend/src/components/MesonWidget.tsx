import { useState, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MesonToButton } from '@mesonfi/to/react';
import { DevKitApiService } from '../services/api';

interface Account {
  index: number;
  addresses: {
    core: string;
    evm: string;
  };
  isAdmin?: boolean;
}

interface MesonWidgetProps {
  isVisible: boolean;
  currentNetwork: string;
}

interface CompletedData {
  swapId: string;
  amount: number;
  received: number;
  from: {
    chain: string;
    token: string;
  };
  to: {
    chain: string;
    token: string;
  };
}

export function MesonWidget({ isVisible, currentNetwork }: MesonWidgetProps) {
  const [completedData, setCompletedData] = useState<CompletedData | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);
  const selectId = useId();

  // Fetch accounts
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: DevKitApiService.getAllAccounts,
    enabled: isVisible && currentNetwork === 'mainnet',
  });

  // Get the selected account
  const selectedAccount = accountsData?.accounts?.[selectedAccountIndex];


  // Only show on mainnet
  if (!isVisible || currentNetwork !== 'mainnet') {
    return null;
  }

  const handleCompleted = (data: CompletedData) => {
    console.log('Meson cross-chain transfer completed:', data);
    setCompletedData(data);
    setIsPending(false);
  };



  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cross-Chain Bridge</h3>
          <p className="text-sm text-gray-600 mt-1">
            Transfer stablecoins across blockchains with Meson
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">Powered by</span>
          <span className="text-sm font-medium text-blue-600">Meson</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Meson Integration */}
        
        {/* Account Selector */}
        {accountsData?.accounts && accountsData.accounts.length > 0 && (
          <div className="mb-4">
            <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-2">
              Destination Account (eSpace)
            </label>
            <select
              id={selectId}
              value={selectedAccountIndex}
              onChange={(e) => setSelectedAccountIndex(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {accountsData.accounts.map((account: Account, index: number) => (
                <option key={account.index || index} value={index}>
                  Account {index} - {account.addresses.evm.slice(0, 6)}...{account.addresses.evm.slice(-4)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* eSpace Info (EVM Only) */}
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
            <div className="text-sm font-medium text-amber-800">EVM Compatible Only</div>
          </div>
          <div className="text-xs text-amber-700">
            Meson supports <strong>Conflux eSpace</strong> (EVM-compatible). 
            Core Space is not supported as it's not EVM-compatible.
          </div>
          {selectedAccount && (
            <div className="mt-3 p-2 bg-white rounded text-xs border border-amber-200">
              <div className="text-amber-700 font-medium">Destination Chain: Conflux eSpace (cfx)</div>
              <div className="text-amber-700 font-medium mt-1">Target Address:</div>
              <div className="font-mono text-gray-900 truncate mt-1">
                {selectedAccount.addresses.evm}
              </div>
            </div>
          )}
        </div>

        {/* Meson Integration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">
              Bridge to Conflux eSpace
            </div>
            <div className="text-xs text-gray-500">
              EVM • Low Fees • Fast
            </div>
          </div>
          
          <div className="w-full">
                        <MesonToButton
              options={{
                to: 'cfx',
                recipient: selectedAccount?.addresses.evm || '0x0000000000000000000000000000000000000000'
              }}
              onCompleted={handleCompleted}
              className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm"
            >
              <ButtonContent isPending={isPending} />
            </MesonToButton>
          </div>
        </div>

        {/* Completed Transfer Info */}
        {completedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-800">Transfer Completed</span>
            </div>
            <div className="text-xs text-green-700 space-y-1">
              <div>
                {completedData.amount / 1e6} {completedData.from.token} from {completedData.from.chain}
              </div>
              <div className="flex items-center">
                <span className="mr-2">→</span>
                {completedData.received / 1e6} {completedData.to.token} on {completedData.to.chain}
              </div>
              <div className="mt-2">
                <a
                  href={`https://explorer.meson.fi/swap/${completedData.swapId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View on Meson Explorer
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Supported tokens:</span>
            <span className="font-mono">USDT, USDC, BUSD</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Fee:</span>
            <span className="text-green-600">~0.1%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Speed:</span>
            <span className="text-blue-600">1-3 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonContent({ isPending }: { isPending: boolean }) {
  if (isPending) {
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        <span>Processing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span>Bridge Assets</span>
    </div>
  );
}