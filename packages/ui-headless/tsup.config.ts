import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'providers/index': 'src/providers/index.ts',
    'components/index': 'src/components/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  external: ['react', 'react-dom', '@conflux-devkit/core'],
  esbuildOptions: (options) => {
    options.jsx = 'automatic';
  },
});
