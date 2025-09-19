// Test utilities for api-server package

import request from 'supertest';
import express from 'express';

/**
 * Create a test Express app with the given router
 */
export function createTestApp(router: express.Router, path: string = '') {
  const app = express();
  app.use(express.json());
  app.use(path, router);
  return app;
}

/**
 * Create a mock request object
 */
export function createMockRequest(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
}

/**
 * Create a mock response object
 */
export function createMockResponse() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create a mock next function
 */
export function createMockNext() {
  return vi.fn();
}

/**
 * Mock Express middleware
 */
export function mockMiddleware(req: any, res: any, next: any) {
  next();
}

/**
 * Create a test server
 */
export function createTestServer() {
  const app = express();
  app.use(express.json());
  return app;
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const originalConsole = { ...console };

  beforeEach(() => {
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });
}
