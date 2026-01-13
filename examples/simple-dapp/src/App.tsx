/*
 * Simple dApp Example - Using Conflux DevKit Modular Packages
 *
 * This example demonstrates:
 * - @conflux-devkit/ui-headless for UI components
 * - @conflux-devkit/wallet for advanced wallet features
 * - @conflux-devkit/contracts for contract interactions
 */

import React from 'react';
import {
  DevKitProvider,
  WalletProvider,
  ConnectButton,
  AccountCard,
  ContractReader,
  SwapWidget,
} from '@conflux-devkit/ui-headless';
import { ERC20_ABI } from '@conflux-devkit/contracts';

function App() {
  return (
    <DevKitProvider
      apiUrl="http://localhost:3000"
      network="testnet"
    >
      <WalletProvider>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Conflux DevKit Example
              </h1>
              <p className="text-gray-600">
                Modular architecture demonstration
              </p>
            </header>

            {/* Wallet Connection */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
              <div className="space-y-4">
                {/* Using render prop for custom styling */}
                <ConnectButton>
                  {({ isConnected, address, connect, disconnect, isLoading }) => (
                    <button
                      onClick={isConnected ? disconnect : connect}
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {isLoading ? (
                        'Connecting...'
                      ) : isConnected ? (
                        `Disconnect ${address?.slice(0, 6)}...${address?.slice(-4)}`
                      ) : (
                        'Connect Wallet'
                      )}
                    </button>
                  )}
                </ConnectButton>

                {/* Account info with default styling */}
                <AccountCard
                  showBalance
                  className="p-6 bg-white rounded-lg shadow"
                />
              </div>
            </section>

            {/* Contract Interaction */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Contract Interaction</h2>
              <div className="bg-white p-6 rounded-lg shadow">
                <ContractReader
                  address="0x7d682e65efc5c13bf4e394b8f376c48e6bae0355"
                  abi={ERC20_ABI}
                  functionName="name"
                  chain="evm"
                >
                  {({ read, result, isLoading, error }) => (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Read ERC20 Token Name</h3>
                        <button
                          onClick={() => read()}
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {isLoading ? 'Reading...' : 'Read Token Name'}
                        </button>
                      </div>
                      {result && (
                        <div className="p-4 bg-green-50 rounded">
                          <p className="text-sm font-medium text-green-900">
                            Token Name: {result}
                          </p>
                        </div>
                      )}
                      {error && (
                        <div className="p-4 bg-red-50 rounded">
                          <p className="text-sm text-red-700">{error.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </ContractReader>
              </div>
            </section>

            {/* Swap Widget */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Token Swap (Swappi)</h2>
              <SwapWidget
                defaultSlippage={0.5}
                onSuccess={(hash) => {
                  console.log('Swap successful!', hash);
                  alert(`Swap successful! TX: ${hash}`);
                }}
                className="bg-white p-6 rounded-lg shadow"
              >
                {({ getQuote, executeSwap, quote, isLoadingQuote, isExecutingSwap, error, hash }) => (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-4">Swap WCFX for USDT</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => getQuote(
                            '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b', // WCFX
                            '0xfe97e85d13abd9c1c33384e796f10b73905637ce', // USDT
                            '1.0'
                          )}
                          disabled={isLoadingQuote}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                          {isLoadingQuote ? 'Getting Quote...' : 'Get Quote for 1.0 WCFX'}
                        </button>

                        {quote && (
                          <div className="p-4 bg-purple-50 rounded space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Amount In:</span> {quote.amountIn} WCFX
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Amount Out:</span> {quote.amountOut} USDT
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Min Amount:</span> {quote.amountOutMin} USDT
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Price Impact:</span> {quote.priceImpact}%
                            </p>
                            <button
                              onClick={executeSwap}
                              disabled={isExecutingSwap}
                              className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                              {isExecutingSwap ? 'Swapping...' : 'Execute Swap'}
                            </button>
                          </div>
                        )}

                        {hash && (
                          <div className="p-4 bg-green-50 rounded">
                            <p className="text-sm font-medium text-green-900 mb-1">
                              Swap Successful!
                            </p>
                            <p className="text-xs font-mono text-green-700 break-all">
                              {hash}
                            </p>
                          </div>
                        )}

                        {error && (
                          <div className="p-4 bg-red-50 rounded">
                            <p className="text-sm text-red-700">{error.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </SwapWidget>
            </section>

            {/* Footer */}
            <footer className="text-center text-sm text-gray-500">
              <p>Built with Conflux DevKit Modular Architecture</p>
              <p className="mt-1">
                Using: @conflux-devkit/ui-headless, @conflux-devkit/wallet, @conflux-devkit/contracts
              </p>
            </footer>
          </div>
        </div>
      </WalletProvider>
    </DevKitProvider>
  );
}

export default App;
