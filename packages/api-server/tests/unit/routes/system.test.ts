// System route tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the ServiceOrchestrator
vi.mock('../../../src/services/ServiceOrchestrator', () => ({
  getServiceOrchestrator: vi.fn(() => ({
    trackRequest: vi.fn(),
    getSystemStatus: vi.fn().mockResolvedValue({
      status: 'running',
      uptime: 1000,
      timestamp: new Date().toISOString(),
    }),
    getServiceHealth: vi.fn().mockResolvedValue({
      status: 'healthy',
      services: {
        database: 'healthy',
        blockchain: 'healthy',
        node: 'healthy',
      },
    }),
    getServiceMetrics: vi.fn().mockResolvedValue({
      memory: {
        used: 1000000,
        total: 2000000,
        free: 1000000,
      },
      uptime: 1000,
      timestamp: new Date().toISOString(),
    }),
    getStateService: vi.fn(() => ({
      getStateForAPI: vi.fn().mockReturnValue({
        wallets: [],
        contracts: [],
        node: { status: null },
      }),
    })),
    initialize: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    quickStart: vi.fn().mockResolvedValue(undefined),
    quickStop: vi.fn().mockResolvedValue(undefined),
    getContractService: vi.fn(),
    getWalletService: vi.fn(),
    getNodeService: vi.fn(),
  })),
}));

// Import after mocking
import { systemRoutes } from '../../../src/api/routes/system';

// Create test app
const app = express();
app.use(express.json());
app.use('/system', systemRoutes);

describe('System Routes', () => {
  describe('GET /system/info', () => {
    it('should return system information', async () => {
      const response = await request(app).get('/system/info').expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return correct package information', async () => {
      const response = await request(app).get('/system/info').expect(200);

      expect(response.body.data.name).toBe('Conflux DevKit API Server');
      expect(response.body.data.version).toBe('1.0.0');
    });
  });

  describe('GET /system/status', () => {
    it('should return system status', async () => {
      const response = await request(app).get('/system/status').expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return running status', async () => {
      const response = await request(app).get('/system/status').expect(200);

      expect(response.body.data.status).toBe('running');
    });
  });

  describe('GET /system/health', () => {
    it('should return service health', async () => {
      const response = await request(app).get('/system/health').expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('services');
    });
  });

  describe('GET /system/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app).get('/system/metrics').expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should have memory information', async () => {
      const response = await request(app).get('/system/metrics').expect(200);

      expect(response.body.data.memory).toHaveProperty('used');
      expect(response.body.data.memory).toHaveProperty('total');
      expect(response.body.data.memory).toHaveProperty('free');
    });
  });

  describe('POST /system/initialize', () => {
    it('should initialize system', async () => {
      const response = await request(app)
        .post('/system/initialize')
        .send({ config: {} })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.message).toBe(
        'System initialized successfully'
      );
    });
  });

  describe('POST /system/start', () => {
    it('should start system', async () => {
      const response = await request(app)
        .post('/system/start')
        .send({ config: {} })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.message).toBe('System started successfully');
    });
  });

  describe('POST /system/stop', () => {
    it('should stop system', async () => {
      const response = await request(app).post('/system/stop').expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.message).toBe('System stopped successfully');
    });
  });
});
