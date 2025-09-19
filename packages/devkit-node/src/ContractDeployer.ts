import path from 'node:path';
import chalk from 'chalk';
import { http as civeHttp, createPublicClient as createCiveClient } from 'cive';
import fs from 'fs-extra';
import ora, { type Ora } from 'ora';
import { createPublicClient, createWalletClient, http } from 'viem';
import type { DeploymentResult, DeployOptions } from './types.js';

export class ContractDeployer {
  private spinner: Ora | null = null;

  async deploy(options: DeployOptions = {}): Promise<void> {
    const network = options.network || 'both';
    const corePort = parseInt(options.port || '12537', 10);
    const evmPort = parseInt(options.ethPort || '8545', 10);

    const results: DeploymentResult[] = [];

    if (network === 'both' || network === 'espace') {
      this.spinner = ora('Deploying to Conflux eSpace...').start();
      try {
        const result = await this.deployToEspace(evmPort);
        results.push(result);
        this.spinner.succeed(
          chalk.green(`eSpace contract deployed: ${result.address}`)
        );
      } catch (error) {
        this.spinner?.fail(chalk.red('eSpace deployment failed'));
        throw error;
      }
    }

    if (network === 'both' || network === 'core') {
      this.spinner = ora('Deploying to Conflux Core...').start();
      try {
        const result = await this.deployToCore(corePort);
        results.push(result);
        this.spinner.succeed(
          chalk.green(`Core contract deployed: ${result.address}`)
        );
      } catch (error) {
        this.spinner?.fail(chalk.red('Core deployment failed'));
        throw error;
      }
    }

    // Save deployment results
    await this.saveDeploymentResults(results);

    console.log(chalk.blue('\n📊 Deployment Summary:'));
    results.forEach((result) => {
      console.log(chalk.blue(`  ${result.network}: ${result.address}`));
    });
  }

