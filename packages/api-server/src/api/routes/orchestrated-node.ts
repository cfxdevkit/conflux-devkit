// Orchestrated Node API routes - Uses the new service architecture

import { Router } from 'express';
import { getServiceOrchestrator } from '../../services/ServiceOrchestrator';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const orchestrator = getServiceOrchestrator();

// ========================================================================
// Node Status & Health
// ========================================================================

// Get node status
router.get('/status', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const status = await orchestrator.getNodeService().getNodeStatus();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(status));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Get node health check
router.get('/health', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const health = await orchestrator.getNodeService().getNodeHealthCheck();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(health));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Check if node is running
router.get('/running', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const isRunning = await orchestrator.getNodeService().isNodeRunning();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ isRunning }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Check if node is starting
router.get('/starting', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const isStarting = await orchestrator.getNodeService().isNodeStarting();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ isStarting }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Check if node is stopping
router.get('/stopping', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const isStopping = await orchestrator.getNodeService().isNodeStopping();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ isStopping }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// ========================================================================
// Node Lifecycle Management
// ========================================================================

// Start node
router.post('/start', async (req, res) => {
  try {
    const { config, autoConnect, waitForReady, timeout } = req.body;
    orchestrator.trackRequest();
    await orchestrator.getNodeService().startNode({
      config,
      autoConnect,
      waitForReady,
      timeout,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Node start initiated' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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
router.post('/stop', async (req, res) => {
  try {
    const { graceful, timeout } = req.body;
    orchestrator.trackRequest();
    await orchestrator.getNodeService().stopNode({
      graceful,
      timeout,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Node stop initiated' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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
    const { config, autoConnect, waitForReady, timeout } = req.body;
    orchestrator.trackRequest();
    await orchestrator.getNodeService().restartNode({
      config,
      autoConnect,
      waitForReady,
      timeout,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Node restart initiated' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// ========================================================================
// Node Configuration Management
// ========================================================================

// Get node configuration
router.get('/config', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const config = await orchestrator.getNodeService().getNodeConfiguration();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(config));
  } catch (error) {
    orchestrator.trackRequest(false);
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
    orchestrator.trackRequest();
    await orchestrator.getNodeService().updateNodeConfiguration(config);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Node configuration updated' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// ========================================================================
// Network Management
// ========================================================================

// Get current network
router.get('/network/current', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const network = await orchestrator.getNodeService().getCurrentNetwork();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(network));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Switch network
router.post('/network/switch', async (req, res) => {
  try {
    const { networkId } = req.body;
    orchestrator.trackRequest();
    await orchestrator.getNodeService().switchNetwork(networkId);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Network switch initiated' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Get available networks
router.get('/network/available', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const networks = await orchestrator.getNodeService().getAvailableNetworks();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(networks));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// ========================================================================
// Node Monitoring
// ========================================================================

// Start monitoring
router.post('/monitoring/start', async (req, res) => {
  try {
    const { interval } = req.body;
    orchestrator.trackRequest();
    await orchestrator.getNodeService().startMonitoring(interval);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Monitoring started' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Stop monitoring
router.post('/monitoring/stop', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    await orchestrator.getNodeService().stopMonitoring();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Monitoring stopped' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Get node metrics
router.get('/metrics', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const metrics = await orchestrator.getNodeService().getNodeMetrics();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(metrics));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// ========================================================================
// Node Logs
// ========================================================================

// Get node logs
router.get('/logs', async (req, res) => {
  try {
    const { lines = 100 } = req.query;
    orchestrator.trackRequest();
    const logs = await orchestrator.getNodeService().getNodeLogs(Number(lines));
    orchestrator.trackRequest(true);
    res.json(createApiResponse(logs));
  } catch (error) {
    orchestrator.trackRequest(false);
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

// Clear node logs
router.delete('/logs', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    await orchestrator.getNodeService().clearNodeLogs();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Node logs cleared' }));
  } catch (error) {
    orchestrator.trackRequest(false);
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

export { router as orchestratedNodeRoutes };
