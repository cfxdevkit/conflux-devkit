// Wagmi configuration for Conflux DevKit Frontend Core
import { http, createConfig } from 'wagmi';
import { confluxESpace, confluxESpaceTestnet } from 'wagmi/chains';

export const config = createConfig({
  chains: [confluxESpace, confluxESpaceTestnet],
  transports: {
    // Conflux eSpace mainnet - for production
    [confluxESpace.id]: http('https://evm.confluxrpc.com'),
    // Conflux eSpace testnet
    [confluxESpaceTestnet.id]: http('https://evmtestnet.confluxrpc.com'),
  },
});

// WebSocket configuration for real-time features (can be used separately)
export const wsConfig = {
  coreWsUrl: 'ws://localhost:12535',
  evmWsUrl: 'ws://localhost:8546',
};

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}