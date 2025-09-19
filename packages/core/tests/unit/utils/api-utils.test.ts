// API utilities tests

import { describe, it, expect } from 'vitest';
import {
  createApiResponse,
  createApiError,
  createSuccessResponse,
  createErrorResponse,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createInternalServerError,
  createServiceUnavailableError,
  isApiResponse,
  isApiError,
  isSuccessResponse,
  isErrorResponse,
  generateRequestId,
  createResponseMeta,
  validateApiResponse,
  handleApiError,
  transformResponse,
  mapResponse,
  filterResponse,
  createPaginatedResponse,
  createHealthCheckResponse,
} from '../../../src/utils/api-utils';
import { MOCK_API_RESPONSES } from '../../helpers/mock-data';
import {
  expectSuccessResponse,
  expectErrorResponse,
  expectValidTimestamp,
} from '../../helpers/assertions';

describe('API Utilities', () => {
  describe('createApiResponse', () => {
    it('should create success response with data only', () => {
      const data = { message: 'success', value: 42 };
      const response = createApiResponse(data);

      expect(response).toEqual({
        success: true,
        data: { message: 'success', value: 42 },
        meta: undefined,
      });

      expectSuccessResponse(response);
    });

    it('should create success response with metadata', () => {
      const data = { message: 'success' };
      const meta = {
        requestId: 'req-123',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        duration: 150,
        version: '1.0.0',
      };
      const response = createApiResponse(data, meta);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta).toEqual(meta);
    });

    it('should handle null data', () => {
      const response = createApiResponse(null);
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('should handle undefined data', () => {
      const response = createApiResponse(undefined);
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
    });

    it('should handle complex data structures', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
        },
      };
      const response = createApiResponse(data);

      expect(response.data).toEqual(data);
    });
  });

  describe('createApiError', () => {
    it('should create error response with code and message', () => {
      const response = createApiError('VALIDATION_ERROR', 'Invalid input data');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect(response.error?.message).toBe('Invalid input data');
      expect(response.error?.timestamp).toBeInstanceOf(Date);
      expectValidTimestamp(response.error?.timestamp);

      expectErrorResponse(response);
    });

    it('should create error response with details', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const response = createApiError(
        'VALIDATION_ERROR',
        'Invalid input data',
        details
      );

      expect(response.error?.details).toEqual(details);
    });

    it('should handle empty details', () => {
      const response = createApiError('ERROR', 'Test error', {});
      expect(response.error?.details).toEqual({});
    });

    it('should handle null details', () => {
      const response = createApiError('ERROR', 'Test error', null);
      expect(response.error?.details).toBeNull();
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with all metadata', () => {
      const data = { message: 'success' };
      const requestId = 'req-123';
      const duration = 150;
      const version = '1.0.0';

      const response = createSuccessResponse(
        data,
        requestId,
        duration,
        version
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta?.requestId).toBe(requestId);
      expect(response.meta?.duration).toBe(duration);
      expect(response.meta?.version).toBe(version);
      expectValidTimestamp(response.meta?.timestamp);
    });

    it('should create success response with minimal metadata', () => {
      const data = { message: 'success' };
      const response = createSuccessResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta).toBeDefined();
      expect(response.meta?.requestId).toBeDefined();
      expect(response.meta?.timestamp).toBeInstanceOf(Date);
      expect(response.meta?.duration).toBe(0);
      expect(response.meta?.version).toBe('1.0.0');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with all metadata', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: { field: 'email' },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };
      const requestId = 'req-123';
      const duration = 150;
      const version = '1.0.0';

      const response = createErrorResponse(error, requestId, duration, version);

      expect(response.success).toBe(false);
      expect(response.error).toEqual(error);
      expect(response.meta?.requestId).toBe(requestId);
      expect(response.meta?.duration).toBe(duration);
      expect(response.meta?.version).toBe(version);
    });

    it('should create error response with minimal metadata', () => {
      const error = {
        code: 'ERROR',
        message: 'Test error',
        details: null,
        timestamp: new Date(),
      };
      const response = createErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error).toEqual(error);
      expect(response.meta).toBeDefined();
      expect(response.meta?.requestId).toBeDefined();
      expect(response.meta?.timestamp).toBeInstanceOf(Date);
      expect(response.meta?.duration).toBe(0);
      expect(response.meta?.version).toBe('1.0.0');
    });
  });

  describe('Specific Error Creators', () => {
    it('should create validation error', () => {
      const response = createValidationError(
        'Invalid email format',
        'email',
        'invalid-email',
        { additional: 'context' }
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect(response.error?.message).toBe('Invalid email format');
      expect(response.error?.details).toEqual({
        field: 'email',
        value: 'invalid-email',
        additional: 'context',
      });
    });

    it('should create authentication error', () => {
      const response = createAuthenticationError('Invalid credentials');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AUTHENTICATION_ERROR');
      expect(response.error?.message).toBe('Invalid credentials');
    });

    it('should create authorization error', () => {
      const response = createAuthorizationError('Insufficient permissions');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AUTHORIZATION_ERROR');
      expect(response.error?.message).toBe('Insufficient permissions');
    });

    it('should create not found error', () => {
      const response = createNotFoundError('User', '123', {
        userId: '123',
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND_ERROR');
      expect(response.error?.message).toBe(
        "User with identifier '123' not found"
      );
      expect(response.error?.details).toEqual({
        resource: 'User',
        identifier: '123',
        userId: '123',
      });
    });

    it('should create conflict error', () => {
      const response = createConflictError('Email already exists');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('CONFLICT_ERROR');
      expect(response.error?.message).toBe('Email already exists');
    });

    it('should create rate limit error', () => {
      const response = createRateLimitError('Too many requests', 60, {
        additional: 'context',
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('RATE_LIMIT_ERROR');
      expect(response.error?.message).toBe('Too many requests');
      expect(response.error?.details).toEqual({
        retryAfter: 60,
        additional: 'context',
      });
    });

    it('should create internal server error', () => {
      const response = createInternalServerError('Database connection failed');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.error?.message).toBe('Database connection failed');
    });

    it('should create service unavailable error', () => {
      const response = createServiceUnavailableError(
        'Service temporarily unavailable'
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('SERVICE_UNAVAILABLE_ERROR');
      expect(response.error?.message).toBe('Service temporarily unavailable');
    });
  });

  describe('Response Type Checking', () => {
    describe('isApiResponse', () => {
      it('should identify valid API responses', () => {
        const successResponse = createApiResponse({ data: 'test' });
        const errorResponse = createApiError('ERROR', 'Test error');

        expect(isApiResponse(successResponse)).toBe(true);
        expect(isApiResponse(errorResponse)).toBe(true);
      });

      it('should reject invalid responses', () => {
        expect(isApiResponse({})).toBe(false);
        expect(isApiResponse(null)).toBe(false);
        expect(isApiResponse('string')).toBe(false);
        expect(isApiResponse(42)).toBe(false);
        expect(isApiResponse([])).toBe(false);
      });
    });

    describe('isSuccessResponse', () => {
      it('should identify success responses', () => {
        const response = createApiResponse({ data: 'test' });
        expect(isSuccessResponse(response)).toBe(true);
      });

      it('should reject error responses', () => {
        const response = createApiError('ERROR', 'Test error');
        expect(isSuccessResponse(response)).toBe(false);
      });

      it('should reject invalid responses', () => {
        expect(isSuccessResponse({})).toBe(false);
        expect(() => isSuccessResponse(null)).toThrow();
      });
    });

    describe('isErrorResponse', () => {
      it('should identify error responses', () => {
        const response = createApiError('ERROR', 'Test error');
        expect(isErrorResponse(response)).toBe(true);
      });

      it('should reject success responses', () => {
        const response = createApiResponse({ data: 'test' });
        expect(isErrorResponse(response)).toBe(false);
      });

      it('should reject invalid responses', () => {
        expect(isErrorResponse({})).toBe(false);
        expect(() => isErrorResponse(null)).toThrow();
      });
    });

    describe('isApiError', () => {
      it('should identify API error objects', () => {
        const error = {
          code: 'ERROR',
          message: 'Test error',
          details: null,
          timestamp: new Date(),
        };
        expect(isApiError(error)).toBe(true);
      });

      it('should reject non-error objects', () => {
        expect(isApiError({})).toBe(false);
        expect(isApiError(null)).toBe(false);
        expect(isApiError('string')).toBe(false);
        expect(isApiError(42)).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('generateRequestId', () => {
      it('should generate unique request IDs', () => {
        const id1 = generateRequestId();
        const id2 = generateRequestId();

        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id1).not.toBe(id2);
        expect(typeof id1).toBe('string');
        expect(id1.length).toBeGreaterThan(0);
      });

      it('should generate different IDs on multiple calls', () => {
        const ids = Array.from({ length: 100 }, () => generateRequestId());
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(100);
      });
    });

    describe('createResponseMeta', () => {
      it('should create response metadata with all fields', () => {
        const requestId = 'req-123';
        const duration = 150;
        const version = '1.0.0';

        const meta = createResponseMeta(requestId, duration, version);

        expect(meta.requestId).toBe(requestId);
        expect(meta.timestamp).toBeInstanceOf(Date);
        expect(meta.duration).toBe(duration);
        expect(meta.version).toBe(version);
      });

      it('should create response metadata with minimal fields', () => {
        const requestId = 'req-123';
        const meta = createResponseMeta(requestId);

        expect(meta.requestId).toBe(requestId);
        expect(meta.timestamp).toBeInstanceOf(Date);
        expect(meta.duration).toBe(0);
        expect(meta.version).toBe('1.0.0');
      });
    });

    describe('validateApiResponse', () => {
      it('should validate valid API responses', () => {
        const response = createApiResponse({ data: 'test' });
        const validated = validateApiResponse(response);

        expect(validated).toEqual(response);
      });

      it('should throw error for invalid responses', () => {
        expect(() => validateApiResponse({})).toThrow();
        expect(() => validateApiResponse(null)).toThrow();
        expect(() => validateApiResponse('string')).toThrow();
      });
    });

    describe('handleApiError', () => {
      it('should handle Error objects', () => {
        const error = new Error('Test error');
        const response = handleApiError(error);

        expect(response.success).toBe(false);
        expect(response.error?.message).toBe('Test error');
        expect(response.error?.code).toBe('INTERNAL_SERVER_ERROR');
      });

      it('should handle string errors', () => {
        const response = handleApiError('Test error');

        expect(response.success).toBe(false);
        expect(response.error?.message).toBe('Unknown error occurred');
        expect(response.error?.code).toBe('INTERNAL_SERVER_ERROR');
      });

      it('should handle unknown errors', () => {
        const response = handleApiError(42);

        expect(response.success).toBe(false);
        expect(response.error?.message).toBe('Unknown error occurred');
        expect(response.error?.code).toBe('INTERNAL_SERVER_ERROR');
      });
    });
  });

  describe('Response Transformation', () => {
    describe('transformResponse', () => {
      it('should transform success response data', () => {
        const response = createApiResponse({ count: 42 });
        const transformed = transformResponse(response, data => ({
          total: data.count,
        }));

        expect(transformed.success).toBe(true);
        expect(transformed.data).toEqual({ total: 42 });
      });

      it('should preserve error responses', () => {
        const response = createApiError('ERROR', 'Test error');
        const transformed = transformResponse(response, data => data);

        expect(transformed).toEqual(response);
      });
    });

    describe('mapResponse', () => {
      it('should map success response data', () => {
        const response = createApiResponse([1, 2, 3]);
        const mapped = mapResponse(response, x => x * 2);

        expect(mapped.success).toBe(true);
        expect(mapped.data).toEqual([2, 4, 6]);
      });

      it('should preserve error responses', () => {
        const response = createApiError('ERROR', 'Test error');
        const mapped = mapResponse(response, x => x);

        expect(mapped).toEqual(response);
      });
    });

    describe('filterResponse', () => {
      it('should filter success response data', () => {
        const response = createApiResponse([1, 2, 3, 4, 5]);
        const filtered = filterResponse(response, x => x % 2 === 0);

        expect(filtered.success).toBe(true);
        expect(filtered.data).toEqual([2, 4]);
      });

      it('should preserve error responses', () => {
        const response = createApiError('ERROR', 'Test error');
        const filtered = filterResponse(response, x => x);

        expect(filtered).toEqual(response);
      });
    });
  });

  describe('Paginated Responses', () => {
    it('should create paginated response', () => {
      const data = [1, 2, 3, 4, 5];
      const page = 1;
      const limit = 10;
      const total = 50;

      const response = createPaginatedResponse(data, page, limit, total);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta?.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should create paginated response with metadata', () => {
      const data = [1, 2, 3];
      const page = 2;
      const limit = 5;
      const total = 13;
      const requestId = 'req-123';
      const duration = 150;

      const response = createPaginatedResponse(data, page, limit, total, {
        requestId,
        duration,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta?.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 13,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
      expect(response.meta?.requestId).toBe(requestId);
      expect(response.meta?.duration).toBe(duration);
    });
  });

  describe('Health Check Responses', () => {
    it('should create health check response', () => {
      const data = {
        status: 'healthy',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        services: {
          database: 'healthy',
          redis: 'healthy',
          api: 'healthy',
        },
        uptime: 3600,
        version: '1.0.0',
      };

      const response = createHealthCheckResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta?.requestId).toBeDefined();
      expect(response.meta?.timestamp).toBeInstanceOf(Date);
    });

    it('should create health check response with minimal data', () => {
      const data = {
        status: 'healthy',
        timestamp: new Date(),
      };

      const response = createHealthCheckResponse(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
    });
  });

  describe('Mock Data Tests', () => {
    it('should work with mock success response', () => {
      const response = MOCK_API_RESPONSES.success;
      expectSuccessResponse(response);
      expect(isApiResponse(response)).toBe(true);
      expect(isSuccessResponse(response)).toBe(true);
      expect(isErrorResponse(response)).toBe(false);
    });

    it('should work with mock error response', () => {
      const response = MOCK_API_RESPONSES.error;
      expectErrorResponse(response);
      expect(isApiResponse(response)).toBe(true);
      expect(isSuccessResponse(response)).toBe(false);
      expect(isErrorResponse(response)).toBe(true);
    });

    it('should work with mock paginated response', () => {
      const response = MOCK_API_RESPONSES.paginated;
      expectSuccessResponse(response);
      expect(response.meta?.pagination).toBeDefined();
      expect(response.meta?.pagination?.page).toBe(1);
      expect(response.meta?.pagination?.total).toBe(50);
    });
  });
});
