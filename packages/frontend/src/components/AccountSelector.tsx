import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { DevKitApiService } from '../services/api';
import type { AccountBalance, AllAccountsResponse } from '../types/accounts';
import { WalletMethods } from './WalletMethods';

interface AccountSelectorProps {
  currentNetwork: 'local' | 'testnet' | 'mainnet';
}

export function AccountSelector({ currentNetwork }: AccountSelectorProps) {
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch all accounts
  const {
    data: accountsData,
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery<AllAccountsResponse>({
    queryKey: ['accounts', currentNetwork],
    queryFn: DevKitApiService.getAllAccounts,
    refetchInterval: 30000,
    retry: 2,
  });

  // Fetch balance for selected account
  const { data: balance, isLoading: balanceLoading } = useQuery<AccountBalance>(
    {
      queryKey: ['account-balance', selectedAccountIndex, currentNetwork],
      queryFn: () => DevKitApiService.getAccountBalance(selectedAccountIndex),
      enabled: !!accountsData?.accounts,
      refetchInterval: currentNetwork === 'local' ? 5000 : false, // Only poll on local
      retry: 1,
    }
  );

  // Auto-select first account when data loads
  useEffect(() => {
    if (
      accountsData?.accounts &&
      accountsData.accounts.length > 0 &&
      selectedAccountIndex >= accountsData.accounts.length
    ) {
      setSelectedAccountIndex(0);
    }
  }, [accountsData, selectedAccountIndex]);

  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (balance: string) => {
    if (!balance || balance === '0') return '0';
    const cfx = parseFloat(balance) / 10 ** 18;
    return cfx.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  };

  // Get network status color and text
  const getNetworkStatus = () => {
    if (currentNetwork === 'local') {
      if (balance?.error) {
        return {
          color: 'text-red-600',
          text: 'Node not running',
          dot: 'bg-red-500',
        };
      }
      return {
        color: 'text-green-600',
        text: 'Node connected',
        dot: 'bg-green-500',
      };
    } else {
      return {
        color: 'text-blue-600',
        text: `Connected to ${currentNetwork}`,
        dot: currentNetwork === 'testnet' ? 'bg-yellow-500' : 'bg-blue-500',
      };
    }
  };

  if (accountsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading accounts...</span>
        </div>
      </div>
    );
  }

  if (
    accountsError ||
    !accountsData?.accounts ||
    accountsData.accounts.length === 0
  ) {
    const getErrorMessage = () => {
      if (currentNetwork === 'local') {
        return {
          title: 'Local Node Not Connected',
          message:
            'DevKit local node is not running. Start the node to access accounts.',
          status: 'warning' as const,
        };
      } else {
        return {
          title: 'Accounts Unavailable',
          message: `Unable to connect to ${currentNetwork} network accounts.`,
          status: 'error' as const,
        };
      }
    };

    const errorInfo = getErrorMessage();
    const bgColor =
      errorInfo.status === 'warning'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-red-50 border-red-200';
    const iconColor =
      errorInfo.status === 'warning' ? 'text-yellow-400' : 'text-red-400';
    const textColor =
      errorInfo.status === 'warning' ? 'text-yellow-800' : 'text-red-800';

    return (
      <div className={`${bgColor} border rounded-lg p-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className={`h-5 w-5 ${iconColor}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${textColor}`}>
              {errorInfo.title}
            </h3>
            <div className={`mt-1 text-sm ${textColor.replace('800', '700')}`}>
              {errorInfo.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedAccount = accountsData.accounts[selectedAccountIndex];
  const networkStatus = getNetworkStatus();

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Account Management
            </h2>
            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
              <span>{accountsData.total} accounts available</span>
              <span>•</span>
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${networkStatus.dot}`}
                />
                <span className={networkStatus.color}>
                  {networkStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Selector */}
      <div className="px-6 py-4">
        <div className="relative">
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Select Account
          </div>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select account"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">
                  Account {selectedAccountIndex}
                </span>
                {selectedAccount?.isAdmin && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </div>
              <svg
                className={`ml-2 h-5 w-5 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
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
            </div>
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
              {accountsData.accounts.map((account) => (
                <button
                  key={account.index}
                  type="button"
                  onClick={() => {
                    setSelectedAccountIndex(account.index);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedAccountIndex === account.index
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Account {account.index}</span>
                    {account.isAdmin && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Account Details */}
        {selectedAccount && (
          <div className="mt-4 space-y-3">
            {/* Addresses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    Core Address
                  </div>
                  <code className="text-sm text-gray-900 font-mono truncate block">
                    {formatAddress(selectedAccount.addresses.core)}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      selectedAccount.addresses.core
                    )
                  }
                  className="text-gray-400 hover:text-gray-600 p-1 ml-2 flex-shrink-0"
                  title="Copy Core address"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    eSpace Address
                  </div>
                  <code className="text-sm text-gray-900 font-mono truncate block">
                    {formatAddress(selectedAccount.addresses.evm)}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(selectedAccount.addresses.evm)
                  }
                  className="text-gray-400 hover:text-gray-600 p-1 ml-2 flex-shrink-0"
                  title="Copy eSpace address"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Balances */}
            {currentNetwork === 'local' && balance && !balance.error && (
              <div className="flex justify-between p-3 bg-green-50 rounded-lg text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600">Core:</span>
                  <span className="ml-2 font-medium text-green-700">
                    {formatBalance(balance.balances.core)} CFX
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">eSpace:</span>
                  <span className="ml-2 font-medium text-purple-700">
                    {formatBalance(balance.balances.evm)} CFX
                  </span>
                </div>
              </div>
            )}

            {/* Loading balance indicator */}
            {balanceLoading && currentNetwork === 'local' && (
              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Loading balance...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network Information */}
      <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">DevKit Account System</p>
            <p className="mt-1">
              {currentNetwork === 'local'
                ? 'Accounts are managed by local DevKit node. Transfer funds and interact with local contracts directly.'
                : `Accounts can operate on ${currentNetwork} through DevKit API. All wallet operations are handled server-side with proper network configuration.`}
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Methods */}
      {selectedAccount && (
        <div className="border-t border-gray-200">
          <WalletMethods
            account={selectedAccount}
            currentNetwork={currentNetwork}
          />
        </div>
      )}
    </div>
  );
}
