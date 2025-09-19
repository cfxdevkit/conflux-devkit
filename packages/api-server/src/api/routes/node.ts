// Node API routes

import { Router } from 'express';
import { NodeService } from '../../services/NodeService';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const nodeService = new NodeService();

// Get node status
router.get('/status', async (_req, res) => {
  try {
    const status = await nodeService.getNodeStatus();
    res.json(createApiResponse(status));
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

// Start node
router.post('/start', async (req, res) => {
  try {
    const { config } = req.body;
    await nodeService.startNode(config);
    res.json(createApiResponse({ message: 'Node started successfully' }));
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

// Stop node
router.post('/stop', async (_req, res) => {
  try {
    await nodeService.stopNode();
    res.json(createApiResponse({ message: 'Node stopped successfully' }));
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

// Restart node
router.post('/restart', async (req, res) => {
  try {
    const { config } = req.body;
    await nodeService.restartNode(config);
    res.json(createApiResponse({ message: 'Node restarted successfully' }));
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

// Get node configuration
router.get('/config', async (_req, res) => {
  try {
    const config = await nodeService.getNodeConfig();
    res.json(createApiResponse(config));
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

// Update node configuration
router.put('/config', async (req, res) => {
  try {
    const { config } = req.body;
    await nodeService.updateNodeConfig(config);
    res.json(
      createApiResponse({ message: 'Node configuration updated successfully' })
    );
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

export { router as nodeRoutes };
