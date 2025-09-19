// EvmClient tests

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EvmClient } from '../../../src/rpc/EvmClient';
import {
  createMockNetworkConfig,
  createMockRpcResponse,
  createMockRpcError,
} from '../../helpers/test-utils';
import {
  MOCK_NETWORKS,
  MOCK_PRIVATE_KEYS,
  MOCK_ADDRESSES,
} from '../../helpers/mock-data';
import {
  expectValidEvmAddress,
  expectValidRpcResponse,
  expectValidRpcError,
} from '../../helpers/assertions';
import { rpcCache } from '@conflux-devkit/core';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn(),
  createWalletClient: vi.fn(),
  http: vi.fn(),
}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn(),
}));

// Mock network manager
vi.mock('../../../src/network', () => ({
  networkManager: {
    getNetwork: vi.fn(),
    getLocalNetwork: vi.fn(),
    getTestnetNetwork: vi.fn(),
    getMainnetNetwork: vi.fn(),
  },
}));

describe('EvmClient', () => {
  let mockPublicClient: any;
  let mockWalletClient: any;
  let mockNetworkManager: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Clear RPC cache to ensure fresh state for each test
    rpcCache.clear();

    // Mock public client
    mockPublicClient = {
      getBalance: vi.fn(),
      getBlockNumber: vi.fn(),
      getBlock: vi.fn(),
      getTransactionReceipt: vi.fn(),
      call: vi.fn(),
      getChainId: vi.fn(),
      getGasPrice: vi.fn(),
      readContract: vi.fn(),
      estimateGas: vi.fn(),
    };

    // Mock wallet client
    mockWalletClient = {
      sendTransaction: vi.fn(),
    };

    // Mock network manager
    mockNetworkManager = {
      getNetwork: vi.fn(),
      getLocalNetwork: vi.fn(),
      getTestnetNetwork: vi.fn(),
      getMainnetNetwork: vi.fn(),
    };

    // Setup viem mocks
    const { createPublicClient, createWalletClient, http } = await import(
      'viem'
    );
    const { privateKeyToAccount } = await import('viem/accounts');

    vi.mocked(createPublicClient).mockReturnValue(mockPublicClient);
    vi.mocked(createWalletClient).mockReturnValue(mockWalletClient);
    vi.mocked(http).mockReturnValue({} as any);
    vi.mocked(privateKeyToAccount).mockReturnValue({} as any);

    // Setup network manager mock
    const { networkManager } = await import('../../../src/network');
    Object.assign(networkManager, mockNetworkManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clear RPC cache after each test
    rpcCache.clear();
  });

  describe('Constructor', () => {
    it('should create client with network config', () => {
      const network = createMockNetworkConfig();
      const client = new EvmClient(network);

      expect(client).toBeDefined();
    });

    it('should create client with network config and private key', () => {
      const network = createMockNetworkConfig();
      const privateKey = MOCK_PRIVATE_KEYS.valid;
      const client = new EvmClient(network, privateKey);

      expect(client).toBeDefined();
    });
  });

  describe('Static Factory Methods', () => {
    beforeEach(() => {
      mockNetworkManager.getNetwork.mockReturnValue(MOCK_NETWORKS.mainnetEvm);
      mockNetworkManager.getLocalNetwork.mockReturnValue(
        MOCK_NETWORKS.localEvm
      );
      mockNetworkManager.getTestnetNetwork.mockReturnValue(
        MOCK_NETWORKS.testnetEvm
      );
      mockNetworkManager.getMainnetNetwork.mockReturnValue(
        MOCK_NETWORKS.mainnetEvm
      );
    });

    it('should create client from network ID', () => {
      const client = EvmClient.createFromNetworkId('mainnet-evm');

      expect(client).toBeDefined();
      expect(mockNetworkManager.getNetwork).toHaveBeenCalledWith('mainnet-evm');
    });

    it('should throw error for invalid network ID', () => {
      mockNetworkManager.getNetwork.mockReturnValue(null);

      expect(() => EvmClient.createFromNetworkId('invalid')).toThrow(
        'Network not found: invalid'
      );
    });

    it('should create local client', () => {
      const client = EvmClient.createLocal();

      expect(client).toBeDefined();
      expect(mockNetworkManager.getLocalNetwork).toHaveBeenCalledWith('evm');
    });

    it('should throw error if local network not found', () => {
      mockNetworkManager.getLocalNetwork.mockReturnValue(null);

      expect(() => EvmClient.createLocal()).toThrow(
        'EVM local network not found'
      );
    });

    it('should create testnet client', () => {
      const client = EvmClient.createTestnet();

      expect(client).toBeDefined();
      expect(mockNetworkManager.getTestnetNetwork).toHaveBeenCalledWith('evm');
    });

    it('should throw error if testnet network not found', () => {
      mockNetworkManager.getTestnetNetwork.mockReturnValue(null);

      expect(() => EvmClient.createTestnet()).toThrow(
        'EVM testnet network not found'
      );
    });

    it('should create mainnet client', () => {
      const client = EvmClient.createMainnet();

      expect(client).toBeDefined();
      expect(mockNetworkManager.getMainnetNetwork).toHaveBeenCalledWith('evm');
    });

    it('should throw error if mainnet network not found', () => {
      mockNetworkManager.getMainnetNetwork.mockReturnValue(null);

      expect(() => EvmClient.createMainnet()).toThrow(
        'EVM mainnet network not found'
      );
    });
  });

  describe('getBalance', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should get balance for valid EVM address', async () => {
      const address = MOCK_ADDRESSES.evm;
      const expectedBalance = 1000000000000000000n;

      mockPublicClient.getBalance.mockResolvedValue(expectedBalance);

      const result = await client.getBalance({ address });

      expect(result).toBe(expectedBalance);
      expect(mockPublicClient.getBalance).toHaveBeenCalledWith({
        address: address,
      });
    });

    it('should throw error for invalid address format', async () => {
      const address = MOCK_ADDRESSES.core; // Core address, not EVM

      await expect(client.getBalance({ address })).rejects.toThrow(
        'Invalid EVM address format'
      );
    });

    it('should handle RPC errors', async () => {
      const address = MOCK_ADDRESSES.evm;
      const error = new Error('RPC Error');

      mockPublicClient.getBalance.mockRejectedValue(error);

      await expect(client.getBalance({ address })).rejects.toThrow('RPC Error');
    });
  });

  describe('getBlockNumber', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should get current block number', async () => {
      const expectedBlockNumber = 12345n;

      mockPublicClient.getBlockNumber.mockResolvedValue(expectedBlockNumber);

      const result = await client.getBlockNumber();

      expect(result).toBe(expectedBlockNumber);
      expect(mockPublicClient.getBlockNumber).toHaveBeenCalled();
    });

    it('should handle RPC errors', async () => {
      const error = new Error('RPC Error');

      mockPublicClient.getBlockNumber.mockRejectedValue(error);

      await expect(client.getBlockNumber()).rejects.toThrow('RPC Error');
    });
  });

  describe('getBlock', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should get block by number', async () => {
      const blockNumber = 12345n;
      const mockBlock = {
        number: blockNumber,
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        parentHash:
          '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98',
        timestamp: 1640995200,
        gasLimit: 30000000n,
        gasUsed: 21000n,
        transactions: [],
      };

      mockPublicClient.getBlock.mockResolvedValue(mockBlock);

      const result = await client.getBlock({ blockNumber });

      expect(result).toBeDefined();
      expect(result.number).toBe(blockNumber);
      expect(result.hash).toBe(mockBlock.hash);
      expect(mockPublicClient.getBlock).toHaveBeenCalledWith({ blockNumber });
    });

    it('should get latest block', async () => {
      const mockBlock = {
        number: 12345n,
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        parentHash:
          '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98',
        timestamp: 1640995200,
        gasLimit: 30000000n,
        gasUsed: 21000n,
        transactions: [],
      };

      mockPublicClient.getBlock.mockResolvedValue(mockBlock);

      const result = await client.getBlock({ blockTag: 'latest' });

      expect(result).toBeDefined();
      expect(mockPublicClient.getBlock).toHaveBeenCalledWith({
        blockTag: 'latest',
      });
    });

    it('should handle RPC errors', async () => {
      const blockNumber = 12345n;
      const error = new Error('RPC Error');

      mockPublicClient.getBlock.mockRejectedValue(error);

      await expect(client.getBlock({ blockNumber })).rejects.toThrow(
        'RPC Error'
      );
    });
  });

  describe('getTransactionReceipt', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should get transaction receipt', async () => {
      const txHash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockReceipt = {
        transactionHash: txHash,
        blockNumber: 12345n,
        blockHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0x9876543210fedcba9876543210fedcba98765432',
        gasUsed: 21000n,
        status: 'success',
        contractAddress: null,
        transactionIndex: 0,
        effectiveGasPrice: 20000000000n,
        logs: [],
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt);

      const result = await client.getTransactionReceipt({ hash: txHash });

      expect(result).toBeDefined();
      expect(result?.transactionHash).toBe(txHash);
      expect(mockPublicClient.getTransactionReceipt).toHaveBeenCalledWith({
        hash: txHash,
      });
    });

    it('should return null for non-existent transaction', async () => {
      const txHash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      mockPublicClient.getTransactionReceipt.mockResolvedValue(null);

      const result = await client.getTransactionReceipt({ hash: txHash });

      expect(result).toBeNull();
    });

    it('should handle RPC errors', async () => {
      const txHash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const error = new Error('RPC Error');

      mockPublicClient.getTransactionReceipt.mockRejectedValue(error);

      await expect(
        client.getTransactionReceipt({ hash: txHash })
      ).rejects.toThrow('RPC Error');
    });
  });

  describe('call', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should make contract call', async () => {
      const to = MOCK_ADDRESSES.evm;
      const data =
        '0x70a082310000000000000000000000001234567890abcdef1234567890abcdef12345678';
      const expectedResult =
        '0x0000000000000000000000000000000000000000000000000000000000000064';

      mockPublicClient.call.mockResolvedValue({
        data: expectedResult,
        status: 'success',
      });

      const result = await client.call({ to, data });

      expect(result).toBe(expectedResult);
      expect(mockPublicClient.call).toHaveBeenCalledWith({ to, data });
    });

    it('should handle RPC errors', async () => {
      const to = MOCK_ADDRESSES.evm;
      const data =
        '0x70a082310000000000000000000000001234567890abcdef1234567890abcdef12345678';
      const error = new Error('RPC Error');

      mockPublicClient.call.mockRejectedValue(error);

      await expect(client.call({ to, data })).rejects.toThrow('RPC Error');
    });
  });

  describe('getNetworkId', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should get network ID', async () => {
      const expectedNetworkId = 2030;

      mockPublicClient.getChainId.mockResolvedValue(expectedNetworkId);

      const result = await client.getNetworkId();

      expect(result).toBe(expectedNetworkId);
      expect(mockPublicClient.getChainId).toHaveBeenCalled();
    });
  });

  describe('getGasPrice', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should get gas price', async () => {
      const expectedGasPrice = 20000000000n;

      mockPublicClient.getGasPrice.mockResolvedValue(expectedGasPrice);

      const result = await client.getGasPrice();

      expect(result).toBe(expectedGasPrice);
      expect(mockPublicClient.getGasPrice).toHaveBeenCalled();
    });
  });

  describe('readContract', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should read contract', async () => {
      const params = {
        address: MOCK_ADDRESSES.evm,
        abi: [],
        functionName: 'totalSupply',
        args: [],
      };
      const expectedResult = 1000000n;

      mockPublicClient.readContract.mockResolvedValue(expectedResult);

      const result = await client.readContract(params);

      expect(result).toBe(expectedResult);
      expect(mockPublicClient.readContract).toHaveBeenCalledWith(params);
    });
  });

  describe('estimateGas', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should estimate gas', async () => {
      const params = {
        to: MOCK_ADDRESSES.evm,
        value: 1000000000000000000n,
        data: '0x',
      };
      const expectedGas = 21000n;

      mockPublicClient.estimateGas.mockResolvedValue(expectedGas);

      const result = await client.estimateGas(params);

      expect(result).toBe(expectedGas);
      expect(mockPublicClient.estimateGas).toHaveBeenCalledWith({
        to: params.to,
        value: params.value || 0n,
        data: params.data || '0x',
      });
    });
  });

  describe('sendTransaction', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should throw error when wallet client not initialized', async () => {
      const params = {
        to: MOCK_ADDRESSES.evm,
        value: 1000000000000000000n,
        gas: 21000n,
        gasPrice: 20000000000n,
        nonce: 0,
      };

      await expect(client.sendTransaction(params)).rejects.toThrow(
        'Wallet client not initialized - private key required'
      );
    });
  });

  describe('writeContract', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should throw error for not implemented method', async () => {
      const params = {
        address: MOCK_ADDRESSES.evm,
        abi: [],
        functionName: 'transfer',
        args: [MOCK_ADDRESSES.evm, 1000n],
      };

      await expect(client.writeContract(params)).rejects.toThrow(
        'writeContract not implemented - use viem directly for now'
      );
    });
  });

  describe('getChainId', () => {
    let client: EvmClient;

    beforeEach(() => {
      const network = createMockNetworkConfig();
      client = new EvmClient(network);
    });

    it('should get chain ID', async () => {
      const expectedChainId = 2030;

      mockPublicClient.getChainId.mockResolvedValue(expectedChainId);

      const result = await client.getChainId();

      expect(result).toBe(expectedChainId);
      expect(mockPublicClient.getChainId).toHaveBeenCalled();
    });
  });
});
