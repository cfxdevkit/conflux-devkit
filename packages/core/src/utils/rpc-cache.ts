// RPC Call Buffering and Caching System
// Prevents RPC flooding during UI re-renders while keeping state logic transparent

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Rate limiting configuration - focused on UI protection
interface RateLimitConfig {
  maxCallsPerSecond: number;
  maxCallsPerMethod: number;
  warningThreshold: number; // Percentage of max calls to trigger warning
  enabled: boolean; // Whether rate limiting is enabled
  uiProtectionMode: boolean; // Only protect against UI re-render flooding
}

// Call statistics for monitoring
interface CallStats {
  method: string;
  calls: number;
  lastCall: number;
  warnings: number;
}

// RPC Cache Manager
export class RpcCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private callStats = new Map<string, CallStats>();
  private callHistory: Array<{ method: string; timestamp: number }> = [];
  public config: RateLimitConfig;
  private warningCallbacks: Array<(message: string) => void> = [];

  // Expose cache for fallback access
  get cacheMap() {
    return this.cache;
  }

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxCallsPerSecond: 1, // 1 call per second as requested
      maxCallsPerMethod: 10, // Max 10 calls per method per minute
      warningThreshold: 0.8, // Warn at 80% of limit
      enabled: true, // Rate limiting enabled by default
      uiProtectionMode: true, // Focus on UI re-render protection
      ...config,
    };

    // Clean up old cache entries every 30 seconds
    setInterval(() => this.cleanup(), 30000);
  }

  /**
   * Add a warning callback
   */
  onWarning(callback: (message: string) => void): void {
    this.warningCallbacks.push(callback);
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Generate cache key for RPC call
   */
  generateKey(method: string, params: Record<string, unknown> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => {
        const value = params[key];
        // Handle BigInt serialization
        if (typeof value === 'bigint') {
          return `${key}:${value.toString()}`;
        }
        return `${key}:${JSON.stringify(value)}`;
      })
      .join('|');
    return `${method}:${sortedParams}`;
  }

  /**
   * Check if call is allowed based on rate limits
   * In UI protection mode, only prevents rapid successive calls (re-render flooding)
   */
  checkRateLimit(method: string): boolean {
    // Skip rate limiting if disabled
    if (!this.config.enabled) {
      return true;
    }

    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;

    // Clean old call history
    this.callHistory = this.callHistory.filter(
      (call) => call.timestamp > oneMinuteAgo
    );

    // In UI protection mode, be more lenient - only prevent rapid successive calls
    if (this.config.uiProtectionMode) {
      // Check for rapid successive calls (likely re-renders)
      const recentCalls = this.callHistory.filter(
        (call) => call.timestamp > oneSecondAgo
      );
      if (recentCalls.length >= this.config.maxCallsPerSecond) {
        // Only warn, don't block - let cache handle it
        this.emitWarning(
          `UI re-render detected: ${recentCalls.length} calls in the last second - using cached data`
        );
        return true; // Allow but will use cache
      }
    } else {
      // Strict rate limiting for non-UI mode
      const recentCalls = this.callHistory.filter(
        (call) => call.timestamp > oneSecondAgo
      );
      if (recentCalls.length >= this.config.maxCallsPerSecond) {
        this.emitWarning(
          `Rate limit exceeded: ${recentCalls.length} calls in the last second (max: ${this.config.maxCallsPerSecond})`
        );
        return false;
      }
    }

    // Check method-specific rate limit (more lenient in UI mode)
    const methodCalls = this.callHistory.filter(
      (call) => call.method === method && call.timestamp > oneMinuteAgo
    );
    const methodLimit = this.config.uiProtectionMode
      ? this.config.maxCallsPerMethod * 2
      : this.config.maxCallsPerMethod;

    if (methodCalls.length >= methodLimit) {
      this.emitWarning(
        `Method rate limit exceeded: ${methodCalls.length} calls to ${method} in the last minute (max: ${methodLimit})`
      );
      return !this.config.uiProtectionMode; // Block only in non-UI mode
    }

    // Check warning threshold
    const warningThreshold = Math.floor(
      methodLimit * this.config.warningThreshold
    );
    if (methodCalls.length >= warningThreshold) {
      this.emitWarning(
        `Approaching rate limit: ${methodCalls.length}/${methodLimit} calls to ${method} in the last minute`
      );
    }

    return true;
  }

  /**
   * Record a call for rate limiting
   */
  recordCall(method: string): void {
    const now = Date.now();
    this.callHistory.push({ method, timestamp: now });

    // Update method stats
    const stats = this.callStats.get(method) || {
      method,
      calls: 0,
      lastCall: 0,
      warnings: 0,
    };
    stats.calls++;
    stats.lastCall = now;
    this.callStats.set(method, stats);
  }

  /**
   * Emit warning to all registered callbacks
   */
  private emitWarning(message: string): void {
    this.warningCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('Warning callback error:', error);
      }
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get current statistics
   */
  getStats(): {
    cacheSize: number;
    methodStats: CallStats[];
    recentCalls: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCalls = this.callHistory.filter(
      (call) => call.timestamp > oneMinuteAgo
    ).length;

    return {
      cacheSize: this.cache.size,
      methodStats: Array.from(this.callStats.values()),
      recentCalls,
    };
  }

  /**
   * Clear all cache and statistics
   */
  clear(): void {
    this.cache.clear();
    this.callStats.clear();
    this.callHistory = [];
  }
}

