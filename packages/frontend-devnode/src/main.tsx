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

import { wagmiConfig } from '@/config/wagmi';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import App from './App';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider
      theme={{
        primaryColor: 'blue',
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      }}
    >
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ConnectKitProvider
            options={{
              hideBalance: true,
              hideTooltips: false,
              hideQuestionMarkCTA: true,
              embedGoogleFonts: true,
              disclaimer: undefined,
            }}
            onError={(error) => {
              // Suppress WalletConnect errors in development when no project ID is set
              if (error?.message?.includes('Unauthorized') || error?.message?.includes('invalid key')) {
                console.warn('WalletConnect not configured (expected in development)');
                return;
              }
              console.error('ConnectKit error:', error);
            }}
          >
            <App />
          </ConnectKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>
);

// Targeted WalletConnect error suppression only
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    // Suppress WalletConnect errors and expected 401s during auth flow
    if (
      typeof message === 'string' &&
      (message.includes('core/relayer') ||
        message.includes('code: 3000') ||
        (message.includes('Unauthorized') && message.includes('invalid key')) ||
        message.includes('Failed to fetch status') ||
        message.includes('401'))
    ) {
      return; // Silently ignore
    }
    originalError(...args);
  };
}
