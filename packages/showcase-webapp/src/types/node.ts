export interface NodeStatus {
  isRunning: boolean;
  isStarting: boolean;
  isStopping: boolean;
  uptime: number;
  blockHeight: number;
  peerCount: number;
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date | null;
  error: string | null;
  isLoading: boolean;
}