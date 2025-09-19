/**
 * Contract Operations Tests
 *
 * Tests contract deployment and interaction through DevKit API:
 * - Single chain deployment
 * - Multi-chain deployment
 * - Contract reading and writing
 * - Cross-chain contract operations
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DevKit } from '../src/devkit.js';
import type {
  DeployOptions,
  ReadOptions,
  WriteOptions,
} from '../src/types/index.js';
import { MOCK_ACCOUNT, TEST_CONFIG } from './setup.js';

// Mock wallet clients for contract operations
vi.mock('../src/clients/core.js', () => ({
  CoreClient: vi.fn(),
  CoreWalletClient: vi.fn().mockImplementation(() => ({
    deployContract: vi
      .fn()
      .mockResolvedValue('cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp'),
    callContract: vi.fn().mockResolvedValue(42),
    writeContract: vi.fn().mockResolvedValue('0xcore_tx_hash'),
    waitForTransaction: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../src/clients/evm.js', () => ({
  EspaceClient: vi.fn(),
  EspaceWalletClient: vi.fn().mockImplementation(() => ({
    deployContract: vi
      .fn()
      .mockResolvedValue('0x1234567890123456789012345678901234567890'),
    callContract: vi.fn().mockResolvedValue(84),
    writeContract: vi.fn().mockResolvedValue('0xevm_tx_hash'),
    waitForTransaction: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock ServerManager
vi.mock('../src/server/index.js', () => ({
  ServerManager: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    getAccounts: vi.fn().mockReturnValue([MOCK_ACCOUNT]),
    getRpcUrls: vi.fn().mockReturnValue({
      core: 'http://localhost:12537',
      evm: 'http://localhost:8545',
    }),
  })),
}));

describe('DevKit Contract Operations', () => {
  let devkit: DevKit;

  const SIMPLE_STORAGE_ABI = [
    {
      type: 'constructor',
      inputs: [
        { name: '_initialValue', type: 'uint256', internalType: 'uint256' },
      ],
    },
    {
      type: 'function',
      name: 'get',
      inputs: [],
      outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'set',
      inputs: [{ name: '_value', type: 'uint256', internalType: 'uint256' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  ];

  const SIMPLE_STORAGE_BYTECODE =
    '0x608060405234801561001057600080fd5b5060405161017238038061017283398101604081905261002f91610037565b600055610050565b60006020828403121561004957600080fd5b5051919050565b610113806100596000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146049575b600080fd5b6047604236600460d9565b600055565b005b60005460405190815260200160405180910390f35b634e487b7160e01b600052602260045260246000fd5b60008160011c9050806001026002026004026008026010026020026040026080029050816001600160c01b031696950250505050565b600060208284031215609357600080fd5b503591905056fea26469706673582212209a4c4a5b4c2e3f5e5f1c8c5b7b1f2f0f5c1e1f5e1a2a5b4c5e5f1c8c5b7b1f264736f6c63430008110033';

  beforeEach(() => {
    vi.clearAllMocks();
    devkit = new DevKit(TEST_CONFIG);
  });

  describe('Contract Deployment', () => {
    it('should deploy contract to core chain only', async () => {
      const deployOptions: DeployOptions = {
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [42],
        account: 0,
        chain: 'core',
      };

      const result = await devkit.deployContract(deployOptions);

      expect(result.core).toBe(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp'
      );
      expect(result.evm).toBeUndefined();

      // Verify the core wallet was used
      const account = devkit.account(0);
      expect(account.core.deployContract).toHaveBeenCalledWith(
        SIMPLE_STORAGE_ABI,
        SIMPLE_STORAGE_BYTECODE,
        [42]
      );
    });

    it('should deploy contract to evm chain only', async () => {
      const deployOptions: DeployOptions = {
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [84],
        account: 0,
        chain: 'evm',
      };

      const result = await devkit.deployContract(deployOptions);

      expect(result.evm).toBe('0x1234567890123456789012345678901234567890');
      expect(result.core).toBeUndefined();

      // Verify the evm wallet was used
      const account = devkit.account(0);
      expect(account.evm.deployContract).toHaveBeenCalledWith(
        SIMPLE_STORAGE_ABI,
        SIMPLE_STORAGE_BYTECODE,
        [84]
      );
    });

    it('should deploy contract to multiple chains', async () => {
      const deployOptions: DeployOptions = {
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [100],
        account: 0,
        chains: ['core', 'evm'],
      };

      const result = await devkit.deployContract(deployOptions);

      expect(result.core).toBe(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp'
      );
      expect(result.evm).toBe('0x1234567890123456789012345678901234567890');

      // Verify both wallets were used
      const account = devkit.account(0);
      expect(account.core.deployContract).toHaveBeenCalledWith(
        SIMPLE_STORAGE_ABI,
        SIMPLE_STORAGE_BYTECODE,
        [100]
      );
      expect(account.evm.deployContract).toHaveBeenCalledWith(
        SIMPLE_STORAGE_ABI,
        SIMPLE_STORAGE_BYTECODE,
        [100]
      );
    });

    it('should throw error when neither chain nor chains specified', async () => {
      const deployOptions = {
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [42],
        account: 0,
        // Missing chain/chains
      } as DeployOptions;

      await expect(devkit.deployContract(deployOptions)).rejects.toThrow(
        'Must specify either chain or chains in deploy options'
      );
    });
  });

  describe('Contract Reading', () => {
    it('should read from core contract', async () => {
      const readOptions: ReadOptions = {
        address: 'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'core',
      };

      const result = await devkit.readContract(readOptions);

      expect(result).toBe(42);

      // Verify account 0 was used for reading
      const account = devkit.account(0);
      expect(account.core.callContract).toHaveBeenCalledWith(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        SIMPLE_STORAGE_ABI,
        'get',
        []
      );
    });

    it('should read from evm contract', async () => {
      const readOptions: ReadOptions = {
        address: '0x1234567890123456789012345678901234567890',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'evm',
      };

      const result = await devkit.readContract(readOptions);

      expect(result).toBe(84);

      // Verify account 0 was used for reading
      const account = devkit.account(0);
      expect(account.evm.callContract).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        SIMPLE_STORAGE_ABI,
        'get',
        []
      );
    });

    it('should read contract with arguments', async () => {
      const readOptions: ReadOptions = {
        address: 'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'someFunction',
        args: [123, 'test'],
        chain: 'core',
      };

      await devkit.readContract(readOptions);

      const account = devkit.account(0);
      expect(account.core.callContract).toHaveBeenCalledWith(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        SIMPLE_STORAGE_ABI,
        'someFunction',
        [123, 'test']
      );
    });
  });

  describe('Contract Writing', () => {
    it('should write to core contract with confirmation', async () => {
      const writeOptions: WriteOptions = {
        address: 'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [999],
        account: 0,
        chain: 'core',
      };

      const txHash = await devkit.writeContract(writeOptions);

      expect(txHash).toBe('0xcore_tx_hash');

      // Verify the correct account and parameters were used
      const account = devkit.account(0);
      expect(account.core.writeContract).toHaveBeenCalledWith(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        SIMPLE_STORAGE_ABI,
        'set',
        [999],
        undefined
      );

      // Should wait for confirmation by default
      expect(account.core.waitForTransaction).toHaveBeenCalledWith(
        '0xcore_tx_hash'
      );
    });

    it('should write to evm contract with confirmation', async () => {
      const writeOptions: WriteOptions = {
        address: '0x1234567890123456789012345678901234567890',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [777],
        account: 0,
        chain: 'evm',
      };

      const txHash = await devkit.writeContract(writeOptions);

      expect(txHash).toBe('0xevm_tx_hash');

      // Verify the correct account and parameters were used
      const account = devkit.account(0);
      expect(account.evm.writeContract).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        SIMPLE_STORAGE_ABI,
        'set',
        [777],
        undefined
      );

      // Should wait for confirmation by default
      expect(account.evm.waitForTransaction).toHaveBeenCalledWith(
        '0xevm_tx_hash'
      );
    });

    it('should write contract without waiting for confirmation', async () => {
      const writeOptions: WriteOptions = {
        address: 'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [555],
        account: 0,
        chain: 'core',
        waitForConfirmation: false,
      };

      const txHash = await devkit.writeContract(writeOptions);

      expect(txHash).toBe('0xcore_tx_hash');

      // Should not wait for confirmation
      const account = devkit.account(0);
      expect(account.core.waitForTransaction).not.toHaveBeenCalled();
    });

    it('should write contract with value', async () => {
      const writeOptions: WriteOptions = {
        address: 'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'payableFunction',
        args: [],
        account: 0,
        chain: 'core',
        value: BigInt('1000000000000000000'), // 1 CFX
      };

      await devkit.writeContract(writeOptions);

      const account = devkit.account(0);
      expect(account.core.writeContract).toHaveBeenCalledWith(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        SIMPLE_STORAGE_ABI,
        'payableFunction',
        [],
        BigInt('1000000000000000000')
      );
    });

    it('should use different account for writing', async () => {
      // Add a second account to mock
      vi.mocked(devkit.server.getAccounts).mockReturnValue([
        MOCK_ACCOUNT,
        {
          ...MOCK_ACCOUNT,
          index: 1,
          privateKey:
            '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          path: "m/44'/60'/0'/0/1",
        },
      ]);

      const writeOptions: WriteOptions = {
        address: 'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [333],
        account: 1, // Use account 1
        chain: 'core',
      };

      await devkit.writeContract(writeOptions);

      // Verify account 1 was used
      const account1 = devkit.account(1);
      expect(account1.core.writeContract).toHaveBeenCalledWith(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp',
        SIMPLE_STORAGE_ABI,
        'set',
        [333],
        undefined
      );
    });
  });

  describe('Cross-Chain Contract Operations', () => {
    it('should deploy same contract to both chains', async () => {
      const deployOptions: DeployOptions = {
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [200],
        account: 0,
        chains: ['core', 'evm'],
      };

      const deployment = await devkit.deployContract(deployOptions);

      // Now test reading from both deployed contracts
      const coreResult = await devkit.readContract({
        address: deployment.core!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'core',
      });

      const evmResult = await devkit.readContract({
        address: deployment.evm!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'evm',
      });

      expect(coreResult).toBe(42); // From mock
      expect(evmResult).toBe(84); // From mock
    });

    it('should write to both chain versions of contract', async () => {
      const coreAddress = 'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp';
      const evmAddress = '0x1234567890123456789012345678901234567890';

      // Write to core version
      const coreTxHash = await devkit.writeContract({
        address: coreAddress,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [111],
        account: 0,
        chain: 'core',
      });

      // Write to evm version
      const evmTxHash = await devkit.writeContract({
        address: evmAddress,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [222],
        account: 0,
        chain: 'evm',
      });

      expect(coreTxHash).toBe('0xcore_tx_hash');
      expect(evmTxHash).toBe('0xevm_tx_hash');

      // Verify both transactions were submitted
      const account = devkit.account(0);
      expect(account.core.writeContract).toHaveBeenCalledWith(
        coreAddress,
        SIMPLE_STORAGE_ABI,
        'set',
        [111],
        undefined
      );
      expect(account.evm.writeContract).toHaveBeenCalledWith(
        evmAddress,
        SIMPLE_STORAGE_ABI,
        'set',
        [222],
        undefined
      );
    });
  });
});
