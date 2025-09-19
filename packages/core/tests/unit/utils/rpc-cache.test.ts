// RPC Cache System Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RpcCacheManager,
  rpcMethods,
  rpcCache,
} from '../../../src/utils/rpc-cache';
import { rpcMonitor } from '../../../src/utils/rpc-monitor';

describe('RPC Cache System', () => {
  let cacheManager: RpcCacheManager;
  let mockRpcFunction: vi.Mock;

  beforeEach(() => {
    cacheManager = new RpcCacheManager({
      maxCallsPerSecond: 10, // More lenient for tests
      maxCallsPerMethod: 100, // More lenient for tests
      warningThreshold: 0.8,
      enabled: false, // Disable rate limiting for tests
      uiProtectionMode: true, // UI protection mode
    });
    mockRpcFunction = vi.fn();
    vi.clearAllMocks();
    // Clear global cache between tests
    rpcCache.clear();
  });

  describe('RpcCacheManager', () => {
    it('should cache data with TTL', async () => {
      const key = 'test-key';
      const data = { result: 'test' };
      const ttl = 1000;

      cacheManager.set(key, data, ttl);
      const cached = cacheManager.get(key);

      expect(cached).toEqual(data);
    });

    it('should return null for expired cache entries', async () => {
      const key = 'test-key';
      const data = { result: 'test' };
      const ttl = 100; // Very short TTL

      cacheManager.set(key, data, ttl);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const cached = cacheManager.get(key);
      expect(cached).toBeNull();
    });

    it('should generate consistent cache keys', () => {
      const method = 'getBalance';
      const params1 = { address: '0x123', block: 'latest' };
      const params2 = { block: 'latest', address: '0x123' }; // Different order

      const key1 = cacheManager.generateKey(method, params1);
      const key2 = cacheManager.generateKey(method, params2);

      expect(key1).toBe(key2);
    });

    it('should enforce rate limits when enabled', async () => {
      // Create a cache manager with very restrictive rate limiting
      const rateLimitedCache = new RpcCacheManager({
        maxCallsPerSecond: 1,
        maxCallsPerMethod: 1,
        warningThreshold: 0.5,
        enabled: true, // Enable rate limiting
        uiProtectionMode: false, // Disable UI protection mode for strict testing
      });

      const method = 'testMethod';

      // First call should be allowed
      const allowed1 = rateLimitedCache.checkRateLimit(method);
      expect(allowed1).toBe(true);
      rateLimitedCache.recordCall(method);

      // Second call should be blocked (method limit exceeded)
      const allowed2 = rateLimitedCache.checkRateLimit(method);
      expect(allowed2).toBe(false);
    });

    it('should track call statistics', () => {
      const method = 'testMethod';

      // Record some calls
      for (let i = 0; i < 5; i++) {
        cacheManager.recordCall(method);
      }

      const stats = cacheManager.getStats();
      const methodStats = stats.methodStats.find(s => s.method === method);

      expect(methodStats).toBeDefined();
      expect(methodStats?.calls).toBe(5);
    });
  });

  describe('rpcMethods', () => {
    it('should cache getBlockNumber calls', async () => {
      const expectedResult = 12345n;
      mockRpcFunction.mockResolvedValue(expectedResult);

      // First call should hit the RPC
      const result1 = await rpcMethods.getBlockNumber(mockRpcFunction);
      expect(result1).toBe(expectedResult);
      expect(mockRpcFunction).toHaveBeenCalledTimes(1);

      // Second call should use cache (no delay needed with rate limiting disabled)
      const result2 = await rpcMethods.getBlockNumber(mockRpcFunction);
      expect(result2).toBe(expectedResult);
      expect(mockRpcFunction).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should cache getBalance calls with parameters', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const expectedResult = 1000000000000000000n;
      mockRpcFunction.mockResolvedValue(expectedResult);

      const params = { address };

      // First call
      const result1 = await rpcMethods.getBalance(params, mockRpcFunction);
      expect(result1).toBe(expectedResult);
      expect(mockRpcFunction).toHaveBeenCalledTimes(1);

      // Second call with same params should use cache
      const result2 = await rpcMethods.getBalance(params, mockRpcFunction);
      expect(result2).toBe(expectedResult);
      expect(mockRpcFunction).toHaveBeenCalledTimes(1);
    });

    it('should not cache different parameters', async () => {
      const address1 = '0x1234567890123456789012345678901234567890';
      const address2 = '0x0987654321098765432109876543210987654321';
      const result1 = 1000000000000000000n;
      const result2 = 2000000000000000000n;

      mockRpcFunction
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2);

      // First call
      const res1 = await rpcMethods.getBalance(
        { address: address1 },
        mockRpcFunction
      );
      expect(res1).toBe(result1);

      // Second call with different address should hit RPC again
      const res2 = await rpcMethods.getBalance(
        { address: address2 },
        mockRpcFunction
      );
      expect(res2).toBe(result2);

      expect(mockRpcFunction).toHaveBeenCalledTimes(2);
    });

    it('should handle RPC errors without caching', async () => {
      const error = new Error('RPC Error');
      const mockRpcFunctionError = vi.fn().mockRejectedValue(error);

      // First call should throw
      await expect(
        rpcMethods.getBlockNumber(mockRpcFunctionError)
      ).rejects.toThrow('RPC Error');

      // Second call should also throw (not cached)
      await expect(
        rpcMethods.getBlockNumber(mockRpcFunctionError)
      ).rejects.toThrow('RPC Error');

      expect(mockRpcFunctionError).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should block calls when rate limit exceeded', async () => {
      // Create a new cache manager with very restrictive limits
      const restrictiveCache = new RpcCacheManager({
        maxCallsPerSecond: 1,
        maxCallsPerMethod: 1,
        warningThreshold: 0.5,
        enabled: true, // Enable rate limiting
        uiProtectionMode: false, // Disable UI protection mode for strict testing
      });

      const method = 'testMethod';

      // First call should succeed
      const allowed1 = restrictiveCache.checkRateLimit(method);
      expect(allowed1).toBe(true);
      restrictiveCache.recordCall(method);

      // Second call should be blocked (method limit exceeded)
      const allowed2 = restrictiveCache.checkRateLimit(method);
      expect(allowed2).toBe(false);
    });

    it('should emit warnings when approaching limits', () => {
      // Create a cache manager with rate limiting enabled
      const warningCache = new RpcCacheManager({
        maxCallsPerSecond: 10,
        maxCallsPerMethod: 10,
        warningThreshold: 0.8,
        enabled: true, // Enable rate limiting
        uiProtectionMode: false, // Disable UI protection mode for strict testing
      });

      const warningCallback = vi.fn();
      warningCache.onWarning(warningCallback);

      // Simulate approaching the limit (80% of 10 calls = 8 calls)
      const method = 'testMethod';
      for (let i = 0; i < 8; i++) {
        // 80% of 10 calls
        warningCache.recordCall(method);
      }

      // This should trigger a warning
      warningCache.checkRateLimit(method);

      expect(warningCallback).toHaveBeenCalled();
    });
  });

  describe('Global Cache Instance', () => {
    it('should work with global rpcCache instance', async () => {
      const key = 'global-test';
      const data = { global: 'data' };

      rpcCache.set(key, data, 1000);
      const cached = rpcCache.get(key);

      expect(cached).toEqual(data);
    });
  });
});

describe('RPC Monitor', () => {
  beforeEach(() => {
    rpcMonitor.reset();
  });

  it('should track performance metrics', () => {
    const metrics = rpcMonitor.getMetrics();

    expect(metrics.performance).toHaveProperty('totalCalls');
    expect(metrics.performance).toHaveProperty('cacheHitRate');
    expect(metrics.performance).toHaveProperty('cacheMissRate');
    expect(metrics.rateLimiting).toHaveProperty('methodStats');
  });

  it('should provide recommendations', () => {
    const recommendations = rpcMonitor.getRecommendations();

    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should generate reports', () => {
    const report = rpcMonitor.getReport();

    expect(typeof report).toBe('string');
    expect(report).toContain('RPC Usage Report');
  });
});
