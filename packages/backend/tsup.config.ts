import { defineConfig } from 'tsup';

const commonConfig = {
  format: ['esm'] as const,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18' as const,
  external: [
    'sqlite3',
    'tiny-secp256k1',
    '@xcfx/node',
    'cive',
    'viem',
    'bip32',
    'bip39',
  ],
  platform: 'node' as const,
};

export default defineConfig([
  // Main library build (with type declarations)
  {
    ...commonConfig,
    entry: { index: 'src/index.ts' },
    dts: true,
  },
  // CLI binary build (with shebang, no type declarations needed)
  {
    ...commonConfig,
    entry: { bin: 'src/bin.ts' },
    dts: false,
    clean: false, // Don't clean dist again
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
