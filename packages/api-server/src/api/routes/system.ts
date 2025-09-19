// System API routes - Overall orchestration and system management

import { Router } from 'express';
import { getServiceOrchestrator } from '../../services/ServiceOrchestrator';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const orchestrator = getServiceOrchestrator();

// ========================================================================
// System Status & Health
// ========================================================================

// Get complete system status
router.get('/status', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const status = await orchestrator.getSystemStatus();
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

// Get service health
router.get('/health', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const health = await orchestrator.getServiceHealth();
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

// Get service metrics
router.get('/metrics', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const metrics = await orchestrator.getServiceMetrics();
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

// Get complete state
router.get('/state', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const state = orchestrator.getStateService().getStateForAPI();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(state));
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
// System Lifecycle Management
// ========================================================================

// Initialize system
router.post('/initialize', async (req, res) => {
  try {
    const { config } = req.body;
    orchestrator.trackRequest();
    await orchestrator.initialize(config);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'System initialized successfully' }));
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

// Destroy system
router.post('/destroy', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    await orchestrator.destroy();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'System destroyed successfully' }));
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

// Quick start system
router.post('/start', async (req, res) => {
  try {
    const { config } = req.body;
    orchestrator.trackRequest();
    await orchestrator.quickStart(config);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'System started successfully' }));
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

// Quick stop system
router.post('/stop', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    await orchestrator.quickStop();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'System stopped successfully' }));
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
// Service Access
// ========================================================================

// Get contract service info
router.get('/services/contract', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const _service = orchestrator.getContractService();
    orchestrator.trackRequest(true);
    res.json(
      createApiResponse({
        name: 'Contract Orchestration Service',
        description: 'High-level contract management with state integration',
        methods: [
          'getAllContracts',
          'getContract',
          'deployContract',
          'callContractMethod',
          'analyzeContract',
          'getContractUsageStats',
        ],
      })
    );
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

// Get wallet service info
router.get('/services/wallet', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const _service = orchestrator.getWalletService();
    orchestrator.trackRequest(true);
    res.json(
      createApiResponse({
        name: 'Wallet Orchestration Service',
        description: 'High-level wallet management with state integration',
        methods: [
          'getAllWallets',
          'getWallet',
          'createWallet',
          'importWallet',
          'getWalletBalance',
          'getWalletStats',
        ],
      })
    );
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

// Get node service info
router.get('/services/node', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const _service = orchestrator.getNodeService();
    orchestrator.trackRequest(true);
    res.json(
      createApiResponse({
        name: 'Node Orchestration Service',
        description: 'High-level node management with state integration',
        methods: [
          'getNodeStatus',
          'startNode',
          'stopNode',
          'getNodeHealthCheck',
          'getNodeConfiguration',
          'switchNetwork',
        ],
      })
    );
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

// Get state service info
router.get('/services/state', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const _service = orchestrator.getStateService();
    orchestrator.trackRequest(true);
    res.json(
      createApiResponse({
        name: 'State Integration Service',
        description: 'Bridge between API server and state management',
        methods: [
          'connect',
          'disconnect',
          'getStateForAPI',
          'getContractDataForAPI',
          'getWalletDataForAPI',
          'on',
          'off',
          'emit',
        ],
      })
    );
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
// System Information
// ========================================================================

// Get system information
router.get('/info', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const info = {
      name: 'Conflux DevKit API Server',
      version: '1.0.0',
      description: 'Orchestrated API server with state management integration',
      architecture: 'Microservices with State Orchestration',
      services: [
        'Contract Orchestration Service',
        'Wallet Orchestration Service',
        'Node Orchestration Service',
        'State Integration Service',
      ],
      features: [
        'Real-time state management',
        'Contract deployment and interaction',
        'Wallet management and analytics',
        'Node lifecycle management',
        'Health monitoring and metrics',
        'Event-driven architecture',
      ],
      timestamp: new Date().toISOString(),
    };
    orchestrator.trackRequest(true);
    res.json(createApiResponse(info));
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

// Get API documentation
router.get('/docs', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const docs = {
      title: 'Conflux DevKit API Documentation',
      version: '1.0.0',
      description:
        'Complete API documentation for the orchestrated Conflux DevKit server',
      endpoints: {
        contracts: {
          base: '/api/contracts',
          description: 'Contract management and interaction',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
        wallets: {
          base: '/api/wallets',
          description: 'Wallet management and analytics',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
        node: {
          base: '/api/node',
          description: 'Node lifecycle and configuration',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
        system: {
          base: '/api/system',
          description: 'System orchestration and management',
          methods: ['GET', 'POST'],
        },
      },
      examples: {
        'Get all contracts': 'GET /api/contracts',
        'Deploy contract': 'POST /api/contracts/deploy',
        'Get wallet balance': 'GET /api/wallets/:address/balance',
        'Start node': 'POST /api/node/start',
        'Get system status': 'GET /api/system/status',
      },
    };
    orchestrator.trackRequest(true);
    res.json(createApiResponse(docs));
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

export { router as systemRoutes };
