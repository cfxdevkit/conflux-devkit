// API response utilities and helpers

import type { ApiError, ApiResponse, ResponseMeta } from '../types/api';
import {
  AuthenticationError,
  AuthorizationError,
  BaseApiError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
} from '../types/api';

// Response builders
export function createApiResponse<T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function createApiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date(),
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  requestId?: string,
  duration?: number,
  version?: string
): ApiResponse<T> {
  return createApiResponse(data, {
    requestId: requestId || generateRequestId(),
    timestamp: new Date(),
    duration: duration || 0,
    version: version || '1.0.0',
  });
}

export function createErrorResponse(
  error: ApiError,
  requestId?: string,
  duration?: number,
  version?: string
): ApiResponse<never> {
  return {
    success: false,
    error,
    meta: {
      requestId: requestId || generateRequestId(),
      timestamp: new Date(),
      duration: duration || 0,
      version: version || '1.0.0',
    },
  };
}

// Error builders
export function createValidationError(
  message: string,
  field?: string,
  value?: unknown,
  context?: Record<string, unknown>
): ApiResponse<never> {
  const error = new ValidationError(message, { field, value, ...context });
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

export function createAuthenticationError(
  message: string = 'Authentication required',
  context?: Record<string, unknown>
): ApiResponse<never> {
  const error = new AuthenticationError(message, context);
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

export function createAuthorizationError(
  message: string = 'Insufficient permissions',
  context?: Record<string, unknown>
): ApiResponse<never> {
  const error = new AuthorizationError(message, context);
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

export function createNotFoundError(
  resource: string,
  identifier?: string,
  context?: Record<string, unknown>
): ApiResponse<never> {
  const message = identifier
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;
  const error = new NotFoundError(message, {
    resource,
    identifier,
    ...context,
  });
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

export function createConflictError(
  message: string,
  context?: Record<string, unknown>
): ApiResponse<never> {
  const error = new ConflictError(message, context);
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

export function createRateLimitError(
  message: string = 'Rate limit exceeded',
  retryAfter?: number,
  context?: Record<string, unknown>
): ApiResponse<never> {
  const error = new RateLimitError(message, { retryAfter, ...context });
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

export function createInternalServerError(
  message: string = 'Internal server error',
  context?: Record<string, unknown>
): ApiResponse<never> {
  const error = new InternalServerError(message, context);
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

export function createServiceUnavailableError(
  message: string = 'Service temporarily unavailable',
  context?: Record<string, unknown>
): ApiResponse<never> {
  const error = new ServiceUnavailableError(message, context);
  return createErrorResponse({
    code: error.code,
    message: error.message,
    details: error.context,
    timestamp: error.timestamp,
  });
}

// Type guards
export function isApiResponse<T>(
  response: unknown
): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as Record<string, unknown>).success === 'boolean'
  );
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false; error: ApiError } {
  return response.success === false && response.error !== undefined;
}

// Utility functions
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createResponseMeta(
  requestId?: string,
  duration?: number,
  version?: string
): ResponseMeta {
  return {
    requestId: requestId || generateRequestId(),
    timestamp: new Date(),
    duration: duration || 0,
    version: version || '1.0.0',
  };
}

// Response validation
export function validateApiResponse<T>(response: unknown): ApiResponse<T> {
  if (!isApiResponse<T>(response)) {
    throw new ValidationError('Invalid API response format');
  }
  return response;
}

// Error handling utilities
export function handleApiError(error: unknown): ApiResponse<never> {
  if (error instanceof BaseApiError) {
    return createErrorResponse({
      code: error.code,
      message: error.message,
      details: error.context,
      timestamp: error.timestamp,
    });
  }

  if (error instanceof Error) {
    return createInternalServerError(error.message, {
      stack: error.stack,
      name: error.name,
    });
  }

  return createInternalServerError('Unknown error occurred', {
    error: String(error),
  });
}

// Response transformation utilities
export function transformResponse<T, U>(
  response: ApiResponse<T>,
  transformer: (data: T) => U
): ApiResponse<U> {
  if (isSuccessResponse(response)) {
    return {
      ...response,
      data: transformer(response.data),
    };
  }
  return response as unknown as ApiResponse<U>;
}

export function mapResponse<T, U>(
  response: ApiResponse<T[]>,
  mapper: (item: T, index: number) => U
): ApiResponse<U[]> {
  if (isSuccessResponse(response)) {
    return {
      ...response,
      data: response.data.map(mapper),
    };
  }
  return response as unknown as ApiResponse<U[]>;
}

export function filterResponse<T>(
  response: ApiResponse<T[]>,
  predicate: (item: T, index: number) => boolean
): ApiResponse<T[]> {
  if (isSuccessResponse(response)) {
    return {
      ...response,
      data: response.data.filter(predicate),
    };
  }
  return response;
}

// Pagination utilities
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  meta?: Omit<ResponseMeta, 'requestId' | 'timestamp' | 'duration' | 'version'>
): ApiResponse<T[]> & { meta: ResponseMeta & { pagination: PaginationMeta } } {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date(),
      duration: 0,
      version: '1.0.0',
      ...meta,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  };
}

// Health check utilities
export interface HealthCheckData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: Record<
    string,
    {
      status: 'healthy' | 'unhealthy' | 'degraded';
      uptime: number;
      lastCheck: Date;
    }
  >;
  uptime: number;
  version: string;
  timestamp: Date;
}

export function createHealthCheckResponse(
  data: HealthCheckData,
  meta?: Partial<ResponseMeta>
): ApiResponse<HealthCheckData> {
  return createSuccessResponse(
    data,
    meta?.requestId,
    meta?.duration,
    meta?.version
  );
}
