# Phase 3: CLI Implementation - Detailed Plan

**Binary Name:** `cfx-devkit`
**Package:** `@conflux-devkit/backend` (CLI embedded in backend package)
**Estimated Time:** 4-5 days

## Overview

The CLI provides a terminal-based interface to the DevKit, allowing developers to:
1. Start/stop the local development node
2. Run in web mode (backend + frontend)
3. Manage wallets and view account information
4. Run the initial setup wizard
5. Manage admin addresses

The CLI shares the same services and logic as the web UI - both consume the same backend services.

---

## CLI Commands Structure

```bash
# Main entry point
cfx-devkit [command] [options]

# Core Commands
cfx-devkit start          # Start the local development node (foreground)
cfx-devkit stop           # Stop the running node (via API if server running)
cfx-devkit web            # Start web mode (backend API + frontend dev server)
cfx-devkit setup          # Run interactive setup wizard

# Wallet Commands
cfx-devkit wallets                    # List all wallets with active indicator
cfx-devkit wallets list               # Alias for above
cfx-devkit wallets add [--generate|--import] [--label <name>]
cfx-devkit wallets switch <id>        # Switch active wallet
cfx-devkit wallets delete <id>        # Delete a wallet

# Account Commands
cfx-devkit accounts                   # List accounts from active wallet
cfx-devkit accounts <index>           # Show details for specific account
cfx-devkit accounts faucet            # Show faucet/mining account info

# Admin Commands
cfx-devkit admin list                 # List admin addresses
cfx-devkit admin add <address>        # Add admin address
cfx-devkit admin remove <address>     # Remove admin address

# Status Commands
cfx-devkit status                     # Show node status, wallet info, etc.
cfx-devkit info                       # Alias for status

# Utility Commands
cfx-devkit reset                      # Reset all data (keystore + blockchain)
cfx-devkit reset --config             # Reset only keystore
cfx-devkit reset --data               # Reset only blockchain data
cfx-devkit version                    # Show version information
cfx-devkit help [command]             # Show help
```

---

## Architecture

### Mode 1: Direct Mode (Node Control)
```
┌─────────────────┐
│   cfx-devkit    │
│   start/stop    │
└────────┬────────┘
         │
┌────────▼────────┐
│  KeystoreService │  ← Direct service access (no HTTP)
│  DevKitCompat    │
│  ServerManager   │
└─────────────────┘
```

Commands like `start`, `wallets`, `accounts` work directly with services without needing the backend server running.

### Mode 2: Web Mode (Full Stack)
```
┌─────────────────┐     ┌─────────────────┐
│   cfx-devkit    │     │    Frontend     │
│      web        │     │   (Vite dev)    │
└────────┬────────┘     └────────┬────────┘
         │                       │
┌────────▼───────────────────────▼────────┐
│           BackendServer                  │
│    (Express + WebSocket + DevKit)       │
└─────────────────────────────────────────┘
```

`cfx-devkit web` starts the full backend server (REST + WebSocket) and optionally spawns the Vite dev server for the frontend.

---

## File Structure

```
packages/backend/src/
├── cli/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/
│   │   ├── start.ts          # Start node command
│   │   ├── stop.ts           # Stop node command
│   │   ├── web.ts            # Start web mode
│   │   ├── setup.ts          # Interactive setup wizard
│   │   ├── wallets.ts        # Wallet management commands
│   │   ├── accounts.ts       # Account listing commands
│   │   ├── admin.ts          # Admin management commands
│   │   ├── status.ts         # Status/info command
│   │   └── reset.ts          # Reset commands
│   ├── utils/
│   │   ├── logger.ts         # CLI-specific logger (chalk + ora)
│   │   ├── prompts.ts        # Inquirer prompts helpers
│   │   └── display.ts        # Table/card display helpers
│   └── types.ts              # CLI-specific types
├── index.ts                  # Library exports (unchanged)
└── bin.ts                    # CLI binary entry point (NEW)
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "commander": "^12.1.0",       // CLI framework
    "inquirer": "^10.1.0",        // Interactive prompts
    "chalk": "^5.4.0",            // Colored terminal output
    "ora": "^8.2.0",              // Spinners for async operations
    "cli-table3": "^0.6.5"        // Table formatting
  }
}
```

