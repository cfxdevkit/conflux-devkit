// Wagmi codegen integration for typed contract generation

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ContractCodegenConfig,
  GeneratedContract,
  TypedDeploymentResult,
  WagmiCodegenConfig,
} from '../types/contracts';
import { createContractError } from '../types/errors';

export class WagmiCodegen {
  private config: WagmiCodegenConfig;
  private outputDir: string;

  constructor(outputDir: string = './src/generated') {
    this.outputDir = outputDir;
    this.config = {
      contracts: [],
      out: join(outputDir, 'contracts.ts'),
      watch: false,
      target: 'react',
      plugins: ['@wagmi/cli/plugins/react'],
    };
  }

  /**
   * Add contract for codegen
   */
  addContract(contractConfig: ContractCodegenConfig): void {
    this.config.contracts.push(contractConfig);
  }

  /**
   * Generate typed contract code
   */
  async generateTypes(): Promise<void> {
    try {
      // Ensure output directory exists
      if (!existsSync(this.outputDir)) {
        mkdirSync(this.outputDir, { recursive: true });
      }

      // Generate wagmi config
      const configPath = join(this.outputDir, 'wagmi.config.ts');
      this.generateWagmiConfig(configPath);

      // Run wagmi codegen
      const command = `npx wagmi generate --config ${configPath}`;
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error) {
      throw createContractError('Failed to generate contract types', {
        error: error instanceof Error ? error.message : 'Unknown error',
        outputDir: this.outputDir,
      });
    }
  }

  /**
   * Generate wagmi configuration file
   */
  private generateWagmiConfig(configPath: string): void {
    const configContent = `
import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';

export default defineConfig({
  out: '${this.config.out}',
  contracts: [
    ${this.config.contracts
      .map(
        (contract) => `
    {
      name: '${contract.name}',
      address: '${contract.address}',
      abi: ${JSON.stringify(contract.abi, null, 2)},
      chainId: ${contract.chainId},
    }`
      )
      .join(',')}
  ],
  plugins: [react()],
});
`;

    writeFileSync(configPath, configContent);
  }

  /**
   * Generate contract types for a deployment result
   */
  async generateContractTypes(
    deploymentResult: TypedDeploymentResult,
    networkConfig: { chainId: number; evmChainId?: number }
  ): Promise<GeneratedContract> {
    try {
      // Add contract to codegen config
      const contractConfig: ContractCodegenConfig = {
        name: deploymentResult.contractName,
        address: deploymentResult.address,
        abi: deploymentResult.abi,
        chainId: networkConfig.chainId,
        chainType: deploymentResult.chainType,
        evmChainId: networkConfig.evmChainId,
      };

      this.addContract(contractConfig);

      // Generate types
      await this.generateTypes();

      // Create generated contract object
      const generatedContract: GeneratedContract = {
        address: deploymentResult.address,
        abi: deploymentResult.abi,
        name: deploymentResult.contractName,
        chainType: deploymentResult.chainType,
        networkId: deploymentResult.networkId,
      };

      return generatedContract;
    } catch (error) {
      throw createContractError('Failed to generate contract types', {
        contractName: deploymentResult.contractName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate types for multiple contracts
   */
  async generateMultipleContractTypes(
    contracts: Array<{
      deploymentResult: TypedDeploymentResult;
      networkConfig: { chainId: number; evmChainId?: number };
    }>
  ): Promise<GeneratedContract[]> {
    const generatedContracts: GeneratedContract[] = [];

    for (const { deploymentResult, networkConfig } of contracts) {
      const generatedContract = await this.generateContractTypes(
        deploymentResult,
        networkConfig
      );
      generatedContracts.push(generatedContract);
    }

    return generatedContracts;
  }

  /**
   * Watch for changes and regenerate types
   */
  async watchTypes(): Promise<void> {
    try {
      this.config.watch = true;

      const configPath = join(this.outputDir, 'wagmi.config.ts');
      this.generateWagmiConfig(configPath);

      const command = `npx wagmi generate --config ${configPath} --watch`;
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error) {
      throw createContractError('Failed to watch contract types', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get generated contract types
   */
  getGeneratedTypes(): string | null {
    const typesPath = this.config.out;
    if (!existsSync(typesPath)) {
      return null;
    }

    try {
      return require(typesPath);
    } catch (_error) {
      return null;
    }
  }

  /**
   * Clear generated types
   */
  clearGeneratedTypes(): void {
    const typesPath = this.config.out;
    if (existsSync(typesPath)) {
      require('node:fs').unlinkSync(typesPath);
    }
  }

  /**
   * Update contract configuration
   */
  updateConfig(newConfig: Partial<WagmiCodegenConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): WagmiCodegenConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const wagmiCodegen = new WagmiCodegen();
