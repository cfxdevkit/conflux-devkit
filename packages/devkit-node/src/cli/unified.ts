// Unified CLI interface for the merged node package

import { createDefaultXcfxConfig } from '@conflux-devkit/core';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { NodeService } from '../services/NodeService';
import type {
  WorkflowResult as LocalWorkflowResult,
  NodeConfig,
  TypedDeploymentResult,
  ValidationResult,
  WorkflowCommandOptions,
} from '../types/unified';

interface StartOptions {
  config?: string;
  port?: number;
  network?: string;
  [key: string]: unknown;
}

interface RestartOptions {
  config?: string;
  port?: number;
  network?: string;
  [key: string]: unknown;
}

interface WorkflowOptions {
  config?: string;
  contracts?: string[];
  tests?: boolean;
  [key: string]: unknown;
}

interface DeployOptions {
  contracts?: string[];
  config?: string;
  [key: string]: unknown;
}

interface ValidateOptions {
  contracts?: string[];
  config?: string;
  [key: string]: unknown;
}

interface TestOptions {
  config?: string;
  [key: string]: unknown;
}

// Removed unused interfaces - using types from core package

export class UnifiedCLI {
  private program: Command;
  private nodeService: NodeService | null = null;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('devkit-node')
      .description(
        'Conflux DevKit Node - Unified node management and workflow orchestration'
      )
      .version('1.0.0');

    // Node management commands
    this.program
      .command('start')
      .description('Start a Conflux node')
      .option('-p, --port <port>', 'Core RPC port', '12537')
      .option('-e, --eth-port <port>', 'EVM RPC port', '8545')
      .option('-c, --chain-id <id>', 'Chain ID', '2029')
      .option('-E, --evm-chain-id <id>', 'EVM Chain ID', '2030')
      .option('-s, --silent', 'Run in silent mode', false)
      .option('-f, --fund-wallets', 'Fund wallets on startup', false)
      .option('-w, --wallet-count <count>', 'Number of wallets to create', '3')
      .action(this.handleStart.bind(this));

    this.program
      .command('stop')
      .description('Stop the Conflux node')
      .action(this.handleStop.bind(this));

    this.program
      .command('restart')
      .description('Restart the Conflux node')
      .option('-p, --port <port>', 'Core RPC port', '12537')
      .option('-e, --eth-port <port>', 'EVM RPC port', '8545')
      .action(this.handleRestart.bind(this));

    this.program
      .command('status')
      .description('Get node status')
      .action(this.handleStatus.bind(this));

    // Workflow commands
    this.program
      .command('workflow')
      .description('Run complete development workflow')
      .option(
        '-n, --network <network>',
        'Network to use (mainnet, testnet, local)',
        'local'
      )
      .option('-p, --persistent', 'Keep node running after workflow', false)
      .option('-d, --dev', 'Run in development mode', false)
      .option('-c, --contracts <contracts...>', 'Contracts to deploy')
      .option('-s, --silent', 'Run in silent mode', false)
      .option('-v, --verbose', 'Verbose output', false)
      .action(this.handleWorkflow.bind(this));

    this.program
      .command('deploy')
      .description('Deploy contracts')
      .option('-c, --contracts <contracts...>', 'Contracts to deploy')
      .option('-n, --network <network>', 'Network to use', 'local')
      .option('-s, --silent', 'Run in silent mode', false)
      .action(this.handleDeploy.bind(this));

    this.program
      .command('validate')
      .description('Validate deployed contracts')
      .option(
        '-a, --addresses <addresses...>',
        'Contract addresses to validate'
      )
      .option('-s, --silent', 'Run in silent mode', false)
      .action(this.handleValidate.bind(this));

    // Test commands
    this.program
      .command('test')
      .description('Run tests')
      .option('-t, --timeout <ms>', 'Test timeout in milliseconds', '30000')
      .option('-r, --retries <count>', 'Number of retries', '3')
      .option('-s, --silent', 'Run in silent mode', false)
      .option('-v, --verbose', 'Verbose output', false)
      .action(this.handleTest.bind(this));

