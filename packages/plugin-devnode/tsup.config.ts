import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    plugin: 'src/plugin.ts',
    types: 'src/types.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: [
    '@xcfx/node',
    '@conflux-devkit/core',
    'cive',
    'viem',
    'bip32',
    'bip39',
    'tiny-secp256k1',
  ],
});
