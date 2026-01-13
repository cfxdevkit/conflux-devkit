import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'session-keys/index': 'src/session-keys/index.ts',
    'batching/index': 'src/batching/index.ts',
    'embedded/index': 'src/embedded/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: ['@conflux-devkit/core', 'viem'],
});
