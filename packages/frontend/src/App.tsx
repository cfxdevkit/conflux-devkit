/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProviderWrapper } from './providers/WagmiProvider';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Contracts } from './pages/Contracts';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './components/Toast';

function App() {
  const { isConnected } = useAuthStore();
  const [currentNetwork, setCurrentNetwork] = useState<'local' | 'testnet' | 'mainnet'>('local');
  const [nodeRunning, setNodeRunning] = useState(false);

  const handleNetworkChange = (network: 'local' | 'testnet' | 'mainnet') => {
    setCurrentNetwork(network);
  };

  return (
    <WagmiProviderWrapper>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header 
            currentNetwork={currentNetwork}
            nodeRunning={nodeRunning}
            onNetworkChange={handleNetworkChange}
          />
          <main className="container mx-auto px-4 py-8">
            {!isConnected ? (
              <div className="text-center py-20">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Conflux DevKit
                </h1>
                <p className="text-gray-600 mb-8">
                  Connect your wallet to access the DevKit dashboard
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  Use ConnectKit to connect your wallet and authenticate with the DevKit backend
                </div>
              </div>
            ) : (
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <Dashboard 
                      currentNetwork={currentNetwork}
                      onNodeStatusChange={setNodeRunning}
                    />
                  } 
                />
                <Route 
                  path="/accounts" 
                  element={<Accounts currentNetwork={currentNetwork} />} 
                />
                <Route 
                  path="/contracts" 
                  element={<Contracts currentNetwork={currentNetwork} />} 
                />
              </Routes>
            )}
          </main>
        </div>
        <ToastContainer />
      </Router>
    </WagmiProviderWrapper>
  );
}

export default App;