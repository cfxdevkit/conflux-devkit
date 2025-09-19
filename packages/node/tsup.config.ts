import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'clients/index': 'src/clients/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: [
    '@xcfx/node',
    'cive',
    'viem',
    'bip32',
    'bip39',
    'tiny-secp256k1',
    'chalk',
    'commander',
    'ora',
  ],
});
