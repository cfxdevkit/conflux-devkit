import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  external: [
    'sqlite3',
    'tiny-secp256k1',
    '@xcfx/node',
    'cive',
    'viem',
    'bip32',
    'bip39'
  ],
  platform: 'node',
});
