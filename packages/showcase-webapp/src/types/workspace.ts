export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface WorkspaceStatus {
  apiServer: ServiceStatus;
  stateServer: ServiceStatus;
  websocket: ServiceStatus;
  database: ServiceStatus;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  isLoading: boolean;
}