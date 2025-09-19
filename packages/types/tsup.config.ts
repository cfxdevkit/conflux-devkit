import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@conflux-devkit/core'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.platform = 'browser';
    options.define = {
      'process.env.NODE_ENV': '"production"',
    };
  },
});