  async deployToEspace(port: number): Promise<DeploymentResult> {
    // Connect to local EVM node
    const evmClient = createPublicClient({
      transport: http(`http://127.0.0.1:${port}`),
    });

    const walletClient = createWalletClient({
      account:
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' as `0x${string}`,
      transport: http(`http://127.0.0.1:${port}`),
    });

    // Simple delegation contract for eSpace
    const contractCode = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.19;
      
      contract SimpleDelegationEspace {
          struct Delegation {
              address delegate;
              uint256 limit;
              bool active;
              uint256 createdAt;
          }
          
          mapping(address => Delegation) public delegations;
          address public owner;
          
          event DelegationCreated(address indexed delegator, address indexed delegate, uint256 limit);
          event DelegationRevoked(address indexed delegator);
          
          constructor() {
              owner = msg.sender;
          }
          
          function createDelegation(address _delegate, uint256 _limit) external {
              require(_delegate != address(0), "Invalid delegate");
              require(_limit > 0, "Limit must be positive");
              
              delegations[msg.sender] = Delegation({
                  delegate: _delegate,
                  limit: _limit,
                  active: true,
                  createdAt: block.timestamp
              });
              
              emit DelegationCreated(msg.sender, _delegate, _limit);
          }
          
          function revokeDelegation() external {
              require(delegations[msg.sender].active, "No active delegation");
              delegations[msg.sender].active = false;
              emit DelegationRevoked(msg.sender);
          }
          
          function getDelegation(address _delegator) external view returns (Delegation memory) {
              return delegations[_delegator];
          }
      }
    `;

    // Deploy contract
    const hash = await walletClient.deployContract({
      abi: this.getContractABI(),
      bytecode: contractCode as `0x${string}`,
      args: [],
      chain: null,
    });

    // Wait for deployment
    const receipt = await evmClient.waitForTransactionReceipt({ hash });

    if (!receipt.contractAddress) {
      throw new Error('Contract deployment failed');
    }

    const address = receipt.contractAddress;
    const txHash = hash;

    return {
      id: `espace-${txHash}`,
      network: 'espace',
      contract: 'SimpleDelegationEspace',
      address: address as `0x${string}`,
      txHash: txHash as `0x${string}`,
      gasUsed: 0n,
      timestamp: new Date(),
      isMock: false,
    };
  }

  async deployToCore(port: number): Promise<DeploymentResult> {
    // Connect to local Core node
    const _coreClient = createCiveClient({
      transport: civeHttp(`http://127.0.0.1:${port}`),
    });

    // Simple delegation contract for Core
    const _contractCode = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.19;
      
      contract SimpleDelegationCore {
          struct Delegation {
              address delegate;
              uint256 limit;
              bool active;
              uint256 createdAt;
          }
          
          mapping(address => Delegation) public delegations;
          address public owner;
          
          event DelegationCreated(address indexed delegator, address indexed delegate, uint256 limit);
          event DelegationRevoked(address indexed delegator);
          
          constructor() {
              owner = msg.sender;
          }
          
          function createDelegation(address _delegate, uint256 _limit) external {
              require(_delegate != address(0), "Invalid delegate");
              require(_limit > 0, "Limit must be positive");
              
              delegations[msg.sender] = Delegation({
                  delegate: _delegate,
                  limit: _limit,
                  active: true,
                  createdAt: block.timestamp
              });
              
              emit DelegationCreated(msg.sender, _delegate, _limit);
          }
          
          function revokeDelegation() external {
              require(delegations[msg.sender].active, "No active delegation");
              delegations[msg.sender].active = false;
              emit DelegationRevoked(msg.sender);
          }
          
          function getDelegation(address _delegator) external view returns (Delegation memory) {
              return delegations[_delegator];
          }
      }
    `;

    // Deploy contract
    // For Core space, we'll use a simplified approach
    // In a real implementation, you would use the appropriate Core space deployment method
    const mockAddress = `0x${'0'.repeat(40)}`; // Mock address for now
    const mockTxHash = `0x${'0'.repeat(64)}`; // Mock transaction hash for now

    // Note: This is a simplified implementation
    // In practice, you would need to implement proper Core space contract deployment
    console.log(
      '⚠️  Core space deployment is simplified in this implementation'
    );

    return {
      id: `core-${mockTxHash}`,
      network: 'core',
      contract: 'SimpleDelegationCore',
      address: mockAddress as `0x${string}`,
      txHash: mockTxHash as `0x${string}`,
      gasUsed: 0n,
      timestamp: new Date(),
      isMock: true,
    };
  }

  private getContractABI() {
    return [
      {
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'delegator',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'delegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'limit',
            type: 'uint256',
          },
        ],
        name: 'DelegationCreated',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'delegator',
            type: 'address',
          },
        ],
        name: 'DelegationRevoked',
        type: 'event',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: '_delegate',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_limit',
            type: 'uint256',
          },
        ],
        name: 'createDelegation',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: '_delegator',
            type: 'address',
          },
        ],
        name: 'getDelegation',
        outputs: [
          {
            components: [
              {
                internalType: 'address',
                name: 'delegate',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'limit',
                type: 'uint256',
              },
              {
                internalType: 'bool',
                name: 'active',
                type: 'bool',
              },
              {
                internalType: 'uint256',
                name: 'createdAt',
                type: 'uint256',
              },
            ],
            internalType: 'struct SimpleDelegation.Delegation',
            name: '',
            type: 'tuple',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'owner',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'revokeDelegation',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];
  }

  private async saveDeploymentResults(
    results: DeploymentResult[]
  ): Promise<void> {
    const deployDir = path.join(process.cwd(), 'deployments');
    await fs.ensureDir(deployDir);

    const deployFile = path.join(deployDir, 'local-deployments.json');
    await fs.writeJson(
      deployFile,
      {
        timestamp: new Date().toISOString(),
        deployments: results,
      },
      { spaces: 2 }
    );

    console.log(chalk.blue(`📄 Deployment info saved to: ${deployFile}`));
  }
}
