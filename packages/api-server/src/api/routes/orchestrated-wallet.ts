// Orchestrated Wallet API routes - Uses the new service architecture

import { Router } from 'express';
import { getServiceOrchestrator } from '../../services/ServiceOrchestrator';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const orchestrator = getServiceOrchestrator();

// ========================================================================
// Wallet Discovery & Management
// ========================================================================

// Get all wallets with full state
router.get('/', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const wallets = await orchestrator.getWalletService().getAllWallets();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(wallets));
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

// Get wallet by address with full state
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const wallet = await orchestrator.getWalletService().getWallet(address);
    orchestrator.trackRequest(true);

    if (!wallet) {
      return res.status(404).json(createApiResponse(null, 'Wallet not found'));
    }

    res.json(createApiResponse(wallet));
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

// Get wallets by network
router.get('/network/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params;
    orchestrator.trackRequest();
    const wallets = await orchestrator
      .getWalletService()
      .getWalletsByNetwork(networkId);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(wallets));
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

// Get active wallet
router.get('/active/current', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const wallet = await orchestrator.getWalletService().getActiveWallet();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(wallet));
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
// Wallet Creation & Import
// ========================================================================

// Create new wallet
router.post('/', async (req, res) => {
  try {
    const { mnemonic, index, name, description } = req.body;
    orchestrator.trackRequest();
    const wallet = await orchestrator.getWalletService().createWallet({
      mnemonic,
      index,
      name,
      description,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse(wallet));
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

// Import existing wallet
router.post('/import', async (req, res) => {
  try {
    const { privateKey, name, description } = req.body;
    orchestrator.trackRequest();
    const wallet = await orchestrator.getWalletService().importWallet({
      privateKey,
      name,
      description,
    });
    orchestrator.trackRequest(true);
    res.json(createApiResponse(wallet));
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

// Create multiple wallets from mnemonic
router.post('/derive', async (req, res) => {
  try {
    const { mnemonic, count, startIndex } = req.body;
    orchestrator.trackRequest();
    const wallets = await orchestrator
      .getWalletService()
      .createWalletDerivation(mnemonic, count, startIndex);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(wallets));
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
// Wallet Selection & Management
// ========================================================================

// Select wallet as active
router.post('/:address/select', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    await orchestrator.getWalletService().selectWallet(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Wallet selected' }));
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

// Get wallet selection history
router.get('/selection/history', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const history = await orchestrator
      .getWalletService()
      .getWalletSelectionHistory();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(history));
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
// Wallet Balance Management
// ========================================================================

// Get wallet balance with formatting
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const balance = await orchestrator
      .getWalletService()
      .getWalletBalance(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(balance));
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

// Get all wallet balances
router.get('/balances/all', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const balances = await orchestrator
      .getWalletService()
      .getAllWalletBalances();
    orchestrator.trackRequest(true);
    res.json(createApiResponse(balances));
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

// Refresh all wallet balances
router.post('/balances/refresh', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    await orchestrator.getWalletService().refreshAllWalletBalances();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'All balances refreshed' }));
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
// Wallet Analysis
// ========================================================================

// Get wallet statistics
router.get('/stats/overview', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const stats = await orchestrator.getWalletService().getWalletStats();
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

// Get wallet transaction history
router.get('/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const history = await orchestrator
      .getWalletService()
      .getWalletTransactionHistory(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse(history));
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
// Wallet Operations
// ========================================================================

// Set mining wallet
router.post('/:address/mining', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    await orchestrator.getWalletService().setMiningWallet(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ message: 'Mining wallet set successfully' }));
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

// Get mining wallet
router.get('/mining/current', async (_req, res) => {
  try {
    orchestrator.trackRequest();
    const miningWallet = await orchestrator
      .getWalletService()
      .getMiningWallet();
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ miningWallet }));
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
// Utility Operations
// ========================================================================

// Validate wallet address
router.post('/validate/:address', async (req, res) => {
  try {
    const { address } = req.params;
    orchestrator.trackRequest();
    const isValid = orchestrator
      .getWalletService()
      .validateWalletAddress(address);
    const checksum = orchestrator
      .getWalletService()
      .getWalletAddressChecksum(address);
    orchestrator.trackRequest(true);
    res.json(createApiResponse({ isValid, checksum }));
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

export { router as orchestratedWalletRoutes };
