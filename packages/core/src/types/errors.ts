// Comprehensive error type system

export abstract class BaseError extends Error {
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

export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class NetworkError extends BaseError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 503;
}

export class WalletError extends BaseError {
  readonly code = 'WALLET_ERROR';
  readonly statusCode = 400;
}

export class ContractError extends BaseError {
  readonly code = 'CONTRACT_ERROR';
  readonly statusCode = 400;
}

export class NodeError extends BaseError {
  readonly code = 'NODE_ERROR';
  readonly statusCode = 500;
}

export class DeploymentError extends BaseError {
  readonly code = 'DEPLOYMENT_ERROR';
  readonly statusCode = 500;
}

export class ConfigurationError extends BaseError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 400;
}

export class AuthenticationError extends BaseError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
}

export class AuthorizationError extends BaseError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
}

export class NotFoundError extends BaseError {
  readonly code = 'NOT_FOUND_ERROR';
  readonly statusCode = 404;
}

export class ConflictError extends BaseError {
  readonly code = 'CONFLICT_ERROR';
  readonly statusCode = 409;
}

export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly statusCode = 429;
}

export class InternalError extends BaseError {
  readonly code = 'INTERNAL_ERROR';
  readonly statusCode = 500;
}

// Union type for all DevKit errors
export type DevKitError =
  | ValidationError
  | NetworkError
  | WalletError
  | ContractError
  | NodeError
  | DeploymentError
  | ConfigurationError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | RateLimitError
  | InternalError;

// Error factory functions
export function createValidationError(
  message: string,
  context?: Record<string, unknown>
): ValidationError {
  return new ValidationError(message, context);
}

export function createNetworkError(
  message: string,
  context?: Record<string, unknown>
): NetworkError {
  return new NetworkError(message, context);
}

export function createWalletError(
  message: string,
  context?: Record<string, unknown>
): WalletError {
  return new WalletError(message, context);
}

export function createContractError(
  message: string,
  context?: Record<string, unknown>
): ContractError {
  return new ContractError(message, context);
}

export function createNodeError(
  message: string,
  context?: Record<string, unknown>
): NodeError {
  return new NodeError(message, context);
}

export function createDeploymentError(
  message: string,
  context?: Record<string, unknown>
): DeploymentError {
  return new DeploymentError(message, context);
}

export function createConfigurationError(
  message: string,
  context?: Record<string, unknown>
): ConfigurationError {
  return new ConfigurationError(message, context);
}

export function createNotFoundError(
  message: string,
  context?: Record<string, unknown>
): NotFoundError {
  return new NotFoundError(message, context);
}

export function createInternalError(
  message: string,
  context?: Record<string, unknown>
): InternalError {
  return new InternalError(message, context);
}
