/**
 * End-to-End Workflow Tests
 *
 * Tests complete workflows that mirror the example usage:
 * - Complete development workflow
 * - Cross-chain contract deployment and interaction
 * - Mining and account management workflows
 * - Real-world usage scenarios
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DevKit } from '../src/devkit.js';
import { MOCK_ACCOUNT, TEST_CONFIG } from './setup.js';

// Setup comprehensive mocks for E2E testing
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

// Mock state to track E2E operations
const mockState = {
  miningStatus: {
    isRunning: false,
    interval: 1000,
    blocksMined: 0,
    startTime: undefined as Date | undefined,
  },
  contractValues: {
    core: 42,
    evm: 84,
  },
  deployedContracts: {
    core: undefined as string | undefined,
    evm: undefined as string | undefined,
  },
};

// Comprehensive mock setup
vi.mock('../src/server/index.js', () => ({
  ServerManager: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockImplementation(() => {
      mockState.miningStatus.isRunning = false; // Start with mining stopped
      return Promise.resolve();
    }),
    stop: vi.fn().mockResolvedValue(undefined),

    startMining: vi.fn().mockImplementation(() => {
      mockState.miningStatus.isRunning = true;
      mockState.miningStatus.startTime = new Date();
      return Promise.resolve();
    }),

    stopMining: vi.fn().mockImplementation(() => {
      mockState.miningStatus.isRunning = false;
      mockState.miningStatus.startTime = undefined;
      return Promise.resolve();
    }),

    mine: vi.fn().mockImplementation((blocks: number) => {
      mockState.miningStatus.blocksMined += blocks;
      return Promise.resolve();
    }),

    getMiningStatus: vi.fn(() => ({ ...mockState.miningStatus })),
    getStatus: vi.fn().mockReturnValue('running'),

    getAccounts: vi
      .fn()
      .mockReturnValue([
        MOCK_ACCOUNT,
        {
          ...MOCK_ACCOUNT,
          index: 1,
          privateKey:
            '0x1111111111111111111111111111111111111111111111111111111111111111',
          path: "m/44'/60'/0'/0/1",
        },
        {
          ...MOCK_ACCOUNT,
          index: 2,
          privateKey:
            '0x2222222222222222222222222222222222222222222222222222222222222222',
          path: "m/44'/60'/0'/0/2",
        },
      ]),

    addAccount: vi.fn().mockResolvedValue({
      ...MOCK_ACCOUNT,
      index: 3,
      privateKey:
        '0x3333333333333333333333333333333333333333333333333333333333333333',
      path: "m/44'/60'/0'/0/3",
    }),

    getRpcUrls: vi.fn().mockReturnValue({
      core: 'http://localhost:12537',
      evm: 'http://localhost:8545',
    }),

    getFaucetBalances: vi.fn().mockResolvedValue({
      coreBalance: '10000000000000000000000',
      evmBalance: '10000000000000000000000',
    }),

    getFaucetAccount: vi.fn().mockReturnValue({
      ...MOCK_ACCOUNT,
      index: -1,
      privateKey: '0xfaucet_key',
      coreAddress: 'cfx:faucet_core',
      evmAddress: '0xfaucet_evm',
    }),

    fundCoreAccount: vi.fn().mockResolvedValue('0xfund_core_tx'),
    fundEvmAccount: vi.fn().mockResolvedValue('0xfund_evm_tx'),
  })),
}));

vi.mock('../src/clients/core.js', () => ({
  CoreClient: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue('1000000000000000000000'), // 1000 CFX
  })),
  CoreWalletClient: vi.fn().mockImplementation(() => ({
    deployContract: vi.fn().mockImplementation((_abi, _bytecodee, args) => {
      mockState.deployedContracts.core =
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp';
      if (args && args.length > 0) {
        mockState.contractValues.core = args[0];
      }
      return Promise.resolve(mockState.deployedContracts.core);
    }),
    callContract: vi.fn().mockImplementation(() => {
      return Promise.resolve(mockState.contractValues.core);
    }),
    writeContract: vi
      .fn()
      .mockImplementation((_address, _abii, functionName, args) => {
        if (functionName === 'set' && args && args.length > 0) {
          mockState.contractValues.core = args[0];
        }
        return Promise.resolve('0xcore_write_tx');
      }),
    waitForTransaction: vi.fn().mockResolvedValue(undefined),
    sendTransaction: vi.fn().mockResolvedValue('0xcore_send_tx'),
  })),
}));

vi.mock('../src/clients/evm.js', () => ({
  EspaceClient: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue('2000000000000000000000'), // 2000 CFX
  })),
  EspaceWalletClient: vi.fn().mockImplementation(() => ({
    deployContract: vi.fn().mockImplementation((_abi, _bytecodee, args) => {
      mockState.deployedContracts.evm =
        '0x1234567890123456789012345678901234567890';
      if (args && args.length > 0) {
        mockState.contractValues.evm = args[0];
      }
      return Promise.resolve(mockState.deployedContracts.evm);
    }),
    callContract: vi.fn().mockImplementation(() => {
      return Promise.resolve(mockState.contractValues.evm);
    }),
    writeContract: vi
      .fn()
      .mockImplementation((_address, _abii, functionName, args) => {
        if (functionName === 'set' && args && args.length > 0) {
          mockState.contractValues.evm = args[0];
        }
        return Promise.resolve('0xevm_write_tx');
      }),
    waitForTransaction: vi.fn().mockResolvedValue(undefined),
    sendTransaction: vi.fn().mockResolvedValue('0xevm_send_tx'),
  })),
}));

describe('DevKit E2E Workflows', () => {
  let devkit: DevKit;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockState.miningStatus = {
      isRunning: false,
      interval: 1000,
      blocksMined: 0,
      startTime: undefined,
    };
    mockState.contractValues = { core: 42, evm: 84 };
    mockState.deployedContracts = { core: undefined, evm: undefined };

    devkit = new DevKit(TEST_CONFIG);
  });

  afterEach(async () => {
    if (devkit) {
      try {
        await devkit.stop();
      } catch (_error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('Complete Development Workflow', () => {
    it('should complete a full development cycle', async () => {
      // 1. Start the development node
      await devkit.start({ mining: true, waitForBlocks: 2 });

      expect(mockState.miningStatus.isRunning).toBe(true);
      expect(mockState.miningStatus.blocksMined).toBe(2);

      // 2. Check initial status
      const status = await devkit.getStatus();
      expect(status.core.connected).toBe(true);
      expect(status.evm.connected).toBe(true);

      // 3. Access accounts and check balances
      const account0 = devkit.account(0);
      const account1 = devkit.account(1);

      const balances0 = await account0.getBalances();
      const balances1 = await account1.getBalances();

      expect(balances0.core).toBe('1000000000000000000000');
      expect(balances0.evm).toBe('2000000000000000000000');
      expect(balances1.core).toBe('1000000000000000000000');
      expect(balances1.evm).toBe('2000000000000000000000');

      // 4. Fund accounts from faucet
      await account0.fundFromFaucet('5000000000000000000000', 'core');
      await account1.fundFromFaucet('3000000000000000000000', 'evm');

      // 5. Deploy contracts to both chains
      const deployment = await devkit.deployContract({
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [100],
        account: 0,
        chains: ['core', 'evm'],
      });

      expect(deployment.core).toBe(
        'cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp'
      );
      expect(deployment.evm).toBe('0x1234567890123456789012345678901234567890');

      // 6. Read from deployed contracts
      const coreValue = await devkit.readContract({
        address: deployment.core!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'core',
      });

      const evmValue = await devkit.readContract({
        address: deployment.evm!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'evm',
      });

      expect(coreValue).toBe(100);
      expect(evmValue).toBe(100);

      // 7. Write to contracts with different values
      await devkit.writeContract({
        address: deployment.core!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [999],
        account: 0,
        chain: 'core',
      });

      await devkit.writeContract({
        address: deployment.evm!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [777],
        account: 1,
        chain: 'evm',
      });

      // 8. Verify the writes
      const updatedCoreValue = await devkit.readContract({
        address: deployment.core!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'core',
      });

      const updatedEvmValue = await devkit.readContract({
        address: deployment.evm!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'evm',
      });

      expect(updatedCoreValue).toBe(999);
      expect(updatedEvmValue).toBe(777);

      // 9. Mine additional blocks
      await devkit.mine(3);
      expect(mockState.miningStatus.blocksMined).toBe(5); // 2 initial + 3 additional

      // 10. Clean shutdown
      await devkit.stopMining();
      await devkit.stop();

      expect(mockState.miningStatus.isRunning).toBe(false);
    });
  });

  describe('Account Management Workflow', () => {
    it('should demonstrate comprehensive account management', async () => {
      await devkit.start();

      // 1. Access existing accounts
      const accounts = devkit.getAccounts();
      expect(accounts).toHaveLength(3);

      // 2. Add a new account
      const newAccount = await devkit.addAccount();
      expect(newAccount.index).toBe(3);

      // 3. Test account operations
      const account0 = devkit.account(0);
      const account1 = devkit.account(1);

      // 4. Transfer between accounts
      await account0.transfer(
        account1.address.core,
        '1000000000000000000',
        'core'
      );
      await account0.transfer(
        account1.address.evm,
        '2000000000000000000',
        'evm'
      );

      // 5. Check faucet operations
      const faucetBalances = await devkit.getFaucetBalances();
      expect(faucetBalances.coreBalance).toBe('10000000000000000000000');
      expect(faucetBalances.evmBalance).toBe('10000000000000000000000');

      const faucetAccount = await devkit.getFaucetAccount();
      expect(faucetAccount.index).toBe(-1);

      // 6. Fund multiple accounts
      await Promise.all([
        devkit.fundAccount(
          account0.address.core,
          '1000000000000000000',
          'core'
        ),
        devkit.fundAccount(account1.address.evm, '2000000000000000000', 'evm'),
        newAccount.fundFromFaucet('500000000000000000', 'core'),
      ]);

      await devkit.stop();
    });
  });

  describe('Mining Control Workflow', () => {
    it('should demonstrate mining operations', async () => {
      await devkit.start({ mining: false }); // Start without auto-mining

      // 1. Check initial mining status
      let status = devkit.getMiningStatus();
      expect(status.isRunning).toBe(false);
      expect(status.blocksMined).toBe(0);

      // 2. Start mining manually
      await devkit.startMining();
      status = devkit.getMiningStatus();
      expect(status.isRunning).toBe(true);
      expect(status.startTime).toBeInstanceOf(Date);

      // 3. Mine specific blocks
      await devkit.mine(5);
      status = devkit.getMiningStatus();
      expect(status.blocksMined).toBe(5);

      // 4. Mine more blocks
      await devkit.mine(3);
      status = devkit.getMiningStatus();
      expect(status.blocksMined).toBe(8);

      // 5. Stop mining
      await devkit.stopMining();
      status = devkit.getMiningStatus();
      expect(status.isRunning).toBe(false);

      await devkit.stop();
    });
  });

  describe('Cross-Chain Contract Workflow', () => {
    it('should demonstrate cross-chain contract operations', async () => {
      await devkit.start();

      // 1. Deploy same contract to both chains with different initial values
      const coreDeployment = await devkit.deployContract({
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [111],
        account: 0,
        chain: 'core',
      });

      const evmDeployment = await devkit.deployContract({
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [222],
        account: 0,
        chain: 'evm',
      });

      // 2. Verify initial values
      const coreInitial = await devkit.readContract({
        address: coreDeployment.core!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'core',
      });

      const evmInitial = await devkit.readContract({
        address: evmDeployment.evm!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'evm',
      });

      expect(coreInitial).toBe(111);
      expect(evmInitial).toBe(222);

      // 3. Perform cross-chain updates with different accounts
      await Promise.all([
        devkit.writeContract({
          address: coreDeployment.core!,
          abi: SIMPLE_STORAGE_ABI,
          functionName: 'set',
          args: [333],
          account: 0,
          chain: 'core',
        }),
        devkit.writeContract({
          address: evmDeployment.evm!,
          abi: SIMPLE_STORAGE_ABI,
          functionName: 'set',
          args: [444],
          account: 1,
          chain: 'evm',
        }),
      ]);

      // 4. Verify updates
      const coreUpdated = await devkit.readContract({
        address: coreDeployment.core!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'core',
      });

      const evmUpdated = await devkit.readContract({
        address: evmDeployment.evm!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'get',
        args: [],
        chain: 'evm',
      });

      expect(coreUpdated).toBe(333);
      expect(evmUpdated).toBe(444);

      await devkit.stop();
    });
  });

  describe('Real-world Development Scenario', () => {
    it('should simulate typical dApp development workflow', async () => {
      // Simulate a developer building a cross-chain dApp

      // 1. Initialize development environment
      await devkit.start({ mining: true, waitForBlocks: 1 });

      // 2. Setup developer accounts
      const deployer = devkit.account(0);
      const user1 = devkit.account(1);
      const user2 = devkit.account(2);

      // 3. Fund accounts for testing
      await Promise.all([
        deployer.fundFromFaucet('10000000000000000000', 'core'),
        deployer.fundFromFaucet('10000000000000000000', 'evm'),
        user1.fundFromFaucet('5000000000000000000', 'core'),
        user1.fundFromFaucet('5000000000000000000', 'evm'),
        user2.fundFromFaucet('5000000000000000000', 'core'),
        user2.fundFromFaucet('5000000000000000000', 'evm'),
      ]);

      // 4. Deploy contracts to both chains (for cross-chain dApp)
      const contracts = await devkit.deployContract({
        abi: SIMPLE_STORAGE_ABI,
        bytecode: SIMPLE_STORAGE_BYTECODE,
        args: [0], // Start with 0
        account: 0,
        chains: ['core', 'evm'],
      });

      // 5. Test contract interactions from different users
      // User 1 interacts with Core Space
      await devkit.writeContract({
        address: contracts.core!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [100],
        account: 1,
        chain: 'core',
      });

      // User 2 interacts with eSpace
      await devkit.writeContract({
        address: contracts.evm!,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'set',
        args: [200],
        account: 2,
        chain: 'evm',
      });

      // 6. Mine blocks to confirm transactions
      await devkit.mine(2);

      // 7. Verify final state
      const [coreValue, evmValue] = await Promise.all([
        devkit.readContract({
          address: contracts.core!,
          abi: SIMPLE_STORAGE_ABI,
          functionName: 'get',
          args: [],
          chain: 'core',
        }),
        devkit.readContract({
          address: contracts.evm!,
          abi: SIMPLE_STORAGE_ABI,
          functionName: 'get',
          args: [],
          chain: 'evm',
        }),
      ]);

      expect(coreValue).toBe(100);
      expect(evmValue).toBe(200);

      // 8. Check that blocks were mined
      const miningStatus = devkit.getMiningStatus();
      expect(miningStatus.blocksMined).toBeGreaterThanOrEqual(3); // Initial + 2 additional

      // 9. Clean shutdown
      await devkit.stop();
    });
  });
});
