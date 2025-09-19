// Health check API routes

import { Router } from 'express';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();

// Basic health check
router.get('/', (_req, res) => {
  res.json(
    createApiResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
    })
  );
});

// Detailed health check
router.get('/detailed', async (_req, res) => {
  try {
    // This would check various system components
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      services: {
        database: 'healthy',
        blockchain: 'healthy',
        node: 'healthy',
      },
    };

    res.json(createApiResponse(health));
  } catch (error) {
    res
      .status(500)
      .json(
        createApiResponse(
          null,
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
  }
});

export { router as healthRoutes };
