// Browser conversion utility tests

import { describe, it, expect } from 'vitest';
import {
  toBrowserWalletInfo,
  toBrowserTransactionReceipt,
  toBrowserBlock,
  toBrowserTransaction,
  toBrowserContractCallResult,
  toBrowserDeploymentResult,
  toBrowserNodeStatus,
  toBrowserNetworkConfig,
  toBrowserContractOrchestrator,
  toBrowserSafe,
} from '../../../src/utils/browser-conversion';
import {
  createMockWalletInfo,
  createMockTransactionReceipt,
  createMockBlock,
} from '../../helpers/test-utils';
import { MOCK_NETWORKS, MOCK_DEPLOYMENT_RESULT } from '../../helpers/mock-data';
import {
  expectValidWalletInfo,
  expectValidTransactionReceipt,
  expectValidContractOrchestrator,
} from '../../helpers/assertions';

describe('Browser Conversion Utilities', () => {
  describe('toBrowserWalletInfo', () => {
    it('should convert complete WalletInfo to browser-safe format', () => {
      const wallet = createMockWalletInfo();
      const result = toBrowserWalletInfo(wallet);

      expect(result).toEqual({
        index: 0,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        mnemonic:
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        balance: '1000000000000000000',
        balanceFormatted: '1.0 CFX',
        isMining: false,
      });

      expectValidWalletInfo(result);
    });

    it('should handle missing optional properties', () => {
      const wallet = {
        index: 0,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        privateKey:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        mnemonic:
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      };

      const result = toBrowserWalletInfo(wallet as any);

      expect(result.balance).toBe('0');
      expect(result.balanceFormatted).toBe('0');
      expect(result.isMining).toBe(false);
    });

    it('should handle null/undefined balance', () => {
      const wallet = createMockWalletInfo({ balance: null });
      const result = toBrowserWalletInfo(wallet);

      expect(result.balance).toBe('0');
    });

    it('should handle zero balance', () => {
      const wallet = createMockWalletInfo({ balance: 0n });
      const result = toBrowserWalletInfo(wallet);

      expect(result.balance).toBe('0');
    });

    it('should handle large balance values', () => {
      const wallet = createMockWalletInfo({
        balance: 999999999999999999999999999999n,
        balanceFormatted: '999,999,999,999.999999999999999999 CFX',
      });
      const result = toBrowserWalletInfo(wallet);

      expect(result.balance).toBe('999999999999999999999999999999');
      expect(result.balanceFormatted).toBe(
        '999,999,999,999.999999999999999999 CFX'
      );
    });
  });

  describe('toBrowserTransactionReceipt', () => {
    it('should convert successful transaction receipt', () => {
      const receipt = createMockTransactionReceipt();
      const result = toBrowserTransactionReceipt(receipt);

      expect(result).toEqual({
        transactionHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: '12345',
        blockHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        transactionIndex: '0',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0x9876543210fedcba9876543210fedcba98765432',
        gasUsed: '21000',
        effectiveGasPrice: '20000000000',
        status: 'success',
        logs: [],
      });

      expectValidTransactionReceipt(result);
    });

    it('should handle failed transaction receipt', () => {
      const receipt = createMockTransactionReceipt({ status: 'reverted' });
      const result = toBrowserTransactionReceipt(receipt);

      expect(result.status).toBe('reverted');
    });

    it('should handle transaction with logs', () => {
      const logs = [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          topics: [
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          ],
          data: '0x',
          blockNumber: 12345n,
          transactionHash:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          transactionIndex: 0,
          blockHash:
            '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
          logIndex: 0,
          removed: false,
        },
      ];

      const receipt = createMockTransactionReceipt({ logs });
      const result = toBrowserTransactionReceipt(receipt);

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0]).toEqual({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        topics: [
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        ],
        data: '0x',
        blockNumber: '12345',
        transactionHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        transactionIndex: '0',
        blockHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        logIndex: '0',
        removed: false,
      });
    });

    it('should handle null/undefined values', () => {
      const receipt = createMockTransactionReceipt({
        to: null,
        gasUsed: null,
        effectiveGasPrice: null,
      });
      const result = toBrowserTransactionReceipt(receipt);

      expect(result.to).toBeNull();
      expect(result.gasUsed).toBe('0');
      expect(result.effectiveGasPrice).toBe('0');
    });
  });

  describe('toBrowserBlock', () => {
    it('should convert block to browser-safe format', () => {
      const block = createMockBlock();
      const result = toBrowserBlock(block);

      expect(result).toEqual({
        number: '12345',
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        parentHash:
          '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98',
        timestamp: '1640995200',
        gasLimit: '30000000',
        gasUsed: '21000',
        baseFeePerGas: '0',
        transactions: [],
      });
    });

    it('should handle block with transactions', () => {
      const transactions = [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      ];

      const block = createMockBlock({ transactions });
      const result = toBrowserBlock(block);

      expect(result.transactions).toEqual(transactions);
    });

    it('should handle null/undefined values', () => {
      const block = createMockBlock({
        baseFeePerGas: null,
        gasUsed: null,
      });
      const result = toBrowserBlock(block);

      expect(result.baseFeePerGas).toBe('0');
      expect(result.gasUsed).toBe('0');
    });
  });

  describe('toBrowserTransaction', () => {
    it('should convert transaction to browser-safe format', () => {
      const transaction = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: 12345n,
        blockHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        transactionIndex: 0,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0x9876543210fedcba9876543210fedcba98765432',
        value: 1000000000000000000n,
        gas: 21000n,
        gasPrice: 20000000000n,
        input: '0x',
        nonce: 0,
        type: 'legacy' as const,
      };

      const result = toBrowserTransaction(transaction);

      expect(result).toEqual({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: '12345',
        blockHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        transactionIndex: '0',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0x9876543210fedcba9876543210fedcba98765432',
        value: '1000000000000000000',
        gas: '21000',
        gasPrice: '20000000000',
        nonce: '0',
      });
    });

    it('should handle null/undefined values', () => {
      const transaction = {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: 12345n,
        blockHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        transactionIndex: 0,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: null,
        value: null,
        gas: null,
        gasPrice: null,
        input: '0x',
        nonce: 0,
        type: 'legacy' as const,
      };

      const result = toBrowserTransaction(transaction);

      expect(result.to).toBeNull();
      expect(result.value).toBe('0');
      expect(result.gas).toBe('0');
      expect(result.gasPrice).toBe('0');
    });
  });

  describe('toBrowserContractCallResult', () => {
    it('should convert successful contract call result', () => {
      const result = {
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000064',
        gasUsed: 21000n,
        blockNumber: 12345n,
      };

      const browserResult = toBrowserContractCallResult(result);

      expect(browserResult).toEqual({
        result:
          '"0x0000000000000000000000000000000000000000000000000000000000000064"',
        gasUsed: '21000',
        blockNumber: '12345',
      });
    });

    it('should convert failed contract call result', () => {
      const result = {
        result: '0x',
        gasUsed: 0n,
        blockNumber: 12345n,
      };

      const browserResult = toBrowserContractCallResult(result);

      expect(browserResult).toEqual({
        result: '"0x"',
        gasUsed: '0',
        blockNumber: '12345',
      });
    });
  });

  describe('toBrowserDeploymentResult', () => {
    it('should convert deployment result to browser-safe format', () => {
      // Create a proper DeploymentResult object that matches the interface
      const deploymentResult = {
        id: 'deploy-123',
        network: 'evm',
        contract: 'TestToken',
        address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        txHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as `0x${string}`,
        gasUsed: 1000000n,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
        isMock: false,
        blockNumber: 12345n,
        confirmations: 1,
      };

      const result = toBrowserDeploymentResult(deploymentResult);

      expect(result).toEqual({
        contractName: 'TestToken',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        txHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        gasUsed: '1000000',
        timestamp: '2024-01-01T00:00:00.000Z',
        abi: '[]',
        bytecode: '0x',
        deployedBytecode: '0x',
        network: 'evm',
        chainId: '0',
        evmChainId: undefined,
        chainType: 'evm',
      });
    });
  });

  describe('toBrowserNodeStatus', () => {
    it('should convert node status to browser-safe format', () => {
      const status = {
        running: true,
        isSyncing: false,
        blockNumber: 12345n,
        peerCount: 5,
        chainId: 2029,
        evmChainId: 2030,
        networkId: '2030',
        lastHealthCheck: new Date('2024-01-01T00:00:00Z'),
        corePort: 12537,
        evmPort: 8545,
        walletMode: 'mnemonic',
        wallets: [],
        miningAddress: '0x1234567890abcdef1234567890abcdef12345678',
      };

      const result = toBrowserNodeStatus(status);

      expect(result).toEqual({
        running: true,
        corePort: '12537',
        evmPort: '8545',
        chainId: '2029',
        evmChainId: '2030',
        blockNumber: '12345',
        peerCount: '5',
        walletMode: 'mnemonic',
        wallets: [],
        miningAddress: '0x1234567890abcdef1234567890abcdef12345678',
        health: 'unknown',
        lastHealthCheck: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should handle null/undefined values', () => {
      const status = {
        running: false,
        isSyncing: false,
        blockNumber: null,
        peerCount: null,
        chainId: 2029,
        evmChainId: null,
        networkId: '2030',
        lastHealthCheck: null,
        corePort: 0,
        evmPort: 0,
        walletMode: 'mnemonic',
        wallets: [],
        miningAddress: null,
      };

      const result = toBrowserNodeStatus(status as any);

      expect(result.running).toBe(false);
      expect(result.corePort).toBe('0');
      expect(result.evmPort).toBe('0');
      expect(result.blockNumber).toBe('0');
      expect(result.peerCount).toBe('0');
      expect(result.evmChainId).toBe('0');
      expect(result.lastHealthCheck).toBeDefined();
      expect(result.health).toBe('unknown');
    });
  });

  describe('toBrowserNetworkConfig', () => {
    it('should convert network config to browser-safe format', () => {
      const network = MOCK_NETWORKS.mainnetEvm;
      const result = toBrowserNetworkConfig(network);

      expect(result).toEqual({
        name: 'Conflux Mainnet EVM',
        chainId: '2029',
        evmChainId: '2030',
        rpcUrl: 'https://main.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: '18',
        },
        isTestnet: false,
        networkType: 'evm',
      });
    });

    it('should handle testnet networks', () => {
      const network = MOCK_NETWORKS.testnetEvm;
      const result = toBrowserNetworkConfig(network);

      expect(result.isTestnet).toBe(true);
    });

    it('should handle networks without EVM chain ID', () => {
      const network = MOCK_NETWORKS.mainnetCore;
      const result = toBrowserNetworkConfig(network);

      expect(result.evmChainId).toBeUndefined();
    });
  });

  describe('toBrowserContractOrchestrator', () => {
    it('should convert contract orchestrator to browser-safe format', () => {
      const orchestrator = {
        name: 'TestToken',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: '[]',
        bytecode: '0x608060405234801561001057600080fd5b50...',
        deployedBytecode: '0x608060405234801561001057600080fd5b50...',
        chainType: 'evm',
        networkId: '2030',
        chainId: '2030',
        evmChainId: '2030',
        network: {
          name: 'Test Network',
          chainId: '2030',
          evmChainId: '2030',
          rpcUrl: 'https://test.confluxrpc.com',
          currency: {
            name: 'Conflux',
            symbol: 'CFX',
            decimals: '18',
          },
          isTestnet: true,
        },
        methods: {
          read: ['totalSupply', 'balanceOf'],
          write: ['transfer', 'approve'],
          events: ['Transfer', 'Approval'],
        },
        capabilities: {
          read: true,
          write: true,
          events: true,
        },
      };

      const result = toBrowserContractOrchestrator(orchestrator);

      expectValidContractOrchestrator(result);
      expect(result.name).toBe('TestToken');
      expect(result.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(result.chainType).toBe('evm');
    });
  });

  describe('toBrowserSafe', () => {
    it('should convert any object to browser-safe format', () => {
      const obj = {
        balance: 1000000000000000000n,
        blockNumber: 12345n,
        name: 'Test',
        count: 42,
        nested: {
          value: 2000000000000000000n,
          text: 'Nested',
        },
      };

      const result = toBrowserSafe(obj);

      expect(result).toEqual({
        balance: '1000000000000000000',
        blockNumber: '12345',
        name: 'Test',
        count: '42',
        nested: '{"value":"2000000000000000000","text":"Nested"}',
      });
    });

    it('should handle arrays', () => {
      const obj = {
        balances: [1000000000000000000n, 2000000000000000000n],
        names: ['Alice', 'Bob'],
      };

      const result = toBrowserSafe(obj);

      expect(result).toEqual({
        balances: '["1000000000000000000","2000000000000000000"]',
        names: '["Alice","Bob"]',
      });
    });

    it('should handle null/undefined values', () => {
      const obj = {
        value: null,
        text: undefined,
        count: 42,
      };

      const result = toBrowserSafe(obj);

      expect(result).toEqual({
        value: '',
        text: '',
        count: '42',
      });
    });
  });
});
