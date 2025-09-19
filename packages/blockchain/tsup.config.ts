import { defineConfig } from 'tsup';

export default defineConfig([
  // Server-side build (includes hardhat)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
      '@conflux-devkit/core',
      'child_process',
      'path',
      'fs-extra',
      'hardhat',
    ],
    esbuildOptions(options) {
      options.jsx = 'automatic';
      options.platform = 'node';
      options.define = {
        'process.env.NODE_ENV': '"production"',
      };
    },
  },
  // Browser-compatible build (excludes hardhat)
  {
    entry: ['src/browser.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    outDir: 'dist/browser',
    external: [
      '@conflux-devkit/core',
    ],
    esbuildOptions(options) {
      options.jsx = 'automatic';
      options.platform = 'browser';
      options.define = {
        'process.env.NODE_ENV': '"production"',
      };
    },
  },
]);
