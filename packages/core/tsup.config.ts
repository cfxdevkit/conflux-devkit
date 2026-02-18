import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'clients/index': 'src/clients/index.ts',
    'types/index': 'src/types/index.ts',
    'config/index': 'src/config/index.ts',
    'utils/index': 'src/utils/index.ts',
    'wallet/index': 'src/wallet/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: [
    'cive',
    'viem',
  ],
});
