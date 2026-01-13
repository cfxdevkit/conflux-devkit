import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: [
    '@conflux-devkit/core',
    '@conflux-devkit/plugin-devnode',
    'bip32',
    'bip39',
    'tiny-secp256k1',
  ],
});
