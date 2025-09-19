export interface OperationLog {
  id: string;
  timestamp: Date;
  category: 'node' | 'hardhat' | 'wallet' | 'network' | 'contract' | 'general';
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  source: string;
  userId?: string;
  sessionId?: string;
}

export type LogFilter =
  | 'all'
  | 'node'
  | 'hardhat'
  | 'wallet'
  | 'network'
  | 'contract'
  | 'general';