// Global cache manager instance
export const rpcCache = new RpcCacheManager();

// RPC call wrapper with caching and rate limiting
// Transparent to state logic - only prevents UI re-render flooding
export async function cachedRpcCall<T>(
  method: string,
  params: Record<string, unknown> = {},
  rpcFunction: () => Promise<T>,
  ttlMs: number = 1000
): Promise<T> {
  const key = rpcCache.generateKey(method, params);

  // Check cache first - this is the main protection against re-render flooding
  const cached = rpcCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Check rate limit (more lenient in UI protection mode)
  if (!rpcCache.checkRateLimit(method)) {
    // In UI protection mode, fall back to cache or throw only if absolutely necessary
    if (rpcCache.config.uiProtectionMode) {
      // Try to get any cached version, even if expired
      const expiredCached = rpcCache.cacheMap.get(key);
      if (expiredCached) {
        console.warn(`Using expired cache for ${method} due to rate limiting`);
        return expiredCached.data as T;
      }
    }
    throw new Error(`Rate limit exceeded for method: ${method}`);
  }

  // Record the call
  rpcCache.recordCall(method);
  // Make the actual RPC call
  const result = await rpcFunction();

  // Cache the result
  rpcCache.set(key, result, ttlMs);

  return result;
}

// Specific RPC method wrappers with appropriate TTLs
export const rpcMethods = {
  // Block data - cache for 1 second
  getBlockNumber: (rpcFunction: () => Promise<bigint>) =>
    cachedRpcCall('getBlockNumber', {}, rpcFunction, 1000),

  getBlock: <T>(
    params: { blockNumber: bigint } | { blockTag: 'latest' },
    rpcFunction: () => Promise<T>
  ) => cachedRpcCall('getBlock', params, rpcFunction, 1000),

  // Balance data - cache for 2 seconds
  getBalance: (
    params: { address: string },
    rpcFunction: () => Promise<bigint>
  ) => cachedRpcCall('getBalance', params, rpcFunction, 2000),

  // Gas data - cache for 5 seconds
  getGasPrice: (rpcFunction: () => Promise<bigint>) =>
    cachedRpcCall('getGasPrice', {}, rpcFunction, 5000),

  estimateGas: (
    params: Record<string, unknown>,
    rpcFunction: () => Promise<bigint>
  ) => cachedRpcCall('estimateGas', params, rpcFunction, 5000),

  // Network data - cache for 10 seconds
  getNetworkId: (rpcFunction: () => Promise<number>) =>
    cachedRpcCall('getNetworkId', {}, rpcFunction, 10000),

  getChainId: (rpcFunction: () => Promise<number>) =>
    cachedRpcCall('getChainId', {}, rpcFunction, 10000),

  // Transaction data - cache for 1 second
  getTransactionReceipt: <T>(
    params: { hash: string },
    rpcFunction: () => Promise<T>
  ) => cachedRpcCall('getTransactionReceipt', params, rpcFunction, 1000),

  // Contract calls - cache for 2 seconds
  readContract: <T>(
    params: Record<string, unknown>,
    rpcFunction: () => Promise<T>
  ) => cachedRpcCall('readContract', params, rpcFunction, 2000),

  call: <T>(
    params: { to: string; data: string },
    rpcFunction: () => Promise<T>
  ) => cachedRpcCall('call', params, rpcFunction, 2000),
};

// Warning handler for console output
rpcCache.onWarning((message) => {
  console.warn(`🚨 RPC Rate Limit Warning: ${message}`);
});

// Export types
export type { CacheEntry, RateLimitConfig, CallStats };
