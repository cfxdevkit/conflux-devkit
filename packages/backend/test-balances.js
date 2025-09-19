#!/usr/bin/env node

import { createPublicClient, http, formatUnits, formatEther, parseUnits } from 'viem';

// Test wallet address from your development mnemonic
const WALLET_ADDRESS = '0xbc621b293C3A35078d3520deC246e70DE40BbA15';

// Token addresses
const TOKENS = {
  USDT: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355',
  USDC: '0xfbef97434ffd0587e5a1c88efd5f7bdc405ba6fa',
};

// Contract addresses
const QUOTER_ADDRESS = '0xff6566ad9F23CE07349aa5dAd97D67E923d955FC';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Quoter ABI
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
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function main() {
  console.log('🧪 Testing Conflux eSpace Testnet Token Balances...\n');

  // Create client for Conflux eSpace testnet
  const publicClient = createPublicClient({
    chain: {
      id: 1030,
      name: 'Conflux eSpace Testnet',
      nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
      rpcUrls: { default: { http: ['https://evmtestnet.confluxrpc.com'] } },
    },
    transport: http('https://evmtestnet.confluxrpc.com'),
  });

  try {
    console.log(`📍 Wallet Address: ${WALLET_ADDRESS}\n`);

    // Get balances
    console.log('💰 Fetching token balances...');
    const [cfxBalance, usdtBalance, usdcBalance] = await Promise.all([
      publicClient.getBalance({ address: WALLET_ADDRESS }),
      publicClient.readContract({
        address: TOKENS.USDT,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [WALLET_ADDRESS],
      }),
      publicClient.readContract({
        address: TOKENS.USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [WALLET_ADDRESS],
      }),
    ]);

    // Format balances
    const cfxFormatted = formatEther(cfxBalance);
    const usdtFormatted = formatUnits(usdtBalance, 18);
    const usdcFormatted = formatUnits(usdcBalance, 18);

    console.log(`CFX:  ${cfxFormatted}`);
    console.log(`USDT: ${usdtFormatted}`);
    console.log(`USDC: ${usdcFormatted}\n`);

    // Test quotes with different fee tiers if we have USDT balance
    if (parseFloat(usdtFormatted) > 0) {
      console.log('💱 Testing quotes for 1 USDT → USDC with different fee tiers...');
      const amountIn = parseUnits('1', 18);
      const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

      for (const fee of feeTiers) {
        try {
          console.log(`\n🔍 Testing ${fee/100}% fee tier...`);
          const quote = await publicClient.readContract({
            address: QUOTER_ADDRESS,
            abi: QUOTER_ABI,
            functionName: 'quoteExactInputSingle',
            args: [
              TOKENS.USDT,
              TOKENS.USDC,
              fee,
              amountIn,
              0n, // no price limit
            ],
          });

          const quoteFormatted = formatUnits(quote, 18);
          console.log(`✅ Fee ${fee/100}%: 1 USDT → ${quoteFormatted} USDC`);
        } catch (quoteError) {
          console.log(`❌ Fee ${fee/100}%: ${quoteError.message}`);
        }
      }
    } else {
      console.log('⚠️ No USDT balance to test quotes');
    }

    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);