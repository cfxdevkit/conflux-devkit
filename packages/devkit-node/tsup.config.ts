import { createBaseConfig } from '../../tsup.config.base';

export default createBaseConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  external: ['@conflux-devkit/core', '@conflux-devkit/blockchain'],
  platform: 'node',
  additionalOptions: {
    esbuildOptions(options: any) {
      // Ensure proper ESM output
      options.platform = 'node';
      options.target = 'node18';
      options.format = 'esm';
    },
  },
});