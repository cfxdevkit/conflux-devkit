// Wagmi configuration template for Conflux DevKit

import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';

// Export configuration with explicit typing to avoid inference issues
const wagmiConfig = defineConfig({
  out: 'src/generated/contracts.ts',
  contracts: [
    // EVM contracts will be added here automatically
    // Example:
    // {
    //   name: 'MyContract',
    //   address: '0x...',
    //   abi: [...],
    //   chainId: 1030, // Conflux eSpace mainnet
    // },
  ],
  plugins: [react()],
});

export default wagmiConfig;
