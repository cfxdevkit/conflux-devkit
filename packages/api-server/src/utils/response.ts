// API response utilities

import type { ApiResponse } from '@conflux-devkit/core';

/**
 * Create a successful API response
 */
export function createApiResponse<T>(data: T, error?: string): ApiResponse<T> {
  if (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error,
        timestamp: new Date(),
      },
    };
  }

  return {
    success: true,
    data,
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date(),
      duration: 0, // Would be calculated in real implementation
      version: '1.0.0',
    },
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