---

## Implementation Details

### 1. CLI Entry Point (`bin.ts`)

```typescript
#!/usr/bin/env node
import { program } from 'commander';
import { registerCommands } from './cli/index.js';

// Load env before anything else
import 'dotenv/config';

const pkg = await import('../package.json', { assert: { type: 'json' } });

program
  .name('cfx-devkit')
  .description('Conflux Development Kit - Local blockchain for development')
  .version(pkg.default.version);

// Register all commands
registerCommands(program);

program.parse();
```

### 2. Start Command (`commands/start.ts`)

```typescript
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { getKeystoreService } from '../../services/keystore-service.js';
import { DevKitCompat } from '../../devkit-compat.js';

export function registerStartCommand(program: Command) {
  program
    .command('start')
    .description('Start the local development node')
    .option('-m, --mining', 'Enable auto-mining (default: true)', true)
    .option('-i, --interval <ms>', 'Mining interval in milliseconds', '500')
    .option('--no-mining', 'Disable auto-mining')
    .action(async (options) => {
      const spinner = ora('Starting Conflux DevKit node...').start();

      try {
        // Initialize keystore
        const keystore = getKeystoreService();
        await keystore.initialize();

        // Check setup
        if (!(await keystore.isSetupCompleted())) {
          spinner.fail('Setup not completed');
          console.log(chalk.yellow('\nRun setup wizard first:'));
          console.log(chalk.cyan('  cfx-devkit setup'));
          process.exit(1);
        }

        // Get active mnemonic config
        const mnemonic = await keystore.getActiveMnemonic();
        const decrypted = await keystore.getDecryptedMnemonic(mnemonic.id);
        const dataDir = await keystore.getDataDir();

        // Create DevKit instance
        const devkit = new DevKitCompat({
          chainId: mnemonic.nodeConfig.chainId,
          evmChainId: mnemonic.nodeConfig.evmChainId,
          jsonrpcHttpPort: 12537,
          jsonrpcHttpEthPort: 8545,
          log: false,
          mnemonic: decrypted,
          dataDir,
          accountsCount: mnemonic.nodeConfig.accountsCount,
        });

        // Start node
        await devkit.start();
        spinner.succeed('Node started successfully');

        // Display info
        console.log('\n' + chalk.green('═'.repeat(50)));
        console.log(chalk.bold('  Conflux DevKit Node Running'));
        console.log(chalk.green('═'.repeat(50)));
        console.log(`  Wallet:     ${chalk.cyan(mnemonic.label)}`);
        console.log(`  Core RPC:   ${chalk.cyan('http://localhost:12537')}`);
        console.log(`  eSpace RPC: ${chalk.cyan('http://localhost:8545')}`);
        console.log(`  Chain IDs:  ${chalk.cyan(`Core: ${mnemonic.nodeConfig.chainId}, eSpace: ${mnemonic.nodeConfig.evmChainId}`)}`);
        console.log(`  Accounts:   ${chalk.cyan(mnemonic.nodeConfig.accountsCount)}`);
        console.log(chalk.green('═'.repeat(50)));
        console.log('\n' + chalk.dim('Press Ctrl+C to stop'));

        // Start mining if enabled
        if (options.mining) {
          await devkit.startMining(parseInt(options.interval, 10));
          console.log(chalk.dim(`Auto-mining enabled (${options.interval}ms interval)`));
        }

        // Keep running until Ctrl+C
        process.on('SIGINT', async () => {
          spinner.start('Stopping node...');
          await devkit.stop();
          spinner.succeed('Node stopped');
          process.exit(0);
        });

        // Keep process alive
        await new Promise(() => {});

      } catch (error) {
        spinner.fail('Failed to start node');
        console.error(chalk.red(error instanceof Error ? error.message : error));
        process.exit(1);
      }
    });
}
```

### 3. Web Command (`commands/web.ts`)

