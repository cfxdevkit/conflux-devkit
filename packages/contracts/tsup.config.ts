import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'deployer/index': 'src/deployer/index.ts',
    'interaction/index': 'src/interaction/index.ts',
    'abis/index': 'src/abis/index.ts',
    'compiler/index': 'src/compiler/index.ts',
    'templates/index': 'src/templates/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: ['@conflux-devkit/core', 'viem', 'cive', 'solc'],
});
