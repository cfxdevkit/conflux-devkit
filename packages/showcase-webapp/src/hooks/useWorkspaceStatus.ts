import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import type { WorkspaceStatus } from '../types/workspace';

export function useWorkspaceStatus() {
  const [status, setStatus] = useState<WorkspaceStatus>({
    apiServer: 'unknown',
    stateServer: 'unknown',
    websocket: 'unknown',
    database: 'unknown',
    overallStatus: 'unhealthy',
    lastCheck: new Date(),
    isLoading: true
  });

  const fetchStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      const healthStatus = await apiClient.getHealthStatus();
      setStatus({
        ...healthStatus,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch workspace status:', error);
      // Set to unhealthy status if API call fails
      setStatus({
        apiServer: 'unhealthy',
        stateServer: 'unhealthy',
        websocket: 'unhealthy',
        database: 'unhealthy',
        overallStatus: 'unhealthy',
        lastCheck: new Date(),
        isLoading: false
      });
    }
  }, []);

  const refreshStatus = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status,
    refreshStatus,
    isLoading: status.isLoading
  };
}