// API response types

// Unified API response pattern
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: Date;
  duration: number;
  version: string;
}

// Enhanced error hierarchy
export abstract class BaseApiError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseApiError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class AuthenticationError extends BaseApiError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
}

export class AuthorizationError extends BaseApiError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
}

export class NotFoundError extends BaseApiError {
  readonly code = 'NOT_FOUND_ERROR';
  readonly statusCode = 404;
}

export class ConflictError extends BaseApiError {
  readonly code = 'CONFLICT_ERROR';
  readonly statusCode = 409;
}

export class RateLimitError extends BaseApiError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly statusCode = 429;
}

export class InternalServerError extends BaseApiError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = 500;
}

export class ServiceUnavailableError extends BaseApiError {
  readonly code = 'SERVICE_UNAVAILABLE_ERROR';
  readonly statusCode = 503;
}

// Import types from other modules
import type { DeploymentResult, WalletInfo } from './blockchain';
import type { NodeStatus } from './node';

// Specific API response types
export interface NodeStatusResponse extends ApiResponse<NodeStatus> {}
export interface WalletListResponse extends ApiResponse<WalletInfo[]> {}
export interface DeploymentResponse extends ApiResponse<DeploymentResult> {}
export interface ContractCallResponse extends ApiResponse<ContractCallResult> {}

// Contract-specific types
export interface ContractCallResult {
  success: boolean;
  data?: unknown;
  result?: unknown;
  error?: string;
  transactionHash?: `0x${string}`;
  gasUsed?: bigint;
  blockNumber?: bigint;
  isMock?: boolean;
}

export interface ContractStatus {
  espace: {
    deployed: boolean;
    address?: `0x${string}`;
    isMock: boolean;
  };
  core: {
    deployed: boolean;
    address?: `0x${string}`;
    isMock: boolean;
  };
}

export interface NetworkInfo {
  espace: {
    chainId: number;
    blockNumber: bigint;
    gasPrice: bigint;
  };
  core: {
    networkId: number;
    epochNumber: bigint;
  };
}

// Service configuration types
export interface ContractServiceConfig {
  espaceRpcUrl: string;
  coreRpcUrl: string;
  privateKey: `0x${string}`;
  deploymentsPath: string;
}

// Counter-specific types (for demo contracts)
export interface CounterStatus {
  count: string;
  maxCount: string;
  address: `0x${string}`;
}

export interface CounterOperation {
  operation: string;
  value?: number;
  values?: number[];
  newCount: string;
}