```typescript
import { Command } from 'commander';
import { spawn } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import { BackendServer } from '../../server/BackendServer.js';
import { getKeystoreService } from '../../services/keystore-service.js';

export function registerWebCommand(program: Command) {
  program
    .command('web')
    .description('Start web mode (backend API + optional frontend)')
    .option('-p, --port <port>', 'Backend API port', '3001')
    .option('-w, --ws-port <port>', 'WebSocket port', '3002')
    .option('--no-frontend', 'Skip starting frontend dev server')
    .option('--frontend-port <port>', 'Frontend dev server port', '5173')
    .action(async (options) => {
      const spinner = ora('Starting Conflux DevKit web mode...').start();

      try {
        // Initialize keystore
        const keystore = getKeystoreService();
        await keystore.initialize();

        let devkitConfig: any = {
          chainId: 2029,
          evmChainId: 2030,
          jsonrpcHttpPort: 12537,
          jsonrpcHttpEthPort: 8545,
          log: false,
        };

        // If setup completed, load active wallet config
        if (await keystore.isSetupCompleted()) {
          const mnemonic = await keystore.getActiveMnemonic();
          const decrypted = await keystore.getDecryptedMnemonic(mnemonic.id);
          const dataDir = await keystore.getDataDir();

          devkitConfig = {
            ...devkitConfig,
            chainId: mnemonic.nodeConfig.chainId,
            evmChainId: mnemonic.nodeConfig.evmChainId,
            mnemonic: decrypted,
            dataDir,
          };
        }

        // Start backend server
        const server = new BackendServer({
          port: parseInt(options.port, 10),
          wsPort: parseInt(options.wsPort, 10),
          devkitConfig,
        });

        await server.start();
        spinner.succeed('Backend server started');

        // Start frontend if enabled
        let frontendProcess: any = null;
        if (options.frontend) {
          spinner.start('Starting frontend dev server...');

          frontendProcess = spawn('pnpm', ['dev:frontend'], {
            cwd: process.cwd(),
            stdio: 'pipe',
            shell: true,
          });

          // Wait for frontend to be ready
          await new Promise((resolve) => setTimeout(resolve, 3000));
          spinner.succeed('Frontend dev server started');
        }

        // Display info
        console.log('\n' + chalk.green('═'.repeat(50)));
        console.log(chalk.bold('  Conflux DevKit Web Mode'));
        console.log(chalk.green('═'.repeat(50)));
        console.log(`  Backend API:  ${chalk.cyan(`http://localhost:${options.port}`)}`);
        console.log(`  WebSocket:    ${chalk.cyan(`ws://localhost:${options.wsPort}`)}`);
        if (options.frontend) {
          console.log(`  Frontend:     ${chalk.cyan(`http://localhost:${options.frontendPort}`)}`);
        }
        console.log(chalk.green('═'.repeat(50)));
        console.log('\n' + chalk.dim('Press Ctrl+C to stop all services'));

        // Graceful shutdown
        process.on('SIGINT', async () => {
          spinner.start('Stopping services...');
          if (frontendProcess) {
            frontendProcess.kill('SIGINT');
          }
          await server.stop();
          spinner.succeed('All services stopped');
          process.exit(0);
        });

      } catch (error) {
        spinner.fail('Failed to start web mode');
        console.error(chalk.red(error instanceof Error ? error.message : error));
        process.exit(1);
      }
    });
}
```

### 4. Setup Command (`commands/setup.ts`)

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { getKeystoreService } from '../../services/keystore-service.js';

