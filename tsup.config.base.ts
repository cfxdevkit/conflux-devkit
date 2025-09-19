import { defineConfig } from 'tsup';

export const createBaseConfig = (options: {
  entry?: string[];
  external?: string[];
  platform?: 'browser' | 'node';
  additionalOptions?: any;
} = {}) => {
  const {
    entry = ['src/index.ts'],
    external = [],
    platform = 'node',
    additionalOptions = {}
  } = options;

  const baseConfig = {
    entry,
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external,
    esbuildOptions(esbuildOptions: any) {
      esbuildOptions.jsx = 'automatic';
      if (platform === 'browser') {
        esbuildOptions.platform = 'browser';
        esbuildOptions.define = {
          'process.env.NODE_ENV': '"production"',
          ...esbuildOptions.define,
        };
      }

      // Call additional esbuild options if provided
      if (additionalOptions.esbuildOptions) {
        additionalOptions.esbuildOptions(esbuildOptions);
      }
    },
  };

  return defineConfig({
    ...baseConfig,
    ...additionalOptions,
    esbuildOptions: baseConfig.esbuildOptions,
  });
};

// Default config for most packages
export default createBaseConfig();