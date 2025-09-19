// RPC Usage Monitoring and Alerting System
// Provides real-time monitoring of RPC call patterns and rate limiting

import { type CallStats, rpcCache } from './rpc-cache';

export interface RpcMonitorConfig {
  enableConsoleWarnings: boolean;
  enablePerformanceMetrics: boolean;
  warningThreshold: number; // Percentage of rate limit to trigger warning
  criticalThreshold: number; // Percentage of rate limit to trigger critical warning
}

export class RpcMonitor {
  private config: RpcMonitorConfig;
  private metrics: {
    totalCalls: number;
    cacheHits: number;
    cacheMisses: number;
    rateLimitBlocks: number;
    warnings: number;
    criticalWarnings: number;
  } = {
    totalCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    rateLimitBlocks: 0,
    warnings: 0,
    criticalWarnings: 0,
  };

  constructor(config: Partial<RpcMonitorConfig> = {}) {
    this.config = {
      enableConsoleWarnings: true,
      enablePerformanceMetrics: true,
      warningThreshold: 0.8, // 80% of rate limit
      criticalThreshold: 0.95, // 95% of rate limit
      ...config,
    };

    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    // Monitor cache performance
    const originalGet = rpcCache.get.bind(rpcCache);
    const originalSet = rpcCache.set.bind(rpcCache);

    rpcCache.get = <T>(key: string): T | null => {
      const result = originalGet<T>(key);
      if (result !== null) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
      return result;
    };

    rpcCache.set = (key: string, data: unknown, ttl: number) => {
      this.metrics.totalCalls++;
      return originalSet(key, data, ttl);
    };

    // Monitor rate limiting
    rpcCache.onWarning((message) => {
      this.metrics.warnings++;
      if (this.config.enableConsoleWarnings) {
        console.warn(`🚨 RPC Warning: ${message}`);
      }
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): {
    performance: {
      totalCalls: number;
      cacheHitRate: number;
      cacheMissRate: number;
      rateLimitBlocks: number;
      warnings: number;
      criticalWarnings: number;
    };
    rateLimiting: {
      methodStats: CallStats[];
      recentCalls: number;
      cacheSize: number;
    };
  } {
    const stats = rpcCache.getStats();
    const totalCalls = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      totalCalls > 0 ? this.metrics.cacheHits / totalCalls : 0;
    const cacheMissRate =
      totalCalls > 0 ? this.metrics.cacheMisses / totalCalls : 0;

    return {
      performance: {
        totalCalls: this.metrics.totalCalls,
        cacheHitRate,
        cacheMissRate,
        rateLimitBlocks: this.metrics.rateLimitBlocks,
        warnings: this.metrics.warnings,
        criticalWarnings: this.metrics.criticalWarnings,
      },
      rateLimiting: {
        methodStats: stats.methodStats,
        recentCalls: stats.recentCalls,
        cacheSize: stats.cacheSize,
      },
    };
  }

  /**
   * Get method-specific statistics
   */
  getMethodStats(method: string): CallStats | null {
    const stats = rpcCache.getStats();
    return stats.methodStats.find((s) => s.method === method) || null;
  }

  /**
   * Check if a method is approaching rate limits
   */
  isMethodNearLimit(method: string): boolean {
    const methodStats = this.getMethodStats(method);
    if (!methodStats) return false;

    const now = Date.now();
    const _oneMinuteAgo = now - 60000;
    const recentCalls = methodStats.calls;

    // Assuming max 10 calls per method per minute (from RpcCacheManager default)
    const maxCallsPerMethod = 10;
    const threshold = maxCallsPerMethod * this.config.warningThreshold;

    return recentCalls >= threshold;
  }

  /**
   * Get a summary report of RPC usage
   */
  getReport(): string {
    const metrics = this.getMetrics();
    const { performance, rateLimiting } = metrics;

    const report = [
      '📊 RPC Usage Report',
      '==================',
      `Total Calls: ${performance.totalCalls}`,
      `Cache Hit Rate: ${(performance.cacheHitRate * 100).toFixed(1)}%`,
      `Cache Miss Rate: ${(performance.cacheMissRate * 100).toFixed(1)}%`,
      `Rate Limit Blocks: ${performance.rateLimitBlocks}`,
      `Warnings: ${performance.warnings}`,
      `Critical Warnings: ${performance.criticalWarnings}`,
      '',
      '📈 Method Statistics:',
      ...rateLimiting.methodStats.map(
        (stat) =>
          `  ${stat.method}: ${stat.calls} calls, last: ${new Date(stat.lastCall).toLocaleTimeString()}`
      ),
      '',
      `Recent Calls (last minute): ${rateLimiting.recentCalls}`,
      `Cache Size: ${rateLimiting.cacheSize} entries`,
    ];

    return report.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitBlocks: 0,
      warnings: 0,
      criticalWarnings: 0,
    };
    rpcCache.clear();
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting(intervalMs: number = 60000): void {
    setInterval(() => {
      if (this.config.enableConsoleWarnings) {
        console.log(this.getReport());
      }
    }, intervalMs);
  }

  /**
   * Check for potential issues and provide recommendations
   */
  getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    // Check cache hit rate
    if (metrics.performance.cacheHitRate < 0.5) {
      recommendations.push(
        '⚠️ Low cache hit rate - consider increasing TTL for frequently called methods'
      );
    }

    // Check for high warning count
    if (metrics.performance.warnings > 10) {
      recommendations.push(
        '🚨 High warning count - consider implementing request batching or reducing call frequency'
      );
    }

    // Check for methods near rate limit
    const nearLimitMethods = metrics.rateLimiting.methodStats.filter((stat) =>
      this.isMethodNearLimit(stat.method)
    );
    if (nearLimitMethods.length > 0) {
      recommendations.push(
        `⚠️ Methods approaching rate limit: ${nearLimitMethods.map((s) => s.method).join(', ')}`
      );
    }

    // Check cache size
    if (metrics.rateLimiting.cacheSize > 1000) {
      recommendations.push(
        '💾 Large cache size - consider reducing TTL or implementing cache eviction'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ RPC usage looks healthy');
    }

    return recommendations;
  }
}

// Global monitor instance
export const rpcMonitor = new RpcMonitor();

// Auto-start monitoring in development (disabled for showcase)
// if (process.env.NODE_ENV === 'development') {
//   rpcMonitor.startPeriodicReporting(30000); // Report every 30 seconds in dev
// }