export function registerSetupCommand(program: Command) {
  program
    .command('setup')
    .description('Run interactive setup wizard')
    .action(async () => {
      console.log('\n' + chalk.bold.cyan('═══ Conflux DevKit Setup Wizard ═══\n'));

      const keystore = getKeystoreService();
      await keystore.initialize();

      // Check if already setup
      if (await keystore.isSetupCompleted()) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Setup already completed. Do you want to reset and start over?',
          default: false,
        }]);

        if (!confirm) {
          console.log(chalk.yellow('Setup cancelled.'));
          return;
        }

        // Reset keystore
        // ... reset logic
      }

      // Step 1: Admin Address
      console.log(chalk.bold('\n📋 Step 1: Admin Address\n'));
      const { adminAddress } = await inquirer.prompt([{
        type: 'input',
        name: 'adminAddress',
        message: 'Enter your admin wallet address (0x...):',
        validate: (input) => {
          if (!/^0x[a-fA-F0-9]{40}$/.test(input)) {
            return 'Invalid Ethereum address format';
          }
          return true;
        },
      }]);

      // Step 2: Wallet Setup
      console.log(chalk.bold('\n🔐 Step 2: Wallet Setup\n'));
      const { walletMethod } = await inquirer.prompt([{
        type: 'list',
        name: 'walletMethod',
        message: 'How would you like to set up your development wallet?',
        choices: [
          { name: 'Generate new mnemonic (recommended)', value: 'generate' },
          { name: 'Import existing mnemonic', value: 'import' },
        ],
      }]);

      let mnemonic: string;
      if (walletMethod === 'generate') {
        mnemonic = generateMnemonic();
        console.log(chalk.yellow('\n⚠️  Save this mnemonic securely (development only):\n'));
        console.log(chalk.cyan(`  ${mnemonic}\n`));
      } else {
        const { inputMnemonic } = await inquirer.prompt([{
          type: 'password',
          name: 'inputMnemonic',
          message: 'Enter your mnemonic phrase:',
          mask: '*',
          validate: (input) => {
            if (!validateMnemonic(input.trim())) {
              return 'Invalid mnemonic phrase';
            }
            return true;
          },
        }]);
        mnemonic = inputMnemonic.trim();
      }

      // Step 3: Wallet Label
      const { walletLabel } = await inquirer.prompt([{
        type: 'input',
        name: 'walletLabel',
        message: 'Enter a label for this wallet:',
        default: 'Development',
      }]);

      // Step 4: Encryption (optional)
      console.log(chalk.bold('\n🔒 Step 3: Security (Optional)\n'));
      const { enableEncryption } = await inquirer.prompt([{
        type: 'confirm',
        name: 'enableEncryption',
        message: 'Enable password encryption for your keystore?',
        default: false,
      }]);

      let password: string | undefined;
      if (enableEncryption) {
        const { pwd, confirmPwd } = await inquirer.prompt([
          {
            type: 'password',
            name: 'pwd',
            message: 'Enter encryption password (min 8 chars):',
            mask: '*',
            validate: (input) => input.length >= 8 || 'Password must be at least 8 characters',
          },
          {
            type: 'password',
            name: 'confirmPwd',
            message: 'Confirm password:',
            mask: '*',
          },
        ]);

        if (pwd !== confirmPwd) {
          console.log(chalk.red('Passwords do not match. Please try again.'));
          process.exit(1);
        }
        password = pwd;
      }

      // Step 5: Node Configuration
      console.log(chalk.bold('\n⚙️  Step 4: Node Configuration\n'));
      const { accountsCount, chainId, evmChainId } = await inquirer.prompt([
        {
          type: 'number',
          name: 'accountsCount',
          message: 'Number of genesis accounts:',
          default: 10,
          validate: (input) => (input >= 1 && input <= 20) || 'Must be between 1 and 20',
        },
        {
          type: 'number',
          name: 'chainId',
          message: 'Core Space Chain ID:',
          default: 2029,
        },
        {
          type: 'number',
          name: 'evmChainId',
          message: 'eSpace Chain ID:',
          default: 2030,
        },
      ]);

      // Complete setup
      const spinner = ora('Completing setup...').start();

      try {
        await keystore.completeSetup({
          adminAddress,
          mnemonic,
          walletLabel,
          password,
          nodeConfig: {
            accountsCount,
            chainId,
            evmChainId,
            miningAuthor: 'auto',
          },
        });

        spinner.succeed('Setup completed successfully!');

        console.log('\n' + chalk.green('═'.repeat(50)));
        console.log(chalk.bold('  Setup Complete!'));
        console.log(chalk.green('═'.repeat(50)));
        console.log(`  Admin:     ${chalk.cyan(adminAddress)}`);
        console.log(`  Wallet:    ${chalk.cyan(walletLabel)}`);
        console.log(`  Accounts:  ${chalk.cyan(accountsCount)}`);
        console.log(`  Chain IDs: ${chalk.cyan(`Core: ${chainId}, eSpace: ${evmChainId}`)}`);
        console.log(`  Encrypted: ${chalk.cyan(enableEncryption ? 'Yes' : 'No')}`);
        console.log(chalk.green('═'.repeat(50)));
        console.log('\n' + chalk.dim('Start the node with: cfx-devkit start'));
        console.log(chalk.dim('Or start web mode with: cfx-devkit web\n'));

      } catch (error) {
        spinner.fail('Setup failed');
        console.error(chalk.red(error instanceof Error ? error.message : error));
        process.exit(1);
      }
    });
}
```

### 5. Wallets Command (`commands/wallets.ts`)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { getKeystoreService } from '../../services/keystore-service.js';

export function registerWalletsCommand(program: Command) {
  const wallets = program
    .command('wallets')
    .description('Manage wallets');

  // List wallets (default action)
  wallets
    .command('list', { isDefault: true })
    .description('List all wallets')
    .action(async () => {
      const keystore = getKeystoreService();
      await keystore.initialize();

      if (!(await keystore.isSetupCompleted())) {
        console.log(chalk.yellow('Setup not completed. Run: cfx-devkit setup'));
        return;
      }

      const mnemonics = await keystore.listMnemonics();

      const table = new Table({
        head: [
          chalk.cyan('Active'),
          chalk.cyan('ID'),
          chalk.cyan('Label'),
          chalk.cyan('Type'),
          chalk.cyan('Accounts'),
          chalk.cyan('Chain IDs'),
        ],
        style: { head: [], border: [] },
      });

      for (const m of mnemonics) {
        table.push([
          m.isActive ? chalk.green('●') : '',
          m.id.slice(0, 8) + '...',
          m.label,
          m.type,
          m.nodeConfig.accountsCount.toString(),
          `${m.nodeConfig.chainId}/${m.nodeConfig.evmChainId}`,
        ]);
      }

      console.log('\n' + chalk.bold('Wallets:'));
      console.log(table.toString());
    });

  // Add wallet
  wallets
    .command('add')
    .description('Add a new wallet')
    .option('-g, --generate', 'Generate new mnemonic')
    .option('-i, --import', 'Import existing mnemonic')
    .option('-l, --label <label>', 'Wallet label')
    .action(async (options) => {
      // Interactive prompts for adding wallet
      // Similar to setup but just for wallet addition
    });

  // Switch wallet
  wallets
    .command('switch <id>')
    .description('Switch active wallet')
    .action(async (id) => {
      const spinner = ora('Switching wallet...').start();

      const keystore = getKeystoreService();
      await keystore.initialize();

      try {
        await keystore.switchActiveMnemonic(id);
        spinner.succeed(`Switched to wallet: ${id}`);
      } catch (error) {
        spinner.fail('Failed to switch wallet');
        console.error(chalk.red(error instanceof Error ? error.message : error));
      }
    });

  // Delete wallet
  wallets
    .command('delete <id>')
    .description('Delete a wallet')
    .option('--force', 'Skip confirmation')
    .action(async (id, options) => {
      // Confirmation and deletion logic
    });
}
```

