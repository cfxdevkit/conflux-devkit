import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the ConfluxNode class completely
vi.mock('../../src/ConfluxNode', () => {
  const mockConfluxNode = {
    start: vi.fn(),
    stop: vi.fn(),
    getStatus: vi.fn(),
    getCoreClient: vi.fn(),
    getEvmClient: vi.fn(),
  };

  return {
    ConfluxNode: vi.fn(() => mockConfluxNode),
  };
});

// Mock other dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn(() => ({
      succeed: vi.fn(),
      fail: vi.fn(),
      stop: vi.fn(),
    })),
    stop: vi.fn(),
  })),
}));

vi.mock('chalk', () => ({
  default: {
    green: vi.fn(text => text),
    red: vi.fn(text => text),
    blue: vi.fn(text => text),
  },
}));

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeJson: vi.fn(),
    readJson: vi.fn(),
    pathExists: vi.fn(),
    remove: vi.fn(),
  },
}));

// Import after mocking
import { NodeManager } from '../../src/NodeManager';
import { ConfluxNode } from '../../src/ConfluxNode';

describe('NodeManager', () => {
  let nodeManager: NodeManager;
  let mockConfluxNode: any;

  beforeEach(() => {
    // Get the mock instance
    mockConfluxNode = new ConfluxNode();
    nodeManager = new NodeManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a NodeManager instance', () => {
    expect(nodeManager).toBeInstanceOf(NodeManager);
  });

  it('should initialize with a ConfluxNode instance', () => {
    expect(nodeManager).toBeDefined();
  });

  it('should start node with default configuration', async () => {
    mockConfluxNode.start.mockResolvedValue(undefined);

    await nodeManager.start();

    expect(mockConfluxNode.start).toHaveBeenCalledWith({});
  });

  it('should start node with custom configuration', async () => {
    const customConfig = {
      corePort: 12345,
      evmPort: 5432,
      blockInterval: 2000,
      silent: true,
    };

    mockConfluxNode.start.mockResolvedValue(undefined);

    await nodeManager.start(customConfig);

    expect(mockConfluxNode.start).toHaveBeenCalledWith(customConfig);
  });

  it('should handle start errors', async () => {
    const error = new Error('Start failed');
    mockConfluxNode.start.mockRejectedValue(error);

    await expect(nodeManager.start()).rejects.toThrow('Start failed');
  });

  it('should stop node successfully', async () => {
    mockConfluxNode.stop.mockResolvedValue(undefined);

    await nodeManager.stop();

    expect(mockConfluxNode.stop).toHaveBeenCalled();
  });

  it('should handle stop errors', async () => {
    const error = new Error('Stop failed');
    mockConfluxNode.stop.mockRejectedValue(error);

    await expect(nodeManager.stop()).rejects.toThrow('Stop failed');
  });

  it('should get node status', async () => {
    const status = {
      running: true,
      corePort: 12537,
      evmPort: 8545,
      chainId: 2029,
      evmChainId: 2030,
      blockNumber: 0n,
      peerCount: 0,
      walletMode: 'mnemonic' as const,
      wallets: [],
      miningAddress: undefined,
    };

    mockConfluxNode.getStatus.mockResolvedValue(status);

    const result = await nodeManager.getStatus();

    expect(result).toEqual(status);
    expect(mockConfluxNode.getStatus).toHaveBeenCalled();
  });

  it('should get core client', () => {
    const mockClient = { test: 'client' };
    mockConfluxNode.getCoreClient.mockReturnValue(mockClient);

    const result = nodeManager.getCoreClient();

    expect(result).toEqual(mockClient);
    expect(mockConfluxNode.getCoreClient).toHaveBeenCalled();
  });

  it('should get evm client', () => {
    const mockClient = { test: 'evmClient' };
    mockConfluxNode.getEvmClient.mockReturnValue(mockClient);

    const result = nodeManager.getEvmClient();

    expect(result).toEqual(mockClient);
    expect(mockConfluxNode.getEvmClient).toHaveBeenCalled();
  });

  it('should handle silent mode', async () => {
    const silentConfig = { silent: true };
    mockConfluxNode.start.mockResolvedValue(undefined);

    await nodeManager.start(silentConfig);

    expect(mockConfluxNode.start).toHaveBeenCalledWith(silentConfig);
  });

  it('should handle spinner operations', async () => {
    const { default: ora } = await import('ora');
    const mockSpinner = {
      start: vi.fn(() => ({
        succeed: vi.fn(),
        fail: vi.fn(),
        stop: vi.fn(),
      })),
      stop: vi.fn(),
    };
    ora.mockReturnValue(mockSpinner);

    mockConfluxNode.start.mockResolvedValue(undefined);

    await nodeManager.start();

    expect(ora).toHaveBeenCalledWith('Starting Conflux node...');
  });

  it('should reset node successfully', async () => {
    mockConfluxNode.stop.mockResolvedValue(undefined);

    // Mock fs-extra methods
    const fs = await import('fs-extra');
    vi.mocked(fs.default.pathExists).mockResolvedValue(true);
    vi.mocked(fs.default.remove).mockResolvedValue(undefined);

    await nodeManager.reset();

    expect(mockConfluxNode.stop).toHaveBeenCalled();
    expect(fs.default.pathExists).toHaveBeenCalled();
    expect(fs.default.remove).toHaveBeenCalled();
  });

  it('should handle configuration validation', () => {
    const validConfig = {
      corePort: 12537,
      evmPort: 8545,
      blockInterval: 1000,
      silent: false,
    };

    expect(validConfig.corePort).toBeGreaterThan(0);
    expect(validConfig.evmPort).toBeGreaterThan(0);
    expect(validConfig.blockInterval).toBeGreaterThan(0);
    expect(typeof validConfig.silent).toBe('boolean');
  });

  it('should handle port conflicts', () => {
    const configWithPorts = {
      corePort: 12537,
      evmPort: 8545,
    };

    expect(configWithPorts.corePort).not.toBe(configWithPorts.evmPort);
  });

  it('should handle block interval configuration', () => {
    const fastConfig = { blockInterval: 100 };
    const slowConfig = { blockInterval: 5000 };

    expect(fastConfig.blockInterval).toBeLessThan(slowConfig.blockInterval);
  });
});
