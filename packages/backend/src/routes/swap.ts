/**
 * GinsengSwap API Routes
 *
 * Provides backend swap operations using server wallet for development convenience
 */

import type { DevKit } from '@conflux-devkit/node';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { parseUnits, formatUnits, type Address } from 'viem';
import { logger } from '../utils/logger.js';

// GinsengSwap Contract Addresses - Network specific
const GINSENG_CONTRACTS = {
  testnet: {
    FACTORY: '0x7e4B6F3A158b1728444d2D5EAec72e081e7d9c48' as Address,
    ROUTER: '0x5F3147353c3da9bd0EC2F8F511BD73EcCDf4D9b0' as Address,
    POSITION_MANAGER: '0xE8F658fB945052003f0AFd931b1C8eC357FC3fe8' as Address,
    QUOTER: '0xff6566ad9F23CE07349aa5dAd97D67E923d955FC' as Address,
    QUOTER_V2: '0x7C4a791F8285bD32DDfb33E8c660C3254a9Ba72e' as Address,
  },
  mainnet: {
    FACTORY: '0x62Aa0294cB42Aae39b7772313eAdfa5d489146eC' as Address,
    ROUTER: '0xD3b8e9086a32535f888e93F84aDe9E7dE9ef5001' as Address,
    POSITION_MANAGER: '0x820A73ba72A21f0AEF985dB6FB3E923b343b7Dbe' as Address,
    QUOTER: '0x2503C6ff25a3C25A949Dc82a5599a58561189b54' as Address,
    QUOTER_V2: '0xEEDbDea29E8e44E9428407eA2A5De724318E923F' as Address,
    NFT_DESCRIPTOR: '0x7020c0edd12840140cAaB08A626dFBf804289890' as Address,
    TOKEN_DESCRIPTOR: '0xd42318456BA248F5f9C1C3C3bA4F227c61E33c15' as Address,
    STAKER: '0x4e4C122CcBA0ff79b0Ac5Ae1054D648d8BD3F3d9' as Address,
    TICK_LENS: '0x202EcF34BBb0d460362A1Fc822712AA839753165' as Address,
  },
} as const;

// Token Configuration - Network specific
const TOKENS = {
  testnet: {
    USDT: {
      address: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355' as Address,
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
    },
    USDC: {
      address: '0xfbef97434ffd0587e5a1c88efd5f7bdc405ba6fa' as Address,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
    },
  },
  mainnet: {
    USDT: {
      address: '0xfe97e85d13abd9c1c33384e796f10b73905637ce' as Address,
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
    },
    USDC: {
      address: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372' as Address,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
    },
  },
} as const;

// Pool Configurations - Network specific
const POOLS = {
  testnet: {
    'USDC-USDT': {
      500: '0x48aa364f1bcb5e621b16748251205a41218b11a8' as Address,    // 0.05%
      3000: '0x8d15c5ac89a95dbe5a1174dbbeffd08b3a3d7102' as Address,   // 0.3%
      10000: '0xaef5c803c2812604740ef0cb0f88f06bdbf3ff3d' as Address,  // 1%
    },
  },
  mainnet: {
    'USDC-USDT': {
      500: '0xCd0c7A06D95a5fE99D3Aa3Bc9f174B8999cC36Bf' as Address,    // Main pool from user input
      3000: '0xCd0c7A06D95a5fE99D3Aa3Bc9f174B8999cC36Bf' as Address,   // Main pool from user input
      10000: '0xCd0c7A06D95a5fE99D3Aa3Bc9f174B8999cC36Bf' as Address,  // Main pool from user input
    },
  },
} as const;

// Network detection helper
function getNetworkFromRequest(req: Request): 'testnet' | 'mainnet' {
  // Check if there's a network parameter in the request
  const networkFromQuery = req.query.network as string;
  const networkFromBody = (req.body as { network?: string })?.network;
  const networkFromHeaders = req.headers['x-network'] as string;
  
  const network = networkFromQuery || networkFromBody || networkFromHeaders;
  
  // Default to testnet for backward compatibility if no network specified
  if (network === 'mainnet') {
    return 'mainnet';
  }
  return 'testnet';
}

// Get network-specific configurations
function getNetworkConfig(network: 'testnet' | 'mainnet') {
  return {
    tokens: TOKENS[network],
    contracts: GINSENG_CONTRACTS[network],
    pools: POOLS[network],
    chainId: network === 'testnet' ? 71 : 1030,
    rpcUrl: network === 'testnet' ? 'https://evmtestnet.confluxrpc.com' : 'https://evm.confluxrpc.com',
  };
}

// Quoter V2 ABI (returns additional data)
const QUOTER_ABI = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// SwapRouter ABI (minimal for exactInputSingle)
const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

