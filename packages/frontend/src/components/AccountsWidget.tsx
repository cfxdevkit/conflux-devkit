import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AccountCard } from '../components/AccountCard';
import { WalletMethods } from '../components/WalletMethods';
import { DevKitApiService } from '../services/api';
import type { AllAccountsResponse } from '../types/accounts';

interface AccountsWidgetProps {
  currentNetwork: 'local' | 'testnet' | 'mainnet';
}

export function AccountsWidget({ currentNetwork }: AccountsWidgetProps) {
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  // Fetch all accounts
  const { 
    data: accountsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<AllAccountsResponse>({
    queryKey: ['accounts', currentNetwork],
    queryFn: DevKitApiService.getAllAccounts,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
  });

  // Auto-select first account if none selected
  useEffect(() => {
    if (accountsData?.accounts && accountsData.accounts.length > 0 && selectedAccount === null) {
      setSelectedAccount(0);
    }
  }, [accountsData, selectedAccount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    // Show different error messages based on network
    const getErrorMessage = () => {
      if (currentNetwork === 'local') {
        return {
          title: 'Local Node Not Connected',
          message: 'DevKit local node is not running. Start the node to access accounts.',
          status: 'warning' as const,
        };
      } else {
        return {
          title: 'Network Connection Failed',
          message: `Unable to connect to ${currentNetwork} network. Check your connection.`,
          status: 'error' as const,
        };
      }
    };

    const errorInfo = getErrorMessage();
    const bgColor = errorInfo.status === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
    const iconColor = errorInfo.status === 'warning' ? 'text-yellow-400' : 'text-red-400';
    const textColor = errorInfo.status === 'warning' ? 'text-yellow-800' : 'text-red-800';
    const buttonColor = errorInfo.status === 'warning' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-red-100 text-red-800 hover:bg-red-200';

    return (
      <div className={`${bgColor} border rounded-lg p-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${textColor}`}>
              {errorInfo.title}
            </h3>
            <div className={`mt-1 text-sm ${textColor.replace('800', '700')}`}>
              {errorInfo.message}
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => refetch()}
                className={`${buttonColor} text-xs font-medium px-2 py-1 rounded`}
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accountsData?.accounts || accountsData.accounts.length === 0) {
    const getEmptyMessage = () => {
      if (currentNetwork === 'local') {
        return {
          title: 'No Local Accounts',
          message: 'Start the DevKit node to generate test accounts.',
          icon: 'wallet',
        };
      } else {
        return {
          title: 'Server Accounts Unavailable',
          message: `Server accounts are not available on ${currentNetwork}. Use external wallets to connect.`,
          icon: 'connection',
        };
      }
    };

    const emptyInfo = getEmptyMessage();

    return (
      <div className="text-center p-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {emptyInfo.icon === 'wallet' ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          )}
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyInfo.title}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {emptyInfo.message}
        </p>
      </div>
    );
  }

  const selectedAccountData = accountsData.accounts.find(acc => acc.index === selectedAccount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Account Management
          </h2>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span>{accountsData.total} accounts available</span>
            <span>•</span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                currentNetwork === 'local' ? 'bg-green-500' : 
                currentNetwork === 'testnet' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <span className="capitalize">{currentNetwork} Network</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountsData.accounts.map((account) => (
          <AccountCard
            key={account.index}
            account={account}
            isSelected={selectedAccount === account.index}
            onSelect={setSelectedAccount}
            currentNetwork={currentNetwork}
          />
        ))}
      </div>

      {/* Faucet Account (if available and admin) */}
      {accountsData.faucetAccount && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Faucet Account (Mining Rewards)
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Core:</span>
                <code className="ml-2 text-gray-600">
                  {accountsData.faucetAccount.addresses.core.slice(0, 20)}...
                </code>
              </div>
              <div>
                <span className="font-medium text-gray-700">eSpace:</span>
                <code className="ml-2 text-gray-600">
                  {accountsData.faucetAccount.addresses.evm}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Methods Panel */}
      {selectedAccountData && (
        <div className="border-t pt-6">
          <WalletMethods 
            account={selectedAccountData}
            currentNetwork={currentNetwork}
          />
        </div>
      )}
    </div>
  );
}