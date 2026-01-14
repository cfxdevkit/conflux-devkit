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

import { getDefaultConfig } from 'connectkit';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// Define Conflux chains
const confluxCore = {
  id: 1029,
  name: 'Conflux Core',
  network: 'conflux-core',
  nativeCurrency: {
    decimals: 18,
    name: 'CFX',
    symbol: 'CFX',
  },
  rpcUrls: {
    default: {
      http: ['https://main.confluxrpc.com'],
    },
    public: {
      http: ['https://main.confluxrpc.com'],
    },
  },
  blockExplorers: {
    default: { name: 'ConfluxScan', url: 'https://confluxscan.io' },
  },
} as const;

const confluxESpace = {
  id: 1030,
  name: 'Conflux eSpace',
  network: 'conflux-espace',
  nativeCurrency: {
    decimals: 18,
    name: 'CFX',
    symbol: 'CFX',
  },
  rpcUrls: {
    default: {
      http: ['https://evm.confluxrpc.com'],
    },
    public: {
      http: ['https://evm.confluxrpc.com'],
    },
  },
  blockExplorers: {
    default: { name: 'ConfluxScan', url: 'https://evmtestnet.confluxscan.io' },
  },
} as const;

const confluxCoreTestnet = {
  id: 1001,
  name: 'Conflux Core Testnet',
  network: 'conflux-core-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CFX',
    symbol: 'CFX',
  },
  rpcUrls: {
    default: {
      http: ['https://test.confluxrpc.com'],
    },
    public: {
      http: ['https://test.confluxrpc.com'],
    },
  },
  blockExplorers: {
    default: { name: 'ConfluxScan', url: 'https://testnet.confluxscan.io' },
  },
} as const;

const confluxESpaceTestnet = {
  id: 71,
  name: 'Conflux eSpace Testnet',
  network: 'conflux-espace-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CFX',
    symbol: 'CFX',
  },
  rpcUrls: {
    default: {
      http: ['https://evmtestnet.confluxrpc.com'],
    },
    public: {
      http: ['https://evmtestnet.confluxrpc.com'],
    },
  },
  blockExplorers: {
    default: { name: 'ConfluxScan', url: 'https://evmtestnet.confluxscan.io' },
  },
} as const;

// Local development chains
const confluxLocalCore = {
  id: 2029,
  name: 'Conflux Local Core',
  network: 'conflux-local-core',
  nativeCurrency: {
    decimals: 18,
    name: 'CFX',
    symbol: 'CFX',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:12537'],
    },
    public: {
      http: ['http://localhost:12537'],
    },
  },
} as const;

const confluxLocalESpace = {
  id: 2030,
  name: 'Conflux Local eSpace',
  network: 'conflux-local-espace',
  nativeCurrency: {
    decimals: 18,
    name: 'CFX',
    symbol: 'CFX',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
} as const;

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [
      confluxLocalCore,
      confluxLocalESpace,
      confluxCore,
      confluxESpace,
      confluxCoreTestnet,
      confluxESpaceTestnet,
      mainnet,
      sepolia,
    ],
    transports: {
      [confluxLocalCore.id]: http(),
      [confluxLocalESpace.id]: http(),
      [confluxCore.id]: http(),
      [confluxESpace.id]: http(),
      [confluxCoreTestnet.id]: http(),
      [confluxESpaceTestnet.id]: http(),
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'conflux-devkit-local',
    appName: 'Conflux DevKit',
    appDescription: 'Development toolkit for Conflux blockchain',
    appUrl: 'https://conflux-devkit.dev',
    appIcon: 'https://conflux-devkit.dev/icon.png',
    // Note: Get a real project ID from https://cloud.walletconnect.com/ for production
  })
);
