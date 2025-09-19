import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import type { NodeStatus } from '../types/node';

export function useNodeStatus() {
  const [status, setStatus] = useState<NodeStatus>({
    isRunning: false,
    isStarting: false,
    isStopping: false,
    uptime: 0,
    blockHeight: 0,
    peerCount: 0,
    health: 'unhealthy',
    lastHealthCheck: new Date(),
    error: null,
    isLoading: true
  });

  const [isOperationLoading, setIsOperationLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const nodeStatus = await apiClient.getNodeStatus();
      setStatus(prev => ({
        ...nodeStatus,
        isStarting: nodeStatus.isRunning ? false : prev.isStarting,
        isStopping: !nodeStatus.isRunning ? false : prev.isStopping,
        error: null,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to fetch node status:', error);
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        health: 'unhealthy',
        lastHealthCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, []);

  const startNode = useCallback(async (config?: any) => {
    setIsOperationLoading(true);
    setStatus(prev => ({ ...prev, isStarting: true }));
    try {
      await apiClient.startNode(config);
      await fetchStatus(); // Refresh status after operation
    } catch (error) {
      console.error('Failed to start node:', error);
      setStatus(prev => ({ ...prev, isStarting: false }));
      throw error;
    } finally {
      setIsOperationLoading(false);
    }
  }, [fetchStatus]);

  const stopNode = useCallback(async () => {
    setIsOperationLoading(true);
    setStatus(prev => ({ ...prev, isStopping: true }));
    try {
      await apiClient.stopNode();
      await fetchStatus(); // Refresh status after operation
    } catch (error) {
      console.error('Failed to stop node:', error);
      setStatus(prev => ({ ...prev, isStopping: false }));
      throw error;
    } finally {
      setIsOperationLoading(false);
    }
  }, [fetchStatus]);

  const restartNode = useCallback(async (config?: any) => {
    setIsOperationLoading(true);
    setStatus(prev => ({ ...prev, isStopping: true, isStarting: false }));
    try {
      await apiClient.restartNode(config);
      await fetchStatus(); // Refresh status after operation
    } catch (error) {
      console.error('Failed to restart node:', error);
      setStatus(prev => ({ ...prev, isStopping: false, isStarting: false }));
      throw error;
    } finally {
      setIsOperationLoading(false);
    }
  }, [fetchStatus]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();

    // Set up periodic refresh every 10 seconds for node status
    const interval = setInterval(fetchStatus, 10000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status,
    startNode,
    stopNode,
    restartNode,
    refreshStatus: fetchStatus,
    isLoading: status.isLoading,
    isOperationLoading
  };
}