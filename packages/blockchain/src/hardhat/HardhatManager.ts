// Hardhat Manager for programmatic contract deployment and management
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import type { ContractInfo, NetworkConfig } from '@conflux-devkit/core';
import { HREDeploymentService } from './HREDeploymentService';
import { DevkitHREDeploymentService } from './DevkitHREDeploymentService';

export interface HardhatDeployment {
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
}

export interface HardhatCompilationResult {
  success: boolean;
  contracts: {
    [contractName: string]: {
      abi: any[];
      bytecode: string;
      sourceName: string;
      contractName: string;
    };
  };
  errors: string[];
  warnings: string[];
}

export interface HardhatDeploymentStatus {
  status: 'idle' | 'compiling' | 'deploying' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  contracts: HardhatDeployment[];
  errors: string[];
  startTime?: Date;
  endTime?: Date;
}

export class HardhatManager {
  private hardhatPath: string;
  private deploymentsPath: string;
  private status: HardhatDeploymentStatus;
  private statusCallbacks: ((status: HardhatDeploymentStatus) => void)[] = [];
  private hreService: HREDeploymentService;
  private devkitHreService: DevkitHREDeploymentService;

  constructor(hardhatPath?: string) {
    this.hardhatPath =
      hardhatPath || path.join(process.cwd(), '../../../contracts');
    this.deploymentsPath = path.join(this.hardhatPath, 'deployments');
    this.hreService = new HREDeploymentService(this.hardhatPath);
    this.devkitHreService = new DevkitHREDeploymentService(this.hardhatPath);
    this.status = {
      status: 'idle',
      progress: 0,
      currentStep: 'Ready',
      contracts: [],
      errors: [],
    };
  }

  // Subscribe to status updates
  onStatusUpdate(callback: (status: HardhatDeploymentStatus) => void) {
    this.statusCallbacks.push(callback);
  }

  // Update status and notify callbacks
  private updateStatus(updates: Partial<HardhatDeploymentStatus>) {
    this.status = { ...this.status, ...updates };
    this.statusCallbacks.forEach(callback => callback(this.status));
  }

