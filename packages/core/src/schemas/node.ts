// Node validation schemas using Zod

import { z } from 'zod';

export const NodeConfigSchema = z.object({
  corePort: z.number().int().min(1).max(65535).optional(),
  evmPort: z.number().int().min(1).max(65535).optional(),
  blockInterval: z.number().int().min(100).optional(),
  chainId: z.number().int().min(1).optional(),
  evmChainId: z.number().int().min(1).optional(),
  dataDir: z.string().min(1).optional(),
  silent: z.boolean().optional(),
  walletMode: z.enum(['mnemonic', 'privatekey']).optional(),
  mnemonic: z.string().optional(),
  privateKey: z.string().optional(),
  fundWallets: z.boolean().optional(),
  walletCount: z.number().int().min(1).max(100).optional(),
});

export const NodeStatusSchema = z.object({
  running: z.boolean(),
  corePort: z.number().int().optional(),
  evmPort: z.number().int().optional(),
  chainId: z.number().int().optional(),
  evmChainId: z.number().int().optional(),
  blockNumber: z.bigint().optional(),
  peerCount: z.number().int().optional(),
  walletMode: z.enum(['mnemonic', 'privatekey']).optional(),
  wallets: z.array(z.any()).optional(), // Will be validated with WalletInfoSchema
  miningAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  uptime: z.number().optional(),
  lastBlockTime: z.date().optional(),
});

export type NodeConfigType = z.infer<typeof NodeConfigSchema>;
export type NodeStatusType = z.infer<typeof NodeStatusSchema>;
