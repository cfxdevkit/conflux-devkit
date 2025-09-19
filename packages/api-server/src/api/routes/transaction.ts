// Transaction API routes

import { Router } from 'express';
import { TransactionService } from '../../services/TransactionService';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const transactionService = new TransactionService();

// Send transaction
router.post('/send', async (req, res) => {
  try {
    const { to, value, data, gasLimit, gasPrice } = req.body;
    const hash = await transactionService.sendTransaction({
      to,
      value,
      data,
      gasLimit,
      gasPrice,
    });
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

// Get transaction status
router.get('/:hash/status', async (req, res) => {
  try {
    const { hash } = req.params;
    const status = await transactionService.getTransactionStatus(
      hash as `0x${string}`
    );
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

// Wait for transaction receipt
router.get('/:hash/receipt', async (req, res) => {
  try {
    const { hash } = req.params;
    const receipt = await transactionService.waitForTransactionReceipt(
      hash as `0x${string}`
    );
    res.json(createApiResponse(receipt));
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

// Estimate gas
router.post('/estimate-gas', async (req, res) => {
  try {
    const { to, value, data } = req.body;
    const gasEstimate = await transactionService.estimateGas({
      to,
      value,
      data,
    });
    res.json(createApiResponse({ gasEstimate: gasEstimate.toString() }));
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

// Get gas price
router.get('/gas-price', async (_req, res) => {
  try {
    const gasPrice = await transactionService.getGasPrice();
    res.json(createApiResponse({ gasPrice: gasPrice.toString() }));
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

export { router as transactionRoutes };