### 6. Accounts Command (`commands/accounts.ts`)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getKeystoreService } from '../../services/keystore-service.js';

export function registerAccountsCommand(program: Command) {
  program
    .command('accounts [index]')
    .description('List accounts from active wallet')
    .option('--show-private', 'Show private keys (use with caution)')
    .action(async (index, options) => {
      const keystore = getKeystoreService();
      await keystore.initialize();

      if (!(await keystore.isSetupCompleted())) {
        console.log(chalk.yellow('Setup not completed. Run: cfx-devkit setup'));
        return;
      }

      const mnemonic = await keystore.getActiveMnemonic();
      const accounts = await keystore.getDerivedAccounts(mnemonic.id);

      if (index !== undefined) {
        // Show single account details
        const acc = accounts[parseInt(index, 10)];
        if (!acc) {
          console.log(chalk.red(`Account ${index} not found`));
          return;
        }

        console.log('\n' + chalk.bold(`Account #${index}`));
        console.log('─'.repeat(50));
        console.log(`  Core Address:   ${chalk.cyan(acc.coreAddress)}`);
        console.log(`  eSpace Address: ${chalk.cyan(acc.evmAddress)}`);
        if (options.showPrivate) {
          console.log(`  Private Key:    ${chalk.yellow(acc.privateKey)}`);
        }
        console.log();
      } else {
        // List all accounts
        const table = new Table({
          head: [
            chalk.cyan('#'),
            chalk.cyan('Core Address'),
            chalk.cyan('eSpace Address'),
          ],
          style: { head: [], border: [] },
        });

        for (const acc of accounts) {
          table.push([
            acc.index.toString(),
            acc.coreAddress.slice(0, 20) + '...',
            acc.evmAddress,
          ]);
        }

        console.log('\n' + chalk.bold(`Accounts (Wallet: ${mnemonic.label})`));
        console.log(table.toString());
        console.log(chalk.dim(`\nTotal: ${accounts.length} accounts`));
        console.log(chalk.dim('Use `cfx-devkit accounts <index>` for details'));
      }
    });
}
```

---

## Package.json Updates

### Backend package.json

```json
{
  "bin": {
    "cfx-devkit": "./dist/bin.js"
  },
  "scripts": {
    "build": "tsup",
    "dev:cli": "tsx src/bin.ts"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "inquirer": "^10.1.0",
    "chalk": "^5.4.0",
    "ora": "^8.2.0",
    "cli-table3": "^0.6.5"
  }
}
```

### Root package.json (add convenience scripts)

```json
{
  "scripts": {
    "cfx-devkit": "pnpm --filter @conflux-devkit/backend dev:cli",
    "cfx:start": "pnpm cfx-devkit start",
    "cfx:web": "pnpm cfx-devkit web",
    "cfx:setup": "pnpm cfx-devkit setup",
    "cfx:wallets": "pnpm cfx-devkit wallets",
    "cfx:accounts": "pnpm cfx-devkit accounts",
    "cfx:status": "pnpm cfx-devkit status"
  }
}
```

---

## Build Configuration (tsup.config.ts)

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    bin: 'src/bin.ts',  // Add CLI entry point
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@conflux-devkit/core', '@conflux-devkit/plugin-devnode'],
  banner: {
    js: '#!/usr/bin/env node\n',  // Only for bin.js
  },
});
```

