// Contract API routes

import { Router } from 'express';
import { ContractService } from '../../services/ContractService';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const contractService = new ContractService();

// Get all contracts
router.get('/', async (_req, res) => {
  try {
    const contracts = await contractService.getAllContracts();
    res.json(createApiResponse(contracts));
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

// Get contract by address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const contract = await contractService.getContract(
      address as `0x${string}`
    );

    if (!contract) {
      return res
        .status(404)
        .json(createApiResponse(null, 'Contract not found'));
    }

    res.json(createApiResponse(contract));
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

// Deploy contract
router.post('/deploy', async (req, res) => {
  try {
    const { bytecode, abi, name, constructorArgs = [] } = req.body;
    const contract = await contractService.deployContract(
      bytecode,
      abi,
      name,
      constructorArgs
    );
    res.json(createApiResponse(contract));
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

// Read contract
router.post('/:address/read', async (req, res) => {
  try {
    const { address } = req.params;
    const { abi, functionName, args = [] } = req.body;
    const result = await contractService.readContract(
      address as `0x${string}`,
      abi,
      functionName,
      args
    );
    res.json(createApiResponse(result));
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

// Write contract
router.post('/:address/write', async (req, res) => {
  try {
    const { address } = req.params;
    const { abi, functionName, args = [], value = 0 } = req.body;
    const hash = await contractService.writeContract(
      address as `0x${string}`,
      abi,
      functionName,
      args,
      value
    );
    res.json(createApiResponse({ hash }));
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

export { router as contractRoutes };
