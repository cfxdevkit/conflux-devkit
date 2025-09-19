// Orchestrated Contract API routes - Uses the new service architecture

import { Router } from 'express';
import { getServiceOrchestrator } from '../../services/ServiceOrchestrator';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const orchestrator = getServiceOrchestrator();

// ========================================================================
// Contract Discovery & Management
// ========================================================================

// Get all contracts with full state
router.get('/', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const contracts = await orchestrator.getContractService().getAllContracts();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(contracts));
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

// Get contract by address with full state
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const contractData = await orchestrator
      .getContractService()
      .getContract(address);
    orchestrator.trackRequest(true);

    if (!contractData) {
      return res
        .status(404)
        .json(createApiResponse(null, 'Contract not found'));
    }

    res.json(createApiResponse(contractData));
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

// Get contracts by name pattern
router.get('/search/:pattern', async (req, res) => {
  try {
    const { pattern } = req.params;
    orchestrator.trackRequest();
    const contracts = await orchestrator
      .getContractService()
      .getContractsByName(pattern);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(contracts));
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

// Get contracts by network
router.get('/network/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params;
    orchestrator.trackRequest();
    const contracts = await orchestrator
      .getContractService()
      .getContractsByNetwork(networkId);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(contracts));
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

// Get active contract
router.get('/active/current', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const contract = await orchestrator
      .getContractService()
      .getActiveContract();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(contract));
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
// Contract Deployment
// ========================================================================

// Deploy a single contract
router.post('/deploy', async (req, res) => {
  try {
    const { contractName, constructorArgs, networkId } = req.body;
    orchestrator.trackRequest();
    const contract = await orchestrator.getContractService().deployContract({
      contractName,
      constructorArgs,
      networkId,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse(contract));
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

// Deploy multiple contracts
router.post('/deploy/batch', async (req, res) => {
  try {
    const { contracts } = req.body;
    orchestrator.trackRequest();
    const deployedContracts = await orchestrator
      .getContractService()
      .deployMultipleContracts(contracts);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(deployedContracts));
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
// Contract Interaction
// ========================================================================

// Call contract method (read or write)
router.post('/:address/call', async (req, res) => {
  try {
    const { address } = req.params;
    const { method, args, value, from } = req.body;
    orchestrator.trackRequest();
    const result = await orchestrator.getContractService().callContractMethod({
      contractAddress: address,
      method,
      args,
      value,
      from,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse(result));
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

// Read contract (view/pure functions)
router.post('/:address/read', async (req, res) => {
  try {
    const { address } = req.params;
    const { method, args } = req.body;
    orchestrator.trackRequest();
    const result = await orchestrator
      .getContractService()
      .readContract(address, method, args);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(result));
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

// Write contract (state-changing functions)
router.post('/:address/write', async (req, res) => {
  try {
    const { address } = req.params;
    const { method, args, value, from } = req.body;
    orchestrator.trackRequest();
    const result = await orchestrator
      .getContractService()
      .writeContract(address, method, args, value, from);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(result));
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
// Contract Events
// ========================================================================

// Subscribe to contract events
router.post('/:address/events/subscribe', async (req, res) => {
  try {
    const { address } = req.params;
    const { eventName } = req.body;
    orchestrator.trackRequest();
    await orchestrator.getContractService().subscribeToContractEvents({
      contractAddress: address,
      eventName,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Subscribed to events' }));
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

// Unsubscribe from contract events
router.post('/:address/events/unsubscribe', async (req, res) => {
  try {
    const { address } = req.params;
    const { eventName } = req.body;
    orchestrator.trackRequest();
    await orchestrator.getContractService().unsubscribeFromContractEvents({
      contractAddress: address,
      eventName,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Unsubscribed from events' }));
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

// Get contract events history
router.get('/:address/events', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const events = await orchestrator
      .getContractService()
      .getContractEvents(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(events));
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
// Contract Analysis
// ========================================================================

// Analyze contract capabilities
router.get('/:address/analyze', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const analysis = await orchestrator
      .getContractService()
      .analyzeContract(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(analysis));
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

// Get contract usage statistics
router.get('/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const stats = await orchestrator
      .getContractService()
      .getContractUsageStats(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(stats));
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
// Contract Management
// ========================================================================

// Select contract as active
router.post('/:address/select', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    await orchestrator.getContractService().selectContract(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Contract selected' }));
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

// Get contract ABI
router.get('/:address/abi', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const abi = await orchestrator.getContractService().getContractABI(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(abi));
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

// Get contract bytecode
router.get('/:address/bytecode', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const bytecode = await orchestrator
      .getContractService()
      .getContractBytecode(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(bytecode));
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

export { router as orchestratedContractRoutes };