---

## Implementation Order

### Day 1: Foundation
- [ ] Add CLI dependencies
- [ ] Create `bin.ts` entry point
- [ ] Create `cli/index.ts` with command registration
- [ ] Implement `status` command (simplest, good for testing)
- [ ] Update tsup.config.ts for CLI build

### Day 2: Core Commands
- [ ] Implement `start` command (direct node control)
- [ ] Implement `stop` command
- [ ] Implement `web` command (backend server mode)
- [ ] Test node lifecycle

### Day 3: Setup & Wallet Commands
- [ ] Implement `setup` command (interactive wizard)
- [ ] Implement `wallets list/add/switch/delete`
- [ ] Implement `accounts` command
- [ ] Test wallet management flow

### Day 4: Admin & Utilities
- [ ] Implement `admin list/add/remove`
- [ ] Implement `reset` command
- [ ] Implement `version` and `help`
- [ ] Add root package.json convenience scripts

### Day 5: Testing & Polish
- [ ] End-to-end testing of all commands
- [ ] Error handling improvements
- [ ] Help text refinement
- [ ] Documentation updates

---

## Success Criteria

- [ ] `cfx-devkit setup` completes interactive setup
- [ ] `cfx-devkit start` starts node in foreground
- [ ] `cfx-devkit web` starts full web mode
- [ ] `cfx-devkit wallets` lists all wallets
- [ ] `cfx-devkit accounts` lists genesis accounts
- [ ] `cfx-devkit admin list` shows admin addresses
- [ ] `cfx-devkit status` shows current state
- [ ] All commands have `--help` with clear descriptions
- [ ] Error messages are user-friendly
- [ ] CI/CD builds CLI correctly

---

## Notes

1. **Service Reuse**: The CLI uses the same `KeystoreService`, `DevKitCompat`, and `BackendServer` as the web UI - no code duplication.

2. **Direct vs Server Mode**:
   - `start/stop/wallets/accounts/admin` work directly with services
   - `web` starts the full BackendServer for API access

3. **Interactive Prompts**: Using Inquirer.js for user-friendly input collection, especially for setup wizard.

4. **Colored Output**: Using Chalk for consistent, readable terminal output.

5. **Progress Indicators**: Using Ora spinners for async operations.

6. **Table Formatting**: Using cli-table3 for clean list displays.
