import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [],
  treeshake: true,
  minify: false,
  splitting: false,
  outDir: 'dist',
});
