// Simple RpcManager tests

import { describe, it, expect } from 'vitest';
import { RpcManager } from '../../../src/rpc/RpcManager';
import { createMockNetworkConfig } from '../../helpers/test-utils';

describe('RpcManager - Simple Tests', () => {
  describe('Constructor', () => {
    it('should create RpcManager instance', () => {
      const rpcManager = new RpcManager();

      expect(rpcManager).toBeDefined();
    });

    it('should start with uninitialized clients', () => {
      const rpcManager = new RpcManager();

      expect(rpcManager.isInitialized()).toBe(false);
    });
  });

  describe('Instance Methods', () => {
    let rpcManager: RpcManager;

    beforeEach(() => {
      rpcManager = new RpcManager();
    });

    it('should have initializeClients method', () => {
      expect(typeof rpcManager.initializeClients).toBe('function');
    });

    it('should have getEvmClient method', () => {
      expect(typeof rpcManager.getEvmClient).toBe('function');
    });

    it('should have getCoreClient method', () => {
      expect(typeof rpcManager.getCoreClient).toBe('function');
    });

    it('should have isInitialized method', () => {
      expect(typeof rpcManager.isInitialized).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(typeof rpcManager.disconnect).toBe('function');
    });
  });

  describe('Error Handling', () => {
    let rpcManager: RpcManager;

    beforeEach(() => {
      rpcManager = new RpcManager();
    });

    it('should throw error when getting EVM client before initialization', () => {
      expect(() => rpcManager.getEvmClient()).toThrow(
        'EVM client not initialized'
      );
    });

    it('should throw error when getting Core client before initialization', () => {
      expect(() => rpcManager.getCoreClient()).toThrow(
        'Core client not initialized'
      );
    });
  });

  describe('Disconnect', () => {
    it('should handle disconnect when clients are not initialized', () => {
      const rpcManager = new RpcManager();

      expect(() => rpcManager.disconnect()).not.toThrow();
      expect(rpcManager.isInitialized()).toBe(false);
    });
  });
});