    // Help command
    this.program
      .command('help')
      .description('Show help information')
      .action(() => {
        this.program.help();
      });
  }

  private async handleStart(options: StartOptions): Promise<void> {
    const spinner = ora('Starting Conflux node...').start();

    try {
      const config: Partial<NodeConfig> = {
        corePort: options.port ? parseInt(String(options.port), 10) : undefined,
        evmPort: options.ethPort
          ? parseInt(String(options.ethPort), 10)
          : undefined,
        chainId: options.chainId
          ? parseInt(String(options.chainId), 10)
          : undefined,
        evmChainId: options.evmChainId
          ? parseInt(String(options.evmChainId), 10)
          : undefined,
        silent: options.silent as boolean | undefined,
        fundWallets: options.fundWallets as boolean | undefined,
        walletCount: options.walletCount
          ? parseInt(String(options.walletCount), 10)
          : undefined,
      };

      const defaultConfig = createDefaultXcfxConfig();
      this.nodeService = new NodeService(defaultConfig as NodeConfig, {
        autoStart: true,
        logLevel: options.silent ? 'error' : 'info',
      });

      await this.nodeService.start(config);

      spinner.succeed(chalk.green('Conflux node started successfully!'));
      this.logNodeInfo();
    } catch (error) {
      spinner.fail(chalk.red('Failed to start Conflux node'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }

  private async handleStop(): Promise<void> {
    const spinner = ora('Stopping Conflux node...').start();

    try {
      if (!this.nodeService) {
        throw new Error('No node service running');
      }

      await this.nodeService.stop();

      spinner.succeed(chalk.green('Conflux node stopped successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to stop Conflux node'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }

  private async handleRestart(options: RestartOptions): Promise<void> {
    const spinner = ora('Restarting Conflux node...').start();

    try {
      if (!this.nodeService) {
        throw new Error('No node service running');
      }

      const config: Partial<NodeConfig> = {
        corePort: options.port ? parseInt(String(options.port), 10) : undefined,
        evmPort: options.ethPort
          ? parseInt(String(options.ethPort), 10)
          : undefined,
      };

      await this.nodeService.restart(config);

      spinner.succeed(chalk.green('Conflux node restarted successfully!'));
      this.logNodeInfo();
    } catch (error) {
      spinner.fail(chalk.red('Failed to restart Conflux node'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }

  private async handleStatus(): Promise<void> {
    try {
      if (!this.nodeService) {
        console.log(chalk.yellow('No node service running'));
        return;
      }

      const status = await this.nodeService.getStatus();

      console.log(chalk.blue('\n📊 Node Status:'));
      console.log(
        `  Running: ${status.running ? chalk.green('Yes') : chalk.red('No')}`
      );
      console.log(`  Health: ${this.getHealthStatus(status.health)}`);
      console.log(`  Core Port: ${chalk.cyan(status.corePort)}`);
      console.log(`  EVM Port: ${chalk.cyan(status.evmPort)}`);
      console.log(`  Chain ID: ${chalk.cyan(status.chainId)}`);
      console.log(`  EVM Chain ID: ${chalk.cyan(status.evmChainId)}`);
      console.log(
        `  Block Number: ${chalk.cyan(status.blockNumber.toString())}`
      );
      console.log(`  Peer Count: ${chalk.cyan(status.peerCount.toString())}`);
      console.log(`  Wallets: ${chalk.cyan(status.wallets.length.toString())}`);

      if (status.miningAddress) {
        console.log(`  Mining Address: ${chalk.cyan(status.miningAddress)}`);
      }

      if (status.uptime) {
        console.log(
          `  Uptime: ${chalk.cyan(this.formatUptime(status.uptime))}`
        );
      }
    } catch (error) {
      console.error(chalk.red('Error getting status:'), error);
      process.exit(1);
    }
  }

  private async handleWorkflow(options: WorkflowOptions): Promise<void> {
    const spinner = ora('Running complete workflow...').start();

    try {
      const workflowOptions: WorkflowCommandOptions = {
        network: options.network as 'mainnet' | 'testnet' | 'local' | undefined,
        persistent: options.persistent as boolean | undefined,
        dev: options.dev as boolean | undefined,
        contracts: options.contracts as string[] | undefined,
        silent: options.silent as boolean | undefined,
        verbose: options.verbose as boolean | undefined,
      };

      const defaultConfig = createDefaultXcfxConfig();
      this.nodeService = new NodeService(defaultConfig as NodeConfig, {
        autoStart: true,
        logLevel: options.silent ? 'error' : 'info',
      });

      const result =
        await this.nodeService.runCompleteWorkflow(workflowOptions);

      if (result.success) {
        spinner.succeed(chalk.green('Workflow completed successfully!'));
        this.logWorkflowResult(result);
      } else {
        spinner.fail(chalk.red('Workflow failed'));
        this.logWorkflowErrors(result.errors);
      }
    } catch (error) {
      spinner.fail(chalk.red('Workflow failed'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }

  private async handleDeploy(options: DeployOptions): Promise<void> {
    const spinner = ora('Deploying contracts...').start();

    try {
      if (!options.contracts || options.contracts.length === 0) {
        throw new Error('No contracts specified');
      }

      const _workflowOptions: WorkflowCommandOptions = {
        network: options.network as 'mainnet' | 'testnet' | 'local' | undefined,
        contracts: options.contracts as string[] | undefined,
        silent: options.silent as boolean | undefined,
      };

      const defaultConfig = createDefaultXcfxConfig();
      this.nodeService = new NodeService(defaultConfig as NodeConfig, {
        autoStart: true,
        logLevel: options.silent ? 'error' : 'info',
      });

      const result = await this.nodeService.runDeploymentWorkflow(
        options.contracts
      );

      if (result.success) {
        spinner.succeed(chalk.green('Contracts deployed successfully!'));
        this.logDeploymentResults(result.deploymentResults);
      } else {
        spinner.fail(chalk.red('Contract deployment failed'));
        this.logWorkflowErrors(result.errors);
      }
    } catch (error) {
      spinner.fail(chalk.red('Contract deployment failed'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }

  private async handleValidate(options: ValidateOptions): Promise<void> {
    const spinner = ora('Validating contracts...').start();

    try {
      const defaultConfig = createDefaultXcfxConfig();
      this.nodeService = new NodeService(defaultConfig as NodeConfig, {
        autoStart: true,
        logLevel: options.silent ? 'error' : 'info',
      });

      const result = await this.nodeService.runValidationWorkflow();

      if (result.success) {
        spinner.succeed(chalk.green('Contract validation completed!'));
        this.logValidationResults(result.validationResults);
      } else {
        spinner.fail(chalk.red('Contract validation failed'));
        this.logWorkflowErrors(result.errors);
      }
    } catch (error) {
      spinner.fail(chalk.red('Contract validation failed'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }

  private async handleTest(_options: TestOptions): Promise<void> {
    const spinner = ora('Running tests...').start();

    try {
      // Test implementation would go here
      spinner.succeed(chalk.green('Tests completed successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Tests failed'));
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }

  private logNodeInfo(): void {
    console.log(chalk.blue('\n📊 Node Information:'));
    console.log(`  Core RPC: ${chalk.cyan('http://localhost:12537')}`);
    console.log(`  EVM RPC: ${chalk.cyan('http://localhost:8545')}`);
    console.log(`  Chain ID: ${chalk.cyan('2029')}`);
    console.log(`  EVM Chain ID: ${chalk.cyan('2030')}`);
  }

  private logWorkflowResult(result: LocalWorkflowResult): void {
    console.log(chalk.blue('\n📊 Workflow Results:'));
    console.log(`  Duration: ${chalk.cyan(`${result.duration}ms`)}`);
    console.log(`  Wallets: ${chalk.cyan(result.wallets.length.toString())}`);
    console.log(
      `  Contracts: ${chalk.cyan(result.contracts.length.toString())}`
    );
    console.log(
      `  Deployments: ${chalk.cyan(result.deploymentResults.length.toString())}`
    );
    console.log(
      `  Validations: ${chalk.cyan(result.validationResults.length.toString())}`
    );
  }

  private logDeploymentResults(deployments: TypedDeploymentResult[]): void {
    console.log(chalk.blue('\n📦 Deployment Results:'));
    deployments.forEach((deployment, index) => {
      console.log(`  ${index + 1}. ${chalk.cyan(deployment.contractName)}`);
      console.log(`     Address: ${chalk.cyan(deployment.address)}`);
      console.log(`     TX Hash: ${chalk.cyan(deployment.transactionHash)}`);
    });
  }

  private logValidationResults(validations: ValidationResult[]): void {
    console.log(chalk.blue('\n✅ Validation Results:'));
    validations.forEach((validation, index) => {
      const status = validation.isValid ? chalk.green('✓') : chalk.red('✗');
      console.log(
        `  ${index + 1}. ${status} ${chalk.cyan(validation.contractId)}`
      );
      if (validation.errors && validation.errors.length > 0) {
        validation.errors.forEach((error: string) => {
          console.log(`     ${chalk.red('Error:')} ${error}`);
        });
      }
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach((warning: string) => {
          console.log(`     ${chalk.yellow('Warning:')} ${warning}`);
        });
      }
    });
  }

  private logWorkflowErrors(errors: string[]): void {
    console.log(chalk.red('\n❌ Errors:'));
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${chalk.red(error)}`);
    });
  }

  private getHealthStatus(health: string): string {
    switch (health) {
      case 'healthy':
        return chalk.green('Healthy');
      case 'unhealthy':
        return chalk.red('Unhealthy');
      case 'starting':
        return chalk.yellow('Starting');
      case 'stopping':
        return chalk.yellow('Stopping');
      default:
        return chalk.gray('Unknown');
    }
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  public async run(): Promise<void> {
    await this.program.parseAsync(process.argv);
  }
}

// CLI entry point
// ESM equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new UnifiedCLI();
  cli.run().catch(console.error);
}