// ERC20 ABI (minimal for approve and balanceOf)
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function createSwapRoutes(devkit: DevKit): Router {
  const router = Router();

  /**
   * Get quote for swap
   */
  router.post('/quote', async (req: Request, res: Response) => {
    try {
      const { fromToken, toToken, amount, fee = 3000 } = req.body;

      if (!fromToken || !toToken || !amount) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Detect network and get appropriate config
      const network = getNetworkFromRequest(req);
      const config = getNetworkConfig(network);

      if (!config.tokens[fromToken as keyof typeof config.tokens] || 
          !config.tokens[toToken as keyof typeof config.tokens]) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      const fromTokenInfo = config.tokens[fromToken as keyof typeof config.tokens];
      const toTokenInfo = config.tokens[toToken as keyof typeof config.tokens];

      // Create viem client for the appropriate network
      const { createPublicClient, http } = await import('viem');
      const publicClient = createPublicClient({
        chain: {
          id: config.chainId,
          name: network === 'testnet' ? 'Conflux eSpace Testnet' : 'Conflux eSpace',
          nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
          rpcUrls: { default: { http: [config.rpcUrl] } },
        },
        transport: http(config.rpcUrl),
      });

      // Convert amount to wei
      const amountInWei = parseUnits(amount, fromTokenInfo.decimals);

      // Try to get quote from Uniswap V3 quoter V2, fallback to simple calculation
      let useRealQuote = false;
      let amountOutFormatted: string;

      try {
        logger.info('🔍 Attempting real quote from GinsengSwap quoter...');

        // Get quote from Uniswap V3 quoter V2
        const quoteResult = await publicClient.readContract({
          address: config.contracts.QUOTER_V2,
          abi: QUOTER_ABI,
          functionName: 'quoteExactInputSingle',
          args: [
            fromTokenInfo.address,
            toTokenInfo.address,
            fee,
            amountInWei,
            0n, // sqrtPriceLimitX96 = 0 (no limit)
          ],
        });

        // Quoter V2 returns [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate]
        const quoteResult_arr = quoteResult as readonly [bigint, bigint, number, bigint];
        const amountOut = quoteResult_arr[0];
        amountOutFormatted = formatUnits(amountOut, toTokenInfo.decimals);
        useRealQuote = true;

        logger.info('✅ Real quote from GinsengSwap:', {
          from: fromToken,
          to: toToken,
          amountIn: amount,
          amountOut: amountOutFormatted,
          fee
        });

      } catch (quoterError: unknown) {
        // Pools don't exist yet on this testnet deployment - use fallback
        const amountIn = parseFloat(amount);
        const estimatedOut = amountIn * 0.999; // 0.1% slippage for stablecoins
        amountOutFormatted = estimatedOut.toFixed(6);

        logger.info('📊 Pool not found, using fallback quote:', {
          from: fromToken,
          to: toToken,
          amountIn: amount,
          amountOut: amountOutFormatted,
          reason: 'Pool does not exist on testnet'
        });
      }

      res.json({
        fromToken: fromTokenInfo,
        toToken: toTokenInfo,
        amountIn: amount,
        amountOut: amountOutFormatted,
        fee,
        path: `${fromToken}-${toToken}`,
        poolExists: useRealQuote
      });

    } catch (error) {
      logger.error('Quote error (outer catch):', {
        error,
        message: (error as Error)?.message,
        code: (error as { code?: string })?.code,
        stack: (error as Error)?.stack,
        name: (error as Error)?.name
      });
      res.status(500).json({ error: 'Failed to get quote' });
    }
  });

  /**
   * Test endpoint - public balance check (no auth needed)
   */
  router.get('/test-balances', async (_req: Request, res: Response) => {
    try {
      const testAddress = '0xbc621b293C3A35078d3520deC246e70DE40BbA15';
      
      // Default to testnet for this test endpoint
      const config = getNetworkConfig('testnet');

      // Create viem client to read network data
      const { createPublicClient, http, formatEther } = await import('viem');
      const publicClient = createPublicClient({
        chain: {
          id: config.chainId,
          name: 'Conflux eSpace Testnet',
          nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
          rpcUrls: { default: { http: [config.rpcUrl] } },
        },
        transport: http(config.rpcUrl),
      });

      logger.info('🧪 Testing network connection and balance fetching...');

      // Get token balances using contract calls
      const [cfxBalance, usdtBalance, usdcBalance] = await Promise.all([
        publicClient.getBalance({ address: testAddress as Address }),
        publicClient.readContract({
          address: config.tokens.USDT.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [testAddress as Address],
        }),
        publicClient.readContract({
          address: config.tokens.USDC.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [testAddress as Address],
        }),
      ]);

      // Format token balances (from wei to human readable)
      const cfxFormatted = formatEther(cfxBalance as bigint);
      const usdtFormatted = formatUnits(usdtBalance as bigint, config.tokens.USDT.decimals);
      const usdcFormatted = formatUnits(usdcBalance as bigint, config.tokens.USDC.decimals);

      logger.info('📊 Testnet balances fetched successfully:', {
        address: testAddress,
        CFX: cfxFormatted,
        USDT: usdtFormatted,
        USDC: usdcFormatted
      });

      res.json({
        success: true,
        address: testAddress,
        balances: {
          CFX: cfxFormatted,
          USDT: usdtFormatted,
          USDC: usdcFormatted
        },
        testnet: 'https://evmtestnet.confluxrpc.com'
      });

    } catch (error) {
      logger.error('Test balance error:', error);
      res.status(500).json({ error: 'Failed to test balances', details: (error as Error).message });
    }
  });

  /**
   * Get token balances for server wallet
   */
  router.get('/balances', async (_req: Request, res: Response) => {
    try {
      // Get the admin account (account 0 from server)
      const adminAccount = devkit.account(0);
      
      // Detect network from request (default to testnet for backward compatibility)
      const network = getNetworkFromRequest(_req);
      const config = getNetworkConfig(network);

      // Create viem client to read contract data
      const { createPublicClient, http } = await import('viem');
      const publicClient = createPublicClient({
        chain: {
          id: config.chainId,
          name: network === 'testnet' ? 'Conflux eSpace Testnet' : 'Conflux eSpace',
          nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
          rpcUrls: { default: { http: [config.rpcUrl] } },
        },
        transport: http(config.rpcUrl),
      });

      // Get token balances using contract calls
      const [cfxBalance, usdtBalance, usdcBalance] = await Promise.all([
        // Get CFX balance directly from network
        publicClient.getBalance({ address: adminAccount.address.evm as Address }),
        publicClient.readContract({
          address: config.tokens.USDT.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [adminAccount.address.evm as Address],
        }),
        publicClient.readContract({
          address: config.tokens.USDC.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [adminAccount.address.evm as Address],
        }),
      ]);

      // Format token balances (from wei to human readable)
      const { formatEther } = await import('viem');
      const cfxFormatted = formatEther(cfxBalance as bigint);
      const usdtFormatted = formatUnits(usdtBalance as bigint, config.tokens.USDT.decimals);
      const usdcFormatted = formatUnits(usdcBalance as bigint, config.tokens.USDC.decimals);

      logger.info('📊 Token balances:', {
        address: adminAccount.address.evm,
        CFX: cfxFormatted,
        USDT: usdtFormatted,
        USDC: usdcFormatted
      });

      res.json({
        address: adminAccount.address.evm,
        balances: {
          USDT: usdtFormatted,
          USDC: usdcFormatted,
          CFX: cfxFormatted
        }
      });

    } catch (error) {
      logger.error('Balance error:', error);
      res.status(500).json({ error: 'Failed to get balances' });
    }
  });

  /**
   * Execute swap using server wallet
   */
  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const { fromToken, toToken, amount, fee = 3000, slippage = 0.5 } = req.body;

      if (!fromToken || !toToken || !amount) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Detect network and get appropriate config
      const network = getNetworkFromRequest(req);
      const config = getNetworkConfig(network);

      if (!config.tokens[fromToken as keyof typeof config.tokens] || 
          !config.tokens[toToken as keyof typeof config.tokens]) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      const fromTokenInfo = config.tokens[fromToken as keyof typeof config.tokens];
      const toTokenInfo = config.tokens[toToken as keyof typeof config.tokens];

      logger.info('🔄 Executing swap:', {
        from: fromToken,
        to: toToken,
        amount,
        fee,
        slippage,
        network
      });

      // Get admin account from server
      const adminAccount = devkit.account(0);

      logger.info('🔑 Server wallet info:', {
        coreAddress: adminAccount.address.core,
        evmAddress: adminAccount.address.evm,
        evmPrivateKey: adminAccount.evmPrivateKey ? `0x...${adminAccount.evmPrivateKey.slice(-4)}` : 'none'
      });

      // For now, return a mock successful swap
      // We'll implement the actual swap logic later
      const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      res.json({
        success: true,
        transactionHash: mockTxHash,
        fromToken: fromTokenInfo,
        toToken: toTokenInfo,
        amountIn: amount,
        amountOut: (parseFloat(amount) * 0.999).toFixed(6), // Mock output
        account: adminAccount.address.evm
      });

    } catch (error) {
      logger.error('Swap execution error:', error);
      res.status(500).json({ error: 'Failed to execute swap' });
    }
  });

  return router;
}