  // Check if Hardhat is properly configured
  async checkHardhatSetup(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if hardhat.config.ts exists
      const configPath = path.join(this.hardhatPath, 'hardhat.config.ts');
      if (!(await fs.pathExists(configPath))) {
        errors.push('hardhat.config.ts not found');
      }

      // Check if contracts directory exists
      const contractsDir = path.join(this.hardhatPath, 'contracts');
      if (!(await fs.pathExists(contractsDir))) {
        errors.push('contracts directory not found');
      }

      // Check if package.json exists and has hardhat
      const packageJsonPath = path.join(this.hardhatPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        if (!packageJson.devDependencies?.hardhat) {
          errors.push('Hardhat not found in devDependencies');
        }
      } else {
        errors.push('package.json not found');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Setup check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  // Compile contracts using Hardhat
  async compileContracts(): Promise<HardhatCompilationResult> {
    this.updateStatus({
      status: 'compiling',
      progress: 0,
      currentStep: 'Compiling contracts...',
      errors: [],
    });

    return new Promise(resolve => {
      const process = spawn('npx', ['hardhat', 'compile'], {
        cwd: this.hardhatPath,
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', data => {
        output += data.toString();
        console.log('Hardhat compile output:', data.toString());
      });

      process.stderr?.on('data', data => {
        errorOutput += data.toString();
        console.error('Hardhat compile error:', data.toString());
      });

      process.on('close', code => {
        if (code === 0) {
          this.updateStatus({
            status: 'idle',
            progress: 100,
            currentStep: 'Compilation completed',
          });

          // Try to read compiled contracts
          this.loadCompiledContracts()
            .then(contracts => {
              resolve({
                success: true,
                contracts,
                errors: [],
                warnings: [],
              });
            })
            .catch(error => {
              resolve({
                success: false,
                contracts: {},
                errors: [`Failed to load compiled contracts: ${error.message}`],
                warnings: [],
              });
            });
        } else {
          this.updateStatus({
            status: 'error',
            currentStep: 'Compilation failed',
            errors: [errorOutput || 'Compilation failed with unknown error'],
          });

          resolve({
            success: false,
            contracts: {},
            errors: [errorOutput || 'Compilation failed'],
            warnings: [],
          });
        }
      });
    });
  }

  // Load compiled contracts from artifacts
  private async loadCompiledContracts(): Promise<{
    [contractName: string]: any;
  }> {
    const artifactsPath = path.join(this.hardhatPath, 'artifacts');
    const contracts: { [contractName: string]: any } = {};

    try {
      if (await fs.pathExists(artifactsPath)) {
        const contractDirs = await fs.readdir(artifactsPath);

        for (const contractDir of contractDirs) {
          if (contractDir.startsWith('contracts')) {
            const contractPath = path.join(artifactsPath, contractDir);
            const files = await fs.readdir(contractPath, { recursive: true });

            for (const file of files) {
              const fileName = file.toString();
              if (fileName.endsWith('.json') && !fileName.includes('dbg')) {
                const filePath = path.join(contractPath, fileName);
                const artifact = await fs.readJson(filePath);

                if (artifact.abi && artifact.bytecode) {
                  const contractName =
                    artifact.contractName || path.basename(fileName, '.json');
                  contracts[contractName] = {
                    abi: artifact.abi,
                    bytecode: artifact.bytecode,
                    sourceName: artifact.sourceName,
                    contractName: artifact.contractName,
                  };
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading compiled contracts:', error);
    }

    return contracts;
  }

  // Deploy contracts using Hardhat Ignition
  async deployContracts(
    contractNames: string[],
    network: string = 'confluxESpaceLocal',
    constructorArgs: { [contractName: string]: any[] } = {}
  ): Promise<HardhatDeployment[]> {
    this.updateStatus({
      status: 'deploying',
      progress: 0,
      currentStep: 'Starting deployment...',
      startTime: new Date(),
      errors: [],
    });

    const deployments: HardhatDeployment[] = [];

    try {
      // First compile contracts
      const compilation = await this.compileContracts();
      if (!compilation.success) {
        throw new Error(`Compilation failed: ${compilation.errors.join(', ')}`);
      }

      // Deploy each contract using Ignition
      for (let i = 0; i < contractNames.length; i++) {
        const contractName = contractNames[i];
        const progress = Math.round((i / contractNames.length) * 100);

        this.updateStatus({
          progress,
          currentStep: `Deploying ${contractName}...`,
        });

        try {
          // Try Devkit HRE service first, fallback to script-based approach
          let hreResult;
          try {
            const isHardhatAvailable =
              await this.devkitHreService.isHardhatAvailable();
            if (isHardhatAvailable) {
              console.log(`📦 Using Devkit HRE service for ${contractName}`);
              hreResult = await this.devkitHreService.deployContract(
                contractName,
                network,
                constructorArgs[contractName] || [],
                compilation.contracts[contractName]
              );
            } else {
              throw new Error(
                'Hardhat not available, falling back to script approach'
              );
            }
          } catch (error) {
            console.log(
              `📦 Falling back to script-based HRE service for ${contractName}`
            );
            hreResult = await this.hreService.deployContract(
              contractName,
              network,
              constructorArgs[contractName] || [],
              compilation.contracts[contractName]
            );
          }

          // Convert HREDeploymentResult to HardhatDeployment
          const deployment: HardhatDeployment = {
            contractName: hreResult.contractName,
            address: hreResult.address,
            transactionHash: hreResult.transactionHash,
            gasUsed: hreResult.gasUsed,
            deployedAt: hreResult.deployedAt,
            network: hreResult.network,
            abi: hreResult.abi,
            bytecode: hreResult.bytecode,
            constructorArgs: hreResult.constructorArgs,
            verified: hreResult.verified,
          };

          deployments.push(deployment);

          // Update contracts list
          this.updateStatus({
            contracts: [...this.status.contracts, deployment],
          });
        } catch (error) {
          const errorMsg = `Failed to deploy ${contractName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          this.updateStatus({
            errors: [...this.status.errors, errorMsg],
          });
          console.error(errorMsg);
        }
      }

      this.updateStatus({
        status: 'completed',
        progress: 100,
        currentStep: `Deployed ${deployments.length} contracts successfully`,
        endTime: new Date(),
      });

      return deployments;
    } catch (error) {
      this.updateStatus({
        status: 'error',
        currentStep: 'Deployment failed',
        errors: [
          ...this.status.errors,
          error instanceof Error ? error.message : 'Unknown error',
        ],
        endTime: new Date(),
      });
      throw error;
    }
  }

  // Deploy a single contract using Hardhat Ignition
  private async deployWithIgnition(
    contractName: string,
    network: string,
    constructorArgs: any[],
    contractInfo: any
  ): Promise<HardhatDeployment> {
    return new Promise((resolve, reject) => {
      // Map contract names to their Ignition modules
      const moduleMap: { [key: string]: string } = {
        Counter: 'ignition/modules/Counter.ts',
        DelegationManager: 'ignition/modules/DelegationManager.ts',
      };

      const modulePath = moduleMap[contractName];
      if (!modulePath) {
        reject(
          new Error(`No Ignition module found for contract: ${contractName}`)
        );
        return;
      }

      // Determine if we're in development mode
      const isDevelopment: boolean =
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'dev' ||
        !process.env.NODE_ENV ||
        network === 'confluxESpaceLocal' ||
        network === 'hardhat';

      // Add --reset parameter for development deployments
      const resetParam: string = isDevelopment ? '--reset' : '';

      const childProcess = spawn(
        'sh',
        [
          '-c',
          `yes | npx hardhat ignition deploy ${modulePath} --network ${network} ${resetParam}`.trim(),
        ],
        {
          cwd: this.hardhatPath,
          stdio: 'pipe',
        }
      );

      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
        console.log(`Deploy ${contractName} output:`, data.toString());
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
        console.error(`Deploy ${contractName} error:`, data.toString());
      });

      childProcess.on('close', (code: number | null) => {
        if (code === 0) {
          try {
            // Parse deployment result from Ignition output
            const lines = output.split('\n');
            const addressLine = lines.find(line =>
              line.includes('Deployed Addresses')
            );
            const contractLine = lines.find(line =>
              line.includes(`${contractName}Module#${contractName}`)
            );

            if (contractLine) {
              // Extract address from the line like "CounterModule#Counter - 0x..."
              const addressMatch = contractLine.match(/0x[a-fA-F0-9]{40}/);
              const address = addressMatch ? addressMatch[0] : '';

              // For now, create a mock deployment result since Ignition doesn't provide detailed info
              // In a real implementation, you'd parse the journal file for transaction details
              resolve({
                contractName,
                address,
                transactionHash: `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`,
                gasUsed: '80000', // Estimated gas usage
                deployedAt: new Date().toISOString(),
                network,
                abi: contractInfo?.abi || [],
                bytecode: contractInfo?.bytecode || '',
                constructorArgs,
                verified: false,
              });
            } else {
              reject(
                new Error(
                  'Could not parse deployment result from Ignition output'
                )
              );
            }
          } catch (parseError) {
            reject(
              new Error(
                `Failed to parse deployment result: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
              )
            );
          }
        } else {
          reject(
            new Error(`Deployment failed: ${errorOutput || 'Unknown error'}`)
          );
        }
      });
    });
  }

  // Convert HardhatDeployment to ContractInfo
  toContractInfo(deployment: HardhatDeployment): ContractInfo {
    return {
      name: deployment.contractName,
      address: deployment.address as `0x${string}`,
      abi: deployment.abi,
      network: deployment.network,
      deployedAt: new Date(deployment.deployedAt),
    };
  }

  // Get current deployment status
  getStatus(): HardhatDeploymentStatus {
    return { ...this.status };
  }

  // Reset status
  resetStatus() {
    this.updateStatus({
      status: 'idle',
      progress: 0,
      currentStep: 'Ready',
      contracts: [],
      errors: [],
      startTime: undefined,
      endTime: undefined,
    });
  }

  // Load existing deployments
  async loadDeployments(): Promise<HardhatDeployment[]> {
    try {
      const deploymentsFile = path.join(
        this.deploymentsPath,
        'all-deployments.json'
      );
      if (await fs.pathExists(deploymentsFile)) {
        const deployments = await fs.readJson(deploymentsFile);
        this.updateStatus({
          contracts: deployments,
        });
        return deployments;
      }
    } catch (error) {
      console.error('Error loading deployments:', error);
    }
    return [];
  }

  // Save deployments
  async saveDeployments(deployments: HardhatDeployment[]) {
    try {
      await fs.ensureDir(this.deploymentsPath);
      const deploymentsFile = path.join(
        this.deploymentsPath,
        'all-deployments.json'
      );
      await fs.writeJson(deploymentsFile, deployments, { spaces: 2 });
    } catch (error) {
      console.error('Error saving deployments:', error);
    }
  }
}
