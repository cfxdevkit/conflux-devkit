import * as path from 'path';
import * as fs from 'fs-extra';

export interface DevkitHREDeploymentResult {
  success: boolean;
  contractName: string;
  address: string;
  transactionHash: string;
  gasUsed: string;
  deployedAt: string;
  network: string;
  abi: any[];
  bytecode: string;
  constructorArgs: any[];
  verified: boolean;
  error?: string;
}

export class DevkitHREDeploymentService {
  private contractsPath: string;

  constructor(contractsPath?: string) {
    // Default to the contracts directory in the workspace root
    this.contractsPath =
      contractsPath || path.join(process.cwd(), '../../../contracts');
  }

  // Deploy using true HRE library approach within devkit
  async deployContract(
    contractName: string,
    network: string = 'confluxESpaceLocal',
    constructorArgs: any[] = [],
    contractInfo: any = {}
  ): Promise<DevkitHREDeploymentResult> {
    try {
      console.log(
        `🚀 Deploying ${contractName} using Devkit HRE library approach to network: ${network}`
      );

      // Determine if we're in development mode
      const isDevelopment =
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'dev' ||
        !process.env.NODE_ENV ||
        network === 'confluxESpaceLocal' ||
        network === 'hardhat';

      console.log(`📦 Using Devkit HRE library deployment for ${contractName}`);
      console.log(`🔧 Network: ${network}, Development: ${isDevelopment}`);

      // Change to contracts directory for proper module resolution
      const originalCwd = process.cwd();
      process.chdir(this.contractsPath);

      try {
        // Directly import and use Hardhat as a library
        const hre = await this.loadHardhatRuntime();

        // Load the specific module
        const module = await this.loadIgnitionModule(contractName);

        if (!module) {
          throw new Error(
            `No Ignition module found for contract: ${contractName}`
          );
        }

        // Get ignition instance
        const ignition = await (hre as any).ignition;
        if (!ignition) {
          throw new Error(
            'Ignition not available. Make sure the plugin is properly loaded.'
          );
        }

        // Deploy with reset option for development
        const deployOptions: any = {
          parameters: {},
        };

        // Add reset option for development deployments
        if (isDevelopment) {
          deployOptions.reset = true;
          console.log('🔄 Using reset option for development deployment');
        }

        console.log(
          `🚀 Deploying ${contractName} with options:`,
          deployOptions
        );

        const result = await ignition.deploy(module, deployOptions);

        // Extract contract information from result
        const contractKey = contractName.toLowerCase();
        const deployedContract = result[contractKey];

        if (!deployedContract) {
          throw new Error(
            `Contract ${contractName} not found in deployment result`
          );
        }

        const address = deployedContract.address;
        console.log(`✅ ${contractName} deployed at: ${address}`);

        return {
          success: true,
          contractName,
          address,
          transactionHash: 'N/A', // Ignition doesn't expose transaction hash directly
          gasUsed: '0', // Ignition doesn't expose gas usage directly
          deployedAt: new Date().toISOString(),
          network,
          abi: contractInfo?.abi || [],
          bytecode: contractInfo?.bytecode || '',
          constructorArgs,
          verified: false,
        };
      } finally {
        // Restore original working directory
        process.chdir(originalCwd);
      }
    } catch (error: any) {
      console.error(
        `❌ Devkit HRE deployment failed for ${contractName}:`,
        error
      );
      return {
        success: false,
        contractName,
        address: '0x0000000000000000000000000000000000000000',
        transactionHash: 'N/A',
        gasUsed: '0',
        deployedAt: new Date().toISOString(),
        network,
        abi: contractInfo?.abi || [],
        bytecode: contractInfo?.bytecode || '',
        constructorArgs,
        verified: false,
        error: error.message || error.toString() || 'Unknown deployment error',
      };
    }
  }

  // Load Hardhat Runtime Environment directly with proper error handling
  private async loadHardhatRuntime(): Promise<any> {
    try {
      // Try to import hardhat from the contracts directory
      const hardhatPath = path.join(
        this.contractsPath,
        'node_modules',
        'hardhat'
      );

      // Check if hardhat is available in the contracts directory
      if (!(await fs.pathExists(hardhatPath))) {
        throw new Error('Hardhat not found in contracts directory');
      }

      // Import hardhat directly from the contracts directory
      const hardhat = await import(path.join(hardhatPath, 'index.js'));

      // The HRE is available as the default export
      const hre = hardhat.default;

      // Ensure the HRE is properly initialized
      if (!hre) {
        throw new Error('Hardhat Runtime Environment not available');
      }

      return hre;
    } catch (error) {
      console.error('Failed to load Hardhat Runtime Environment:', error);
      throw new Error('Hardhat Runtime Environment not available');
    }
  }

  // Load Ignition module directly
  private async loadIgnitionModule(contractName: string): Promise<any> {
    try {
      const modulePath = path.join(
        this.contractsPath,
        'ignition',
        'modules',
        `${contractName}.ts`
      );

      // Check if module file exists
      if (!(await fs.pathExists(modulePath))) {
        throw new Error(`Module file not found: ${modulePath}`);
      }

      // Import the module directly
      const module = await import(modulePath);
      return module.default;
    } catch (error) {
      console.error(`Failed to load Ignition module ${contractName}:`, error);
      throw error;
    }
  }

  // Get available modules
  async getModules(): Promise<Array<{ name: string; module: any }>> {
    try {
      const modulesDir = path.join(this.contractsPath, 'ignition', 'modules');
      const files = await fs.readdir(modulesDir);

      const modules: Array<{ name: string; module: any }> = [];

      for (const file of files) {
        if (file.endsWith('.ts')) {
          const moduleName = file.replace('.ts', '');
          try {
            const modulePath = path.join(modulesDir, file);
            const module = await import(modulePath);
            modules.push({
              name: moduleName,
              module: module.default,
            });
          } catch (error) {
            console.warn(`Failed to load module ${moduleName}:`, error);
          }
        }
      }

      return modules;
    } catch (error) {
      console.error('Error getting HRE modules:', error);
      throw error;
    }
  }

  // Check if Hardhat is available in the contracts directory
  async isHardhatAvailable(): Promise<boolean> {
    try {
      const hardhatConfigPath = path.join(
        this.contractsPath,
        'hardhat.config.ts'
      );
      const packageJsonPath = path.join(this.contractsPath, 'package.json');
      const hardhatPath = path.join(
        this.contractsPath,
        'node_modules',
        'hardhat'
      );

      const configExists = await fs.pathExists(hardhatConfigPath);
      const packageExists = await fs.pathExists(packageJsonPath);
      const hardhatExists = await fs.pathExists(hardhatPath);

      if (!configExists || !packageExists || !hardhatExists) {
        return false;
      }

      // Try to load hardhat to see if it's available
      await this.loadHardhatRuntime();
      return true;
    } catch (error) {
      console.warn('Hardhat not available:', error);
      return false;
    }
  }
}
