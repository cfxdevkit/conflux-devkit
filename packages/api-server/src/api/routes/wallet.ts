// Wallet API routes

import { Router } from 'express';
import { WalletService } from '../../services/WalletService';
import { createApiResponse } from '../../utils/response';

const router: Router = Router();
const walletService = new WalletService();

// Get all wallets
router.get('/', async (_req, res) => {
  try {
    const wallets = await walletService.getAllWallets();
    res.json(createApiResponse(wallets));
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

// Get wallet by address
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const wallet = await walletService.getWallet(address as `0x${string}`);

    if (!wallet) {
      return res.status(404).json(createApiResponse(null, 'Wallet not found'));
    }

    res.json(createApiResponse(wallet));
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

// Create new wallet
router.post('/', async (req, res) => {
  try {
    const { mnemonic, index = 0 } = req.body;
    const wallet = await walletService.createWallet(mnemonic, index);
    res.json(createApiResponse(wallet));
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

// Get wallet balance
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await walletService.getWalletBalance(
      address as `0x${string}`
    );
    res.json(createApiResponse({ balance: balance.toString() }));
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

// Set mining wallet
router.post('/:address/mining', async (req, res) => {
  try {
    const { address } = req.params;
    await walletService.setMiningWallet(address as `0x${string}`);
    res.json(createApiResponse({ message: 'Mining wallet set successfully' }));
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

export { router as walletRoutes